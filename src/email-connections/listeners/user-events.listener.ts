import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { AppEventsService } from '../../common/events/app-events.service';
import { DisconnectInboxHandler } from '../handlers/disconnect-inbox.handler';
import { EmailInboxRepository } from '../repositories/email-inbox.repository';

/**
 * A deactivated user's Gmail inboxes are removed at once — access revoked at
 * Google, token wiped (doc/notes/client-email.md § Who does what). Their
 * chats stay locked: the owner is gone, so nobody reads them.
 */
@Injectable()
export class UserEventsListener implements OnModuleInit {
  constructor(
    @InjectPinoLogger(UserEventsListener.name)
    private readonly logger: PinoLogger,
    private readonly events: AppEventsService,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
    private readonly inboxes: EmailInboxRepository,
    private readonly disconnect: DisconnectInboxHandler,
  ) {}

  onModuleInit(): void {
    this.events.on('user.deactivated', (event) =>
      this.onUserDeactivated(event.tenantId, event.userId),
    );
  }

  async onUserDeactivated(tenantId: number, userId: number): Promise<void> {
    await this.cls.run(async () => {
      this.tenantContext.setTenantId(tenantId);
      const owned = await this.inboxes.findForUser(userId);
      for (const inbox of owned) {
        await this.disconnect.remove(inbox, tenantId, null);
      }
      if (owned.length > 0) {
        this.logger.info(
          `User ${userId} deactivated: ${owned.length} Gmail inbox(es) removed`,
        );
      }
    });
  }
}
