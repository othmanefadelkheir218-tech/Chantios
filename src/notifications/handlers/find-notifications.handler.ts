import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindNotificationsQueryDto } from '../dto/find-notifications-query.dto';
import { NotificationRecipient } from '../notification.types';
import { NotificationRepository } from '../repositories/notification.repository';

/** `GET /api/notifications` and `GET /api/admin/notifications` — the caller's own rows, newest first. */
@Injectable()
export class FindNotificationsHandler {
  constructor(
    @InjectPinoLogger(FindNotificationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(
    recipient: NotificationRecipient,
    query: FindNotificationsQueryDto,
  ) {
    const { page, limit, is_read } = query;
    this.logger.debug(`Listing notifications (page ${page}, limit ${limit})`);
    const [data, total] = await this.notifications.findManyForRecipient(
      recipient,
      is_read,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
