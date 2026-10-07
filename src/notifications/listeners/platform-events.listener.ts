import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppEventsService } from '../../common/events/app-events.service';
import { NotificationsService } from '../notifications.service';

/**
 * Turns what other modules announce on the event bus into platform alerts.
 * `tenants` cannot call `NotificationsService` itself (module cycle), so it
 * emits `tenant.status_changed` and this listener dispatches
 * `tenant_status_changed` to ChantierOS staff.
 */
@Injectable()
export class PlatformEventsListener implements OnModuleInit {
  constructor(
    private readonly events: AppEventsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.events.on('tenant.status_changed', (event) =>
      this.notifications.dispatch('tenant_status_changed', {
        payload: {
          entity_id: event.tenantId,
          tenant_id: event.tenantId,
          company_name: event.companyName,
          status: event.status,
        },
      }),
    );
  }
}
