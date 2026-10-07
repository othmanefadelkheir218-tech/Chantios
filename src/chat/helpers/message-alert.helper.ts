import { DispatchContext } from '../../notifications/notification.types';
import { ConversationWithMembers } from './chat.helper';

const PREVIEW_LENGTH = 120;

/** First characters of a message, for the notification body. */
export function previewOf(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > PREVIEW_LENGTH
    ? `${text.slice(0, PREVIEW_LENGTH)}...`
    : text;
}

/** The employees of a conversation, minus the ones who must not be told (the sender). */
export function employeeMemberIds(
  conversation: ConversationWithMembers,
  excludeUserId?: number,
): number[] {
  return conversation.members.flatMap((member) =>
    member.userId && member.userId !== excludeUserId ? [member.userId] : [],
  );
}

/** The client member of a conversation, if any (a `project_client` thread). */
export function clientMemberId(
  conversation: ConversationWithMembers,
): number | null {
  return (
    conversation.members.find((member) => member.clientId)?.clientId ?? null
  );
}

/** `new_message` for the employees: one row per member, never for the sender. */
export function newMessageContext(
  conversation: ConversationWithMembers,
  senderName: string,
  content: string,
  excludeUserId?: number,
): DispatchContext {
  return {
    tenantId: conversation.tenantId,
    userIds: employeeMemberIds(conversation, excludeUserId),
    payload: {
      entity_id: conversation.id,
      conversation_id: conversation.id,
      sender_name: senderName,
      preview: previewOf(content),
    },
  };
}
