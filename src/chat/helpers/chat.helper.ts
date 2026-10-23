import {
  Conversation,
  ConversationMember,
  Message,
  Prisma,
} from '@prisma/client';
import { toMediaEntity } from '../../media/helpers/media.helper';
import { ReadReceipt } from './read-receipt.helper';

export type ConversationWithMembers = Conversation & {
  members: ConversationMember[];
};

export type AttachmentEntity = ReturnType<typeof toMediaEntity>;

/** What may leave the module: a conversation with its members. */
export function toConversationEntity(conversation: ConversationWithMembers) {
  return {
    id: conversation.id,
    tenantId: conversation.tenantId,
    type: conversation.type,
    projectId: conversation.projectId,
    supportTicketId: conversation.supportTicketId,
    isArchived: conversation.isArchived,
    createdAt: conversation.createdAt,
    members: conversation.members.map((member) => ({
      userId: member.userId,
      clientId: member.clientId,
      adminUserId: member.adminUserId,
      joinedAt: member.joinedAt,
    })),
  };
}

/**
 * What may leave the module: a message and its files. There is no
 * `attachments` column — they are `media` rows with `entity_type = 'message'`.
 * `receipt` (step 26 C): the "seen" info, only on the sender's own messages
 * in the team chat.
 */
export function toMessageEntity(
  message: Message,
  attachments: AttachmentEntity[] = [],
  receipt?: ReadReceipt,
) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderType: message.senderType,
    senderId: message.senderId,
    content: message.content,
    isArchived: message.isArchived,
    createdAt: message.createdAt,
    attachments: attachments.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileSize: file.fileSize,
    })),
    ...(receipt && {
      readCount: receipt.readCount,
      memberCount: receipt.memberCount,
    }),
  };
}

/**
 * Builds the Prisma filter for the conversation list: ONLY conversations the
 * caller is a member of, archived ones hidden unless asked for.
 */
export function buildConversationFilter(
  userId: number,
  filters: {
    type?: Conversation['type'];
    projectId?: number;
    archived?: boolean;
  },
): Prisma.ConversationWhereInput {
  return {
    members: { some: { userId } },
    isArchived: filters.archived ?? false,
    ...(filters.type && { type: filters.type }),
    ...(filters.projectId !== undefined && { projectId: filters.projectId }),
  };
}
