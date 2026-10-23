import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../../config/env.config';
import { NotificationsService } from '../../notifications/notifications.service';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import {
  EmailInboxRepository,
  InboxWithAddresses,
} from '../repositories/email-inbox.repository';

/**
 * Google refused our token (the user removed the access, or it expired):
 * the inbox becomes `disconnected` and the owner + the users with
 * `settings` get `email_mailbox_disconnected`, in-app + email
 * (doc/notes/client-email.md § Who does what). Alerted once: an inbox
 * already disconnected stays quiet.
 */
@Injectable()
export class MarkInboxBrokenHandler {
  constructor(
    @InjectPinoLogger(MarkInboxBrokenHandler.name)
    private readonly logger: PinoLogger,
    private readonly inboxes: EmailInboxRepository,
    private readonly notifications: NotificationsService,
    private readonly tenants: TenantsService,
    private readonly users: UsersService,
  ) {}

  async execute(inbox: InboxWithAddresses, reason: string): Promise<void> {
    const wasActive = inbox.status === 'active';
    await this.inboxes.updateStatus(inbox.id, 'disconnected', reason);
    this.logger.warn(`Gmail inbox ${inbox.id} disconnected: ${reason}`);
    if (!wasActive) return;

    const [tenant, owner] = await Promise.all([
      this.tenants.findForNotifications(inbox.tenantId),
      inbox.ownerUserId ? this.users.findByIdRaw(inbox.ownerUserId) : null,
    ]);
    await this.notifications.dispatch('email_mailbox_disconnected', {
      tenantId: inbox.tenantId,
      userIds: inbox.ownerUserId ? [inbox.ownerUserId] : [],
      payload: {
        entity_id: inbox.id,
        inbox_id: inbox.id,
        gmail_address: inbox.gmailAddress,
        owner_name: owner?.name ?? '',
        open_url: `${env.APP_URL}/${tenant?.locale ?? 'fr'}/settings/email`,
      },
    });
  }
}
