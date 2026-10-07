import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FindNotificationsQueryDto } from './dto/find-notifications-query.dto';
import { DispatchNotificationHandler } from './handlers/dispatch-notification.handler';
import { FindNotificationsHandler } from './handlers/find-notifications.handler';
import { MarkAllReadHandler } from './handlers/mark-all-read.handler';
import { MarkReadHandler } from './handlers/mark-read.handler';
import { UnreadCountHandler } from './handlers/unread-count.handler';
import {
  DispatchContext,
  NotificationRecipient,
  NotificationType,
} from './notification.types';
import { NotificationRepository } from './repositories/notification.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectPinoLogger(NotificationsService.name)
    private readonly logger: PinoLogger,
    private readonly dispatchNotification: DispatchNotificationHandler,
    private readonly findNotifications: FindNotificationsHandler,
    private readonly markRead: MarkReadHandler,
    private readonly markAllRead: MarkAllReadHandler,
    private readonly unreadCount: UnreadCountHandler,
    private readonly notifications: NotificationRepository,
  ) {}

  /**
   * The ONLY way any module raises an alert. It never throws: the action that
   * raised it (a saved time entry, a sent message) is already committed, and
   * an alert problem must not undo or fail it.
   */
  async dispatch(
    type: NotificationType,
    context: DispatchContext,
  ): Promise<void> {
    try {
      await this.dispatchNotification.execute(type, context);
    } catch (err: unknown) {
      this.logger.error({ err }, `Alert ${type} could not be dispatched`);
    }
  }

  findAll(recipient: NotificationRecipient, query: FindNotificationsQueryDto) {
    return this.findNotifications.execute(recipient, query);
  }

  markOneRead(id: number, recipient: NotificationRecipient) {
    return this.markRead.execute(id, recipient);
  }

  markEveryRead(recipient: NotificationRecipient) {
    return this.markAllRead.execute(recipient);
  }

  countUnread(recipient: NotificationRecipient) {
    return this.unreadCount.execute(recipient);
  }

  // ---- Internal API for the retention cron ----

  /** Deletes the READ notifications of one company older than `before`. */
  purgeReadBefore(tenantId: number, before: Date): Promise<number> {
    return this.notifications.deleteReadOlderThan(tenantId, before);
  }
}
