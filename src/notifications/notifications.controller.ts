import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SessionAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindNotifications,
  ApiMarkAllRead,
  ApiMarkRead,
  ApiUnreadCount,
} from './decorators/notifications.swagger';
import { FindNotificationsQueryDto } from './dto/find-notifications-query.dto';
import { NotificationsService } from './notifications.service';

/** A company user's own notifications. No module key: everyone reads their own. */
@ApiTags('Notifications')
@SessionAuth()
@UseInterceptors(SnakeCaseInterceptor)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiFindNotifications()
  findAll(
    @Query() query: FindNotificationsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.findAll(recipientOf(user), query);
  }

  @Get('unread-count')
  @ApiUnreadCount()
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.countUnread(recipientOf(user));
  }

  @Patch('read-all')
  @ApiMarkAllRead()
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markEveryRead(recipientOf(user));
  }

  @Patch(':id/read')
  @ApiMarkRead()
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markOneRead(id, recipientOf(user));
  }
}

function recipientOf(user: AuthenticatedUser) {
  return { userId: user.userId, tenantId: user.tenantId };
}
