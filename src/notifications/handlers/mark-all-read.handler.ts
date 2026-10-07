import { Injectable } from '@nestjs/common';
import { NotificationRecipient } from '../notification.types';
import { NotificationRepository } from '../repositories/notification.repository';

/** `PATCH /api/notifications/read-all` — marks the caller's own unread rows. */
@Injectable()
export class MarkAllReadHandler {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(recipient: NotificationRecipient) {
    const updated = await this.notifications.markAllRead(recipient);
    return { updated };
  }
}
