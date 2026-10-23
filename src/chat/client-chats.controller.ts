import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { MAX_EMAIL_ATTACHMENT_BYTES } from '../media/helpers/media.helper';
import { ClientChatsService } from './client-chats.service';
import {
  ApiAddClientAddress,
  ApiCreateClientFromChat,
  ApiDeleteClientChat,
  ApiFindClientChat,
  ApiFindChatTopics,
  ApiFindClientChats,
  ApiFindProjectTopics,
  ApiFindTopicMessages,
  ApiMarkClientChatRead,
  ApiMoveMessage,
  ApiReplyInTopic,
  ApiSendNewEmail,
  ApiSetTopicProject,
  ApiUploadEmailAttachment,
} from './decorators/client-chats.swagger';
import {
  AddClientAddressDto,
  FindChatTopicsQueryDto,
  FindClientChatQueryDto,
  FindClientChatsQueryDto,
  FindTopicMessagesQueryDto,
  MoveMessageDto,
  ReplyInTopicDto,
  SendNewEmailDto,
  SetTopicProjectDto,
} from './dto/client-chat.dto';

/**
 * Step 25 — email with clients (doc/notes/client-email.md): one chat per
 * client and inbox, with email topics. The reading rule (company inbox vs
 * personal Gmail) is checked in every handler; `tenant_id` comes from the JWT.
 */
@ApiTags('Client chats')
@UseInterceptors(SnakeCaseInterceptor)
@Controller()
export class ClientChatsController {
  constructor(private readonly clientChatsService: ClientChatsService) {}

  @Get('client-chats')
  @TenantAuth()
  @Module('email')
  @ApiFindClientChats()
  findAll(
    @Query() query: FindClientChatsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.findAll(query, actor);
  }

  @Post('client-chats/emails')
  @TenantAuth()
  @Module('email')
  @ApiSendNewEmail()
  newEmail(
    @Body() dto: SendNewEmailDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.newEmail(dto, actor);
  }

  @Post('client-chats/attachments')
  @TenantAuth()
  @Module('email')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_EMAIL_ATTACHMENT_BYTES + 1 },
    }),
  )
  @ApiUploadEmailAttachment()
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.upload(file, actor);
  }

  @Post('client-chats/topics/:topicId/reply')
  @TenantAuth()
  @Module('email')
  @ApiReplyInTopic()
  reply(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: ReplyInTopicDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.reply(topicId, dto, actor);
  }

  /** `email` edit by the guard; + `projects` edit (shared) or owner (Gmail) in the handler. */
  @Patch('client-chats/topics/:topicId/project')
  @TenantAuth()
  @Module('email')
  @ApiSetTopicProject()
  setProject(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: SetTopicProjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.setProject(topicId, dto, actor);
  }

  @Patch('client-chats/messages/:messageId/topic')
  @TenantAuth()
  @Module('email')
  @ApiMoveMessage()
  moveMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: MoveMessageDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.moveMessage(messageId, dto, actor);
  }

  @Get('client-chats/:id')
  @TenantAuth()
  @Module('email')
  @ApiFindClientChat()
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindClientChatQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.findOne(id, query, actor);
  }

  @Get('client-chats/:id/topics')
  @TenantAuth()
  @Module('email')
  @ApiFindChatTopics()
  topics(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindChatTopicsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.topics(id, query, actor);
  }

  @Get('client-chats/:id/topics/:topicId/messages')
  @TenantAuth()
  @Module('email')
  @ApiFindTopicMessages()
  topicMessages(
    @Param('id', ParseIntPipe) id: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: FindTopicMessagesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.topicMessages(id, topicId, query, actor);
  }

  /** Reading needs `email` view only — checked in the handler (POST would mean create). */
  @Post('client-chats/:id/read')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @ApiMarkClientChatRead()
  read(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.read(id, actor);
  }

  @Post('client-chats/:id/create-client')
  @TenantAuth()
  @Module('clients')
  @ApiCreateClientFromChat()
  createClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClientDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.createClient(id, dto, actor);
  }

  /** `clients` edit — checked in the handler. */
  @Post('client-chats/:id/add-address')
  @TenantAuth()
  @Module('email')
  @ApiAddClientAddress()
  addAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddClientAddressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.addAddress(id, dto, actor);
  }

  @Delete('client-chats/:id')
  @TenantAuth()
  @Module('settings')
  @ApiDeleteClientChat()
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.remove(id, actor);
  }

  @Get('projects/:id/email-topics')
  @TenantAuth()
  @Module('email')
  @ApiFindProjectTopics()
  projectTopics(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindTopicMessagesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.clientChatsService.projectTopics(id, query, actor);
  }
}
