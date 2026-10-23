import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateClientDto } from '../clients/dto/create-client.dto';
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
import { DeleteClientChatHandler } from './handlers/delete-client-chat.handler';
import { FindChatTopicsHandler } from './handlers/find-chat-topics.handler';
import { FindClientChatsHandler } from './handlers/find-client-chats.handler';
import { MarkClientChatReadHandler } from './handlers/mark-client-chat-read.handler';
import { MoveMessageTopicHandler } from './handlers/move-message-topic.handler';
import { ReplyInTopicHandler } from './handlers/reply-in-topic.handler';
import { ResolveContactHandler } from './handlers/resolve-contact.handler';
import { SendNewEmailHandler } from './handlers/send-new-email.handler';
import { SetTopicProjectHandler } from './handlers/set-topic-project.handler';
import { UploadEmailAttachmentHandler } from './handlers/upload-email-attachment.handler';

/**
 * Step 25 — the client chats (doc/notes/client-email.md). Orchestration only,
 * kept apart from `ChatService` so neither becomes a god service.
 */
@Injectable()
export class ClientChatsService {
  constructor(
    private readonly findClientChats: FindClientChatsHandler,
    private readonly findChatTopics: FindChatTopicsHandler,
    private readonly sendNewEmail: SendNewEmailHandler,
    private readonly replyInTopic: ReplyInTopicHandler,
    private readonly setTopicProject: SetTopicProjectHandler,
    private readonly moveMessageTopic: MoveMessageTopicHandler,
    private readonly markRead: MarkClientChatReadHandler,
    private readonly resolveContact: ResolveContactHandler,
    private readonly deleteClientChat: DeleteClientChatHandler,
    private readonly uploadAttachment: UploadEmailAttachmentHandler,
  ) {}

  findAll(query: FindClientChatsQueryDto, actor: AuthenticatedUser) {
    return this.findClientChats.list(query, actor);
  }

  findOne(id: number, query: FindClientChatQueryDto, actor: AuthenticatedUser) {
    return this.findClientChats.one(id, actor, query.topic_id);
  }

  topics(id: number, query: FindChatTopicsQueryDto, actor: AuthenticatedUser) {
    return this.findChatTopics.list(id, query, actor);
  }

  topicMessages(
    id: number,
    topicId: number,
    query: FindTopicMessagesQueryDto,
    actor: AuthenticatedUser,
  ) {
    return this.findClientChats.topicMessages(id, topicId, query, actor);
  }

  projectTopics(
    projectId: number,
    query: FindTopicMessagesQueryDto,
    actor: AuthenticatedUser,
  ) {
    return this.findClientChats.projectTopics(projectId, query, actor);
  }

  newEmail(dto: SendNewEmailDto, actor: AuthenticatedUser) {
    return this.sendNewEmail.execute(dto, actor);
  }

  reply(topicId: number, dto: ReplyInTopicDto, actor: AuthenticatedUser) {
    return this.replyInTopic.execute(topicId, dto, actor);
  }

  setProject(
    topicId: number,
    dto: SetTopicProjectDto,
    actor: AuthenticatedUser,
  ) {
    return this.setTopicProject.execute(topicId, dto, actor);
  }

  moveMessage(
    messageId: number,
    dto: MoveMessageDto,
    actor: AuthenticatedUser,
  ) {
    return this.moveMessageTopic.execute(messageId, dto, actor);
  }

  read(id: number, actor: AuthenticatedUser) {
    return this.markRead.execute(id, actor);
  }

  addAddress(id: number, dto: AddClientAddressDto, actor: AuthenticatedUser) {
    return this.resolveContact.addAddress(id, dto, actor);
  }

  createClient(id: number, dto: CreateClientDto, actor: AuthenticatedUser) {
    return this.resolveContact.createClient(id, dto, actor);
  }

  remove(id: number, actor: AuthenticatedUser) {
    return this.deleteClientChat.execute(id, actor);
  }

  upload(file: Express.Multer.File, actor: AuthenticatedUser) {
    return this.uploadAttachment.execute(file, actor);
  }
}
