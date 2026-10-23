import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Conversation, ConversationTopic } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { readSubjectCode } from '../../common/helpers/subject-code.helper';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import {
  EmailConnectionsService,
  InboxSummary,
} from '../../email-connections/email-connections.service';
import { MediaService } from '../../media/media.service';
import { ReplyInTopicDto } from '../dto/client-chat.dto';
import { ChatGateway } from '../gateways/chat.gateway';
import { toEmailMessageEntity } from '../helpers/client-chat.helper';
import { MAX_EMAIL_ATTACHMENT_BYTES } from '../../media/helpers/media.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

export interface DeliverInput {
  topic: ConversationTopic;
  conversation: Conversation;
  inbox: InboxSummary;
  to: string;
  content: string;
  mediaIds: number[];
  isReply: boolean;
}

/**
 * `POST /api/client-chats/topics/:topicId/reply` — the answer goes to the
 * address of the client's LAST email in this topic (else the chat's address),
 * from the SAME inbox as the topic (doc/notes/client-email.md § Replying).
 * `deliver` is also what a new email uses: send first, then save — a failed
 * send saves nothing and never falls back to another inbox.
 */
@Injectable()
export class ReplyInTopicHandler {
  constructor(
    @InjectPinoLogger(ReplyInTopicHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly access: ClientChatAccessHandler,
    private readonly messages: MessageRepository,
    private readonly conversations: ConversationRepository,
    private readonly clients: ClientsService,
    private readonly media: MediaService,
    private readonly emailConnections: EmailConnectionsService,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(
    topicId: number,
    dto: ReplyInTopicDto,
    actor: AuthenticatedUser,
  ) {
    const { topic, conversation, inbox } = await this.access.assertTopic(
      topicId,
      actor,
    );
    const inbound = await this.messages.findInboundEmailsOfTopic(topic.id);
    const to =
      inbound.at(-1)?.fromAddress ?? (await this.chatAddress(conversation));
    if (!to) throw new BadRequestException('This chat has no email address');
    return this.deliver(
      {
        topic,
        conversation,
        inbox,
        to,
        content: dto.content,
        mediaIds: dto.media_ids ?? [],
        isReply: true,
      },
      actor,
    );
  }

  /** Sends one email of a topic, then saves it as an outbound message. */
  async deliver(input: DeliverInput, actor: AuthenticatedUser) {
    const content = input.content.trim();
    if (!content) throw new BadRequestException('An email cannot be empty');
    if (input.inbox.status !== 'active') {
      throw new ConflictException(
        input.inbox.kind === 'gmail'
          ? 'Your Gmail is disconnected'
          : 'This inbox cannot send',
      );
    }
    if (
      input.inbox.kind === 'gmail' &&
      input.inbox.ownerUserId !== actor.userId
    ) {
      throw new ConflictException('Only the owner sends from this Gmail');
    }
    const files = await this.media.findAttachable(
      input.mediaIds,
      'email_attachment',
      actor,
    );
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
    if (totalSize > MAX_EMAIL_ATTACHMENT_BYTES) {
      throw new BadRequestException('The files are over 25 MB in total');
    }

    const inbound = await this.messages.findInboundEmailsOfTopic(
      input.topic.id,
    );
    const references = inbound.flatMap((email) =>
      email.headerMessageId ? [email.headerMessageId] : [],
    );
    // The client's last email still carries our `[#code]`: the thread was
    // started by us, so every email in it keeps that subject.
    const threadHasCode =
      readSubjectCode(inbound.at(-1)?.subject) === input.topic.subjectCode;
    this.logger.info(
      `User ${actor.userId} sends an email in topic ${input.topic.id} to ${input.to}`,
    );
    const sent = await this.emailConnections.send({
      inboxId: input.inbox.id,
      to: [input.to],
      subject: input.topic.subject,
      isReply: input.isReply,
      subjectCode: input.topic.subjectCode,
      threadHasCode,
      replyToken: input.topic.replyToken,
      text: content,
      references,
      attachments: files.map((file) => ({
        filename: file.fileName,
        url: file.fileUrl,
        mimeType: file.fileType,
      })),
    });

    const sentAt = new Date();
    const message = await this.tenantPrisma.db.$transaction(async (tx) => {
      const created = await this.messages.createEmailMessage(
        {
          tenantId: input.conversation.tenantId,
          conversationId: input.conversation.id,
          topicId: input.topic.id,
          senderType: 'employee',
          senderId: actor.userId,
          content,
        },
        {
          tenantId: input.conversation.tenantId,
          direction: 'outbound',
          transport: sent.transport,
          inboxId: input.inbox.id,
          inReplyTo: sent.inReplyTo,
          referencesIds: references,
          fromAddress: sent.fromAddress,
          fromName: sent.fromName,
          toAddresses: [input.to],
          subject: sent.subject.slice(0, 998),
          html: sent.html,
          textFull: content,
          resendEmailId: sent.resendEmailId,
          gmailMessageId: sent.gmailMessageId,
        },
        tx,
      );
      await this.media.attachToEntity(
        input.mediaIds,
        'email_attachment',
        created.id,
        actor,
        tx,
      );
      await this.conversations.touchTopic(input.topic.id, sentAt, tx);
      return created;
    });

    const saved = await this.media.findByEntityIds('email_attachment', [
      message.id,
    ]);
    const entity = toEmailMessageEntity(message, saved.get(message.id) ?? []);
    this.gateway.emitNewMessage(input.conversation.id, entity);
    this.logger.info(
      `Email message ${message.id} sent through ${sent.transport} (topic ${input.topic.id})`,
    );
    return entity;
  }

  /** No email from the client in this topic yet: the chat's own address. */
  private async chatAddress(
    conversation: Conversation,
  ): Promise<string | null> {
    if (!conversation.clientId) return conversation.contactEmail;
    const client = await this.clients.findByIdRaw(conversation.clientId);
    return client?.email ?? null;
  }
}
