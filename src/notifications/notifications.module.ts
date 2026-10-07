import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { TokenModule } from '../auth/token.module';
import { EmailModule } from '../email/email.module';
import { RolesModule } from '../roles/roles.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { DispatchNotificationHandler } from './handlers/dispatch-notification.handler';
import { FindNotificationsHandler } from './handlers/find-notifications.handler';
import { MarkAllReadHandler } from './handlers/mark-all-read.handler';
import { MarkReadHandler } from './handlers/mark-read.handler';
import { UnreadCountHandler } from './handlers/unread-count.handler';
import { PlatformEventsListener } from './listeners/platform-events.listener';
import { NOTIFICATIONS_QUEUE } from './notification.types';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TokenModule,
    EmailModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    AdminUsersModule,
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsService,
    NotificationRepository,
    NotificationsGateway,
    NotificationProcessor,
    PlatformEventsListener,
    DispatchNotificationHandler,
    FindNotificationsHandler,
    MarkReadHandler,
    MarkAllReadHandler,
    UnreadCountHandler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
