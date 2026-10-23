import { Injectable } from '@nestjs/common';
import { Client, Conversation, ConversationTopic } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { env } from '../../config/env.config';
import {
  EmailConnectionsService,
  InboxSummary,
} from '../../email-connections/email-connections.service';
import { htmlToText } from '../../email/helpers/html-to-text.helper';
import { MediaService } from '../../media/media.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectsService } from '../../projects/projects.service';
import { TenantsService } from '../../tenants/tenants.service';
import { InboundEmailInput } from '../dto/inbound-email-input.dto';
import { ChatGateway } from '../gateways/chat.gateway';
import {
  SkippedAttachment,
  toEmailMessageEntity,
} from '../helpers/client-chat.helper';
import { previewOf } from '../helpers/message-alert.helper';
import { decideTopicTag } from '../helpers/topic-project.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';

type TopicWithConversation = ConversationTopic & { conversation: Conversation };

/**
 * One received email → a message in a client chat (doc/notes/client-email.md
 * § One chat per client, § How a client's reply finds its topic, § What we save).
 *
 * The topic, in order (D3 — no guessing by subject):
 *   company inbox: 1. the reply token, 2. `References` / `In-Reply-To`;
 *   Gmail inbox:   1. the `[#code]` in the subject, 2. `References` / `In-Reply-To`;
 *   else a NEW topic, tagged by `topic-project.helper`.
 *
 * The client: any of its addresses. On a known topic, an address that is not
 * the client's is kept but flagged `new_address` (never added automatically).
 * An unknown sender gets a `contact` chat. Files → media `email_attachment`
 * (D2); a blocked or too big file is only listed. Then the socket event and
 * the `new_email` alert (in-app always, email only to who is offline).
 */
@Injectable()
export class ReceiveInboundEmailHandler {
  constructor(
    @InjectPinoLogger(ReceiveInboundEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly media: MediaService,
    private readonly emailConnections: EmailConnectionsService,
    private readonly notifications: NotificationsService,
    private readonly tenants: TenantsService,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(input: InboundEmailInput): Promise<number | null> {
    if (await this.messages.existsResendEmail(input.resendEmailId)) {
      this.logger.warn(`Resend email ${input.resendEmailId} already saved`);
      return null;
    }
    const inbox = await this.emailConnections.findSummary(input.inboxId);
    if (!inbox) throw new Error(`Inbox ${input.inboxId} not found`);

    const client = await this.clients.findByAnyEmail(input.from.address);
    const known = await this.findTopic(input, inbox);
    const { topic, conversation, needsProject } = known
      ? { topic: known, conversation: known.conversation, needsProject: false }
      : await this.openTopic(input, inbox, client);

    const fromClient =
      conversation.clientId !== null && client?.id === conversation.clientId;
    const fromContact =
      conversation.clientId === null &&
      conversation.contactEmail?.toLowerCase() === input.from.address;
    const newAddress = known !== null && !fromClient && !fromContact;

    const content =
      input.cleanText ||
      (input.html ? htmlToText(input.html).trim() : '') ||
      '(empty email)';
    const receivedAt = new Date();
    const message = await this.tenantPrisma.db.$transaction(async (tx) => {
      const created = await this.messages.createEmailMessage(
        {
          tenantId: input.tenantId,
          conversationId: conversation.id,
          topicId: topic.id,
          senderType: conversation.clientId !== null ? 'client' : 'contact',
          senderId: conversation.clientId,
          content,
        },
        {
          tenantId: input.tenantId,
          direction: 'inbound',
          inboxId: inbox.id,
          headerMessageId: input.headerMessageId,
          inReplyTo: input.inReplyTo,
          referencesIds: input.references,
          fromAddress: input.from.address,
          fromName: input.from.name,
          toAddresses: input.to,
          ccAddresses: input.cc,
          subject: input.subject.slice(0, 998),
          html: input.html,
          textFull: input.text,
          resendEmailId: input.resendEmailId,
          newAddress,
        },
        tx,
      );
      await this.conversations.touchTopic(topic.id, receivedAt, tx);
      return created;
    });

    await this.saveAttachments(input, message.id);
    const saved = (await this.messages.findWithEmail(message.id)) ?? message;
    const files = await this.media.findByEntityIds('email_attachment', [
      message.id,
    ]);
    this.gateway.emitNewMessage(
      conversation.id,
      toEmailMessageEntity(saved, files.get(message.id) ?? []),
    );
    await this.emailConnections.touchReceived(inbox.id);
    await this.alert(
      input,
      inbox,
      conversation,
      topic,
      client,
      needsProject,
      content,
      message.id,
    );

    this.logger.info(
      `Email ${input.resendEmailId} saved as message ${message.id} (topic ${topic.id}, ${known ? 'known' : 'new'} topic${newAddress ? ', new address' : ''})`,
    );
    return message.id;
  }

  /** D3 — the topic of a reply, or null (a new topic). */
  private async findTopic(
    input: InboundEmailInput,
    inbox: InboxSummary,
  ): Promise<TopicWithConversation | null> {
    const inThisInbox = (topic: TopicWithConversation | null) =>
      topic && topic.conversation.inboxId === inbox.id ? topic : null;

    if (inbox.kind === 'company' && input.replyTopicId) {
      const byToken = inThisInbox(
        await this.conversations.findTopicById(input.replyTopicId),
      );
      if (byToken) return byToken;
    }
    if (inbox.kind === 'gmail' && input.subjectCode) {
      const byCode = await this.conversations.findTopicBySubjectCode(
        inbox.id,
        input.subjectCode,
      );
      if (byCode) {
        const topic = inThisInbox(
          await this.conversations.findTopicById(byCode.id),
        );
        if (topic) return topic;
      }
    }
    const headerIds = [
      ...input.references,
      ...(input.inReplyTo ? [input.inReplyTo] : []),
    ];
    const topicId = await this.messages.findTopicByHeaderIds(
      inbox.id,
      headerIds,
    );
    return topicId
      ? inThisInbox(await this.conversations.findTopicById(topicId))
      : null;
  }

  /** A new topic in the client's (or the contact's) chat of this inbox. */
  private async openTopic(
    input: InboundEmailInput,
    inbox: InboxSummary,
    client: Client | null,
  ) {
    const conversation = await this.conversations.ensureClientConversation({
      tenantId: input.tenantId,
      inboxId: inbox.id,
      clientId: client?.id ?? null,
      contactEmail: client ? null : input.from.address,
      contactName: client ? null : input.from.name,
    });
    const open = conversation.clientId
      ? await this.projects.findOpenForClient(conversation.clientId)
      : [];
    const tag = decideTopicTag({
      kind: 'client_new_topic',
      openProjectIds: open.map((project) => project.id),
    });
    const topic = await this.conversations.createTopic({
      tenantId: input.tenantId,
      conversationId: conversation.id,
      subject: input.topicSubject,
      projectId: tag.projectId,
      projectSuggested: tag.suggested,
      createdBy: null,
    });
    this.logger.info(
      `New topic ${topic.id} in chat ${conversation.id} (project ${tag.projectId ?? 'none'}${tag.suggested ? ', suggested' : ''})`,
    );
    return {
      topic: { ...topic, conversation },
      conversation,
      needsProject: tag.needsProject,
    };
  }

  /**
   * D2 — every file is checked by name and type; a kept one goes to media
   * (`email_attachment`, entity = the message); an inline image's `cid:` in
   * the HTML becomes its URL. The others are listed in `skipped_attachments`.
   */
  private async saveAttachments(
    input: InboundEmailInput,
    messageId: number,
  ): Promise<void> {
    if (input.attachments.length === 0) return;
    const skipped: SkippedAttachment[] = [];
    let html = input.html;
    for (const file of input.attachments) {
      const check = this.media.checkEmailAttachment(
        file.filename,
        file.contentType,
        file.size,
      );
      if (!check.ok) {
        skipped.push({ filename: file.filename, reason: check.reason });
        continue;
      }
      try {
        const buffer = await file.load();
        const uploaded = await this.media.uploadBuffer(
          buffer,
          file.filename,
          check.mimeType,
          { entity_type: 'email_attachment', entity_id: messageId },
          { tenantId: input.tenantId, userId: null },
        );
        if (html && file.contentId) {
          html = html.split(`cid:${file.contentId}`).join(uploaded.fileUrl);
        }
      } catch (error: unknown) {
        this.logger.error(
          { err: error },
          `Attachment "${file.filename}" of message ${messageId} not saved`,
        );
        skipped.push({ filename: file.filename, reason: 'upload_failed' });
      }
    }
    await this.messages.updateEmailContent(messageId, html, skipped);
  }

  /** `new_email`: company inbox → everyone with `email`; Gmail → the owner only. */
  private async alert(
    input: InboundEmailInput,
    inbox: InboxSummary,
    conversation: Conversation,
    topic: ConversationTopic,
    client: Client | null,
    needsProject: boolean,
    content: string,
    messageId: number,
  ): Promise<void> {
    const tenant = await this.tenants.findForNotifications(input.tenantId);
    const locale = tenant?.locale ?? 'fr';
    await this.notifications.dispatch('new_email', {
      tenantId: input.tenantId,
      ...(inbox.kind === 'gmail' && {
        userIds: inbox.ownerUserId ? [inbox.ownerUserId] : [],
      }),
      emailOnlyIfOffline: true,
      payload: {
        entity_id: messageId,
        conversation_id: conversation.id,
        topic_id: topic.id,
        inbox_id: inbox.id,
        sender_name: client?.name ?? input.from.name ?? input.from.address,
        subject: input.topicSubject,
        preview: previewOf(content),
        needs_project: needsProject,
        open_url: `${env.APP_URL}/${locale}/chat/clients/${conversation.id}?topic=${topic.id}`,
      },
    });
  }
}
