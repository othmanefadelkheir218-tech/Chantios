import { Conversation, ConversationTopic, Prisma } from '@prisma/client';
import { stripSubjectCode } from '../../common/helpers/subject-code.helper';
import type { InboxSummary } from '../../email-connections/email-connections.service';
import type { MessageWithEmail } from '../repositories/message.repository';
import { AttachmentEntity, toMessageEntity } from './chat.helper';

/** A file of an email that was NOT saved (D2), shown by name. */
export interface SkippedAttachment {
  filename: string;
  reason: 'blocked_type' | 'too_large' | 'upload_failed';
}

/** The inbox as the client chat shows it — no token, no owner details. */
export function toInboxRef(inbox: InboxSummary) {
  return {
    id: inbox.id,
    kind: inbox.kind,
    status: inbox.status,
    address: inbox.address,
  };
}

/** One email topic. The reply token and the subject code never leave the server. */
export function toTopicEntity(
  topic: ConversationTopic,
  projectName: string | null,
  extra: { hasNewAddress?: boolean } = {},
) {
  return {
    id: topic.id,
    channel: 'email' as const,
    conversationId: topic.conversationId,
    subject: topic.subject,
    projectId: topic.projectId,
    projectName,
    projectSuggested: topic.projectSuggested,
    hasNewAddress: extra.hasNewAddress ?? false,
    lastMessageAt: topic.lastMessageAt,
    createdAt: topic.createdAt,
  };
}

/** A client chat in the list. */
export function toClientChatEntity(
  conversation: Conversation & { lastMessageAt?: Date | null },
  details: {
    clientName: string | null;
    inbox: InboxSummary | null;
    unread: number;
    lastMessage: MessageWithEmail | null;
    hasPortal: boolean;
  },
) {
  const last = details.lastMessage;
  return {
    id: conversation.id,
    clientId: conversation.clientId,
    clientName: details.clientName,
    contactEmail: conversation.contactEmail,
    contactName: conversation.contactName,
    isUnknownContact: conversation.clientId === null,
    inbox: details.inbox ? toInboxRef(details.inbox) : null,
    unread: details.unread,
    hasEmail: true,
    hasPortal: details.hasPortal,
    lastMessageAt: conversation.lastMessageAt ?? last?.createdAt ?? null,
    lastMessage: last
      ? {
          id: last.id,
          preview: last.content.replace(/\s+/g, ' ').slice(0, 140),
          senderType: last.senderType,
          direction: last.email?.direction ?? null,
          createdAt: last.createdAt,
        }
      : null,
    createdAt: conversation.createdAt,
  };
}

/** An email message: the chat message + what the email was. */
export function toEmailMessageEntity(
  message: MessageWithEmail,
  attachments: AttachmentEntity[] = [],
) {
  const email = message.email;
  return {
    ...toMessageEntity(message, attachments),
    topicId: message.topicId,
    email: email
      ? {
          direction: email.direction,
          transport: email.transport,
          fromAddress: email.fromAddress,
          fromName: email.fromName,
          toAddresses: email.toAddresses,
          ccAddresses: email.ccAddresses,
          // The `[#code]` of a Gmail email is never shown in ChantierOS.
          subject: stripSubjectCode(email.subject),
          html: email.html,
          textFull: email.textFull,
          skippedAttachments:
            email.skippedAttachments as unknown as SkippedAttachment[],
          newAddress: email.newAddress,
        }
      : null,
  };
}

/** The chat list filter: these inboxes, the search, unknown contacts only. */
export function buildClientChatFilter(
  inboxIds: number[],
  filters: {
    inboxId?: number;
    search?: string;
    unknown?: boolean;
    clientIds?: number[];
  },
): Prisma.ConversationWhereInput {
  const inboxes =
    filters.inboxId !== undefined
      ? inboxIds.filter((id) => id === filters.inboxId)
      : inboxIds;
  const search = filters.search?.trim();
  return {
    type: 'client',
    inboxId: { in: inboxes },
    ...(filters.unknown === true && { clientId: null }),
    ...(filters.unknown === false && { clientId: { not: null } }),
    ...(search && {
      OR: [
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        ...(filters.clientIds && filters.clientIds.length > 0
          ? [{ clientId: { in: filters.clientIds } }]
          : []),
      ],
    }),
  };
}
