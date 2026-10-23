import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import { decryptSecret } from '../../common/helpers/crypto.helper';
import { RolesService } from '../../roles/roles.service';
import { revokeToken } from '../helpers/gmail-oauth.helper';
import {
  EmailInboxRepository,
  InboxWithAddresses,
} from '../repositories/email-inbox.repository';

/**
 * `DELETE /api/email-inboxes/:id` — the owner removes their Gmail, or a user
 * with `settings` edit removes anyone's (an employee leaves). The access is
 * revoked at Google, the token wiped, the inbox `removed`. Removing never
 * gives read access: the chats stay locked (doc/notes/client-email.md).
 */
@Injectable()
export class DisconnectInboxHandler {
  constructor(
    @InjectPinoLogger(DisconnectInboxHandler.name)
    private readonly logger: PinoLogger,
    private readonly inboxes: EmailInboxRepository,
    private readonly roles: RolesService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    const inbox = await this.inboxes.findById(id);
    if (!inbox || inbox.status === 'removed') {
      this.logger.warn(`Cannot remove inbox ${id}: not found`);
      throw new NotFoundException('Inbox not found');
    }
    if (inbox.kind === 'company') {
      throw new BadRequestException('The company address cannot be removed');
    }
    if (inbox.ownerUserId !== actor.userId) {
      const can = await loadPermissions(this.roles, actor.roleId);
      if (!can('settings').canEdit) {
        this.logger.warn(
          `User ${actor.userId} may not remove inbox ${id} of user ${inbox.ownerUserId}`,
        );
        throw new ForbiddenException('Only the owner or an admin can do this');
      }
    }
    await this.remove(inbox, actor.tenantId, actor.userId);
    return { id, status: 'removed' as const };
  }

  /**
   * The removal itself, no permission check — also used when the owner is
   * deactivated (`user.deactivated`).
   */
  async remove(
    inbox: InboxWithAddresses,
    tenantId: number,
    actorUserId: number | null,
  ): Promise<void> {
    this.logger.info(`Removing Gmail inbox ${inbox.id}`);
    if (inbox.refreshTokenEncrypted) {
      try {
        const revoked = await revokeToken(
          decryptSecret(inbox.refreshTokenEncrypted),
        );
        if (!revoked)
          this.logger.warn(`Google did not revoke inbox ${inbox.id}`);
      } catch (error: unknown) {
        this.logger.warn({ err: error }, `Revoke failed for inbox ${inbox.id}`);
      }
    }
    await this.inboxes.updateStatus(inbox.id, 'removed');
    await this.inboxes.wipeToken(inbox.id);
    await this.audit.write({
      tenantId,
      userId: actorUserId,
      action: 'gmail_remove',
      entityType: 'email_inbox',
      entityId: inbox.id,
      oldValue: { status: inbox.status, gmail_address: inbox.gmailAddress },
      newValue: { status: 'removed' },
      ipAddress: null,
    });
    this.logger.info(`Gmail inbox ${inbox.id} removed`);
  }
}
