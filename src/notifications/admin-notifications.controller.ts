import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindNotifications,
  ApiMarkRead,
} from './decorators/notifications.swagger';
import { FindNotificationsQueryDto } from './dto/find-notifications-query.dto';
import { NotificationsService } from './notifications.service';

/** A ChantierOS staff member's own platform alerts (new company, failed payment...). */
@ApiTags('Notifications')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiFindNotifications()
  findAll(
    @Query() query: FindNotificationsQueryDto,
    @Actor() actor: RequestActor,
  ) {
    return this.notificationsService.findAll(recipientOf(actor), query);
  }

  @Patch(':id/read')
  @ApiMarkRead()
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: RequestActor,
  ) {
    return this.notificationsService.markOneRead(id, recipientOf(actor));
  }
}

/** `AdminAuthGuard` has already run, so the admin id is always set. */
function recipientOf(actor: RequestActor) {
  return { adminUserId: actor.adminUserId as number };
}
