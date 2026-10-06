import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ChatService } from './chat.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { FindConversationsQueryDto } from './dto/find-conversations-query.dto';
import { FindMessagesQueryDto } from './dto/find-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';

/**
 * The tenant side of chat. Every route is `chat:*` AND a membership check: a
 * conversation is only ever readable by the people in it (`403` for a same-
 * tenant non-member, `404` for another tenant's conversation).
 */
@ApiTags('Chat')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** `internal` only from here. */
  @Post()
  @TenantAuth()
  @Module('chat')
  create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('chat')
  findAll(
    @Query() query: FindConversationsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.findAll(query, actor);
  }

  /** Declared before `:id` so `unread-count` is never read as an id. */
  @Get('unread-count')
  @TenantAuth()
  @Module('chat')
  unread(@CurrentUser() actor: AuthenticatedUser) {
    return this.chatService.unread(actor);
  }

  @Get(':id')
  @TenantAuth()
  @Module('chat')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.findOne(id, actor);
  }

  @Post(':id/members')
  @TenantAuth()
  @Module('chat')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.members(id, dto, actor);
  }

  /** `is_archived = true` — never a delete. */
  @Patch(':id/archive')
  @TenantAuth()
  @Module('chat')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.archive(id, actor);
  }

  /** Newest first. */
  @Get(':id/messages')
  @TenantAuth()
  @Module('chat')
  messages(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindMessagesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.messages(id, query, actor);
  }

  @Post(':id/messages')
  @TenantAuth()
  @Module('chat')
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.send(id, dto, actor);
  }

  /** Opening the conversation: writes `message_reads`, first time only. */
  @Post(':id/read')
  @TenantAuth()
  @Module('chat')
  read(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.chatService.read(id, actor);
  }
}
