import { Injectable } from '@nestjs/common';
import { NotificationRecipient } from '../notification.types';
import { NotificationRepository } from '../repositories/notification.repository';

/** `GET /api/notifications/unread-count` — the bell badge. */
@Injectable()
export class UnreadCountHandler {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(recipient: NotificationRecipient) {
    return { unread: await this.notifications.countUnread(recipient) };
  }
}
