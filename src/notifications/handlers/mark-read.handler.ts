import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationRecipient } from '../notification.types';
import { NotificationRepository } from '../repositories/notification.repository';

/**
 * `PATCH /api/notifications/:id/read`. Own rows only: a row that does not
 * exist is `404`, a row that belongs to someone else is `403` — and it is
 * never changed.
 */
@Injectable()
export class MarkReadHandler {
  constructor(
    @InjectPinoLogger(MarkReadHandler.name)
    private readonly logger: PinoLogger,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(id: number, recipient: NotificationRecipient) {
    const marked = await this.notifications.markRead(id, recipient);
    if (marked) return marked;

    const existing = await this.notifications.findById(id);
    if (!existing) throw new NotFoundException('Notification not found');
    this.logger.warn(`Notification ${id}: someone else tried to mark it read`);
    throw new ForbiddenException('This notification is not yours');
  }
}
