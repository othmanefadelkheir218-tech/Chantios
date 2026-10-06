import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { MediaService } from '../../media/media.service';
import { FindMessagesQueryDto } from '../dto/find-messages-query.dto';
import { ChatGateway } from '../gateways/chat.gateway';
import { toMessageEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { MessageRepository } from '../repositories/message.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * The client's side of a project conversation (step 12's portal). The client
 * has no user account: it is identified by the `client_id` the portal token
 * carries, and it talks as `sender_type = 'client'`. The SAME membership check
 * as every other caller (`CheckAccessHandler`) decides whether it may read or
 * write — the client is a member of its project's thread, nothing else.
 *
 * The tenant comes from the portal token, put in `nestjs-cls` by
 * `PortalTokenGuard` before this runs, so every read here is tenant-scoped.
 */
@Injectable()
export class ClientMessagesHandler {
  constructor(
    @InjectPinoLogger(ClientMessagesHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly reads: MessageReadRepository,
    private readonly access: CheckAccessHandler,
    private readonly media: MediaService,
    private readonly gateway: ChatGateway,
  ) {}

  /** The project's messages, newest first. Opening them marks the client's unread ones as read. */
  async list(
    projectId: number,
    clientId: number,
    tenantId: number,
    { page, limit }: FindMessagesQueryDto,
  ) {
    const conversation = await this.threadOf(projectId, clientId);

    const [rows, total] = await this.messages.findMany(
      conversation.id,
      toSkip(page, limit),
      limit,
    );
    const files = await this.media.findByEntityIds(
      'message',
      rows.map((row) => row.id),
    );

    const markedIds = await this.reads.markReadForClient(
      conversation.id,
      clientId,
      tenantId,
    );
    for (const messageId of markedIds) {
      this.gateway.emitMessageRead(conversation.id, messageId, {
        type: 'client',
        id: clientId,
      });
    }
    return toPaginated(
      rows.map((row) => toMessageEntity(row, files.get(row.id) ?? [])),
      total,
      page,
      limit,
    );
  }

  /** The client writes: `sender_type = 'client'`, `sender_id = client_id`. */
  async send(projectId: number, clientId: number, content: string) {
    const conversation = await this.threadOf(projectId, clientId);
    if (conversation.isArchived) {
      throw new BadRequestException('This conversation is archived');
    }
    const text = content.trim();
    if (text.length === 0) {
      throw new BadRequestException('A message cannot be empty');
    }

    const created = await this.messages.create({
      tenantId: conversation.tenantId,
      conversationId: conversation.id,
      senderType: 'client',
      senderId: clientId,
      content: text,
    });
    const entity = toMessageEntity(created);

    this.gateway.emitNewMessage(conversation.id, entity);
    // TODO: step 13 — notify + email the employees of this project conversation
    this.logger.info(
      `Client ${clientId} wrote message ${created.id} on project ${projectId}`,
    );
    return entity;
  }

  /** The project's `project_client` thread, after the membership check for this client. */
  private async threadOf(projectId: number, clientId: number) {
    const conversation = await this.conversations.findByProject(
      projectId,
      'project_client',
    );
    if (!conversation) {
      this.logger.warn(`Project ${projectId} has no client conversation yet`);
      throw new NotFoundException('No conversation yet');
    }
    return this.access.assertMember(conversation.id, { clientId });
  }
}
