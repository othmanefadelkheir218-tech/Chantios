import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/swagger/api-paginated.decorator';
import {
  NotificationEntity,
  UnreadCountEntity,
} from '../entities/notification.entity';

export const ApiFindNotifications = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List my notifications',
      description:
        'Only the notifications of the caller, newest first. Use `?is_read=false` for the unread ones.',
    }),
    ApiPaginatedResponse(NotificationEntity, 'Paginated notifications'),
  );

export const ApiUnreadCount = () =>
  applyDecorators(
    ApiOperation({ summary: 'How many notifications I have not read' }),
    ApiOkResponse({ type: UnreadCountEntity }),
  );

export const ApiMarkRead = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Mark one of my notifications as read',
      description:
        '`404` if it does not exist, `403` if it belongs to someone else.',
    }),
    ApiOkResponse({ type: NotificationEntity }),
  );

export const ApiMarkAllRead = () =>
  applyDecorators(
    ApiOperation({ summary: 'Mark all my notifications as read' }),
  );
