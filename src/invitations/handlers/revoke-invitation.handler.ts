import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toInvitationEntity } from '../helpers/invitation.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/** `DELETE /api/invitations/:id` — admin only. */
@Injectable()
export class RevokeInvitationHandler {
  constructor(
    @InjectPinoLogger(RevokeInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Revoking invitation ${id}`);

    const invitation = await this.invitations.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation was already accepted');
    }

    await this.invitations.delete(id);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'revoke',
      entityType: 'user_invitation',
      entityId: id,
      oldValue: toInvitationEntity(invitation),
      ipAddress: null,
    });
    this.logger.info(`Invitation revoked: ${id}`);
    return { revoked: true };
  }
}
