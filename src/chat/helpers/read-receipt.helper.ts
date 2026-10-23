import { ConversationMember, Message } from '@prisma/client';

/** "Seen" on one message — doc/notes/chat-conversations.md § Read. */
export interface ReadReceipt {
  readCount: number;
  memberCount: number;
}

/** "Seen" ticks are shown only in the team chat between employees. */
export function hasReadReceipts(type: string): boolean {
  return type === 'internal';
}

/**
 * The one implementation of "who counts" (step 26 Q8). For each employee
 * message: the members who are users, not the sender, ACTIVE, and in the
 * group when the message was sent (`joined_at <= created_at`). `readCount`
 * is the part of those people who read it — a read by anyone else (a member
 * added later, a deactivated user) is not counted.
 */
export function countReadReceipts(
  messages: Pick<Message, 'id' | 'senderType' | 'senderId' | 'createdAt'>[],
  members: Pick<ConversationMember, 'userId' | 'joinedAt'>[],
  activeUserIds: Set<number>,
  reads: { messageId: number; userId: number }[],
): Map<number, ReadReceipt> {
  const readersOf = new Map<number, Set<number>>();
  for (const read of reads) {
    const readers = readersOf.get(read.messageId) ?? new Set<number>();
    readers.add(read.userId);
    readersOf.set(read.messageId, readers);
  }

  const result = new Map<number, ReadReceipt>();
  for (const message of messages) {
    if (message.senderType !== 'employee') continue;
    const counted = new Set<number>();
    for (const member of members) {
      if (
        member.userId !== null &&
        member.userId !== message.senderId &&
        activeUserIds.has(member.userId) &&
        member.joinedAt <= message.createdAt
      ) {
        counted.add(member.userId);
      }
    }
    const readers = readersOf.get(message.id) ?? new Set<number>();
    let readCount = 0;
    for (const userId of counted) if (readers.has(userId)) readCount += 1;
    result.set(message.id, { readCount, memberCount: counted.size });
  }
  return result;
}
