import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ChatService } from './chat.service';
import { AdminSendSupportMessageDto } from './dto/admin-send-support-message.dto';
import {
  AdminSupportQueryDto,
  AdminSupportTenantQueryDto,
} from './dto/admin-support-query.dto';

/**
 * The platform's support door — the cross-tenant escape hatch decided
 * 2026-10-06 (doc/notes/chat-conversations.md). It is the ONLY place a
 * conversation is read outside its tenant, and it is built to be small:
 * `AdminAuthGuard`, an explicit `tenant_id` the ticket must belong to, the
 * unwrapped client only inside two named repository methods, and an
 * `audit_logs` row on every call.
 */
@ApiTags('Support')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':ticketId/messages')
  read(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query() query: AdminSupportQueryDto,
    @Actor() actor: RequestActor,
  ) {
    return this.chatService.adminReadSupport(ticketId, query, actor);
  }

  @Post(':ticketId/messages')
  reply(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query() query: AdminSupportTenantQueryDto,
    @Body() dto: AdminSendSupportMessageDto,
    @Actor() actor: RequestActor,
  ) {
    return this.chatService.adminReplySupport(
      ticketId,
      query.tenant_id,
      dto,
      actor,
    );
  }
}
