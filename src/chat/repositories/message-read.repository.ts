import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UnreadRow {
  conversationId: number;
  unread: number;
}

/**
 * The only place where the chat module talks to `message_reads`. The unread
 * count is a read, never a stored number: messages with NO matching read row
 * for that reader. Raw SQL on the unscoped client, so `tenant_id` is always
 * passed by hand (the tenant extension cannot see inside `$queryRaw`).
 *
 * A reader's OWN messages are never unread to them — they wrote them — so
 * they are left out of the count and never get a read row.
 */
@Injectable()
export class MessageReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * First open: one read row per message the user has not read yet, in ONE
   * statement. `ON CONFLICT DO NOTHING` on the partial unique index
   * (`uq_read_user`) makes it safe to call again and again — opening the
   * conversation twice, or two tabs at once, never writes a duplicate.
   * Returns the ids of the messages marked read NOW (the ones to announce).
   */
  async markReadForUser(
    conversationId: number,
    userId: number,
    tenantId: number,
  ): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<{ messageId: number }[]>`
      INSERT INTO message_reads (tenant_id, message_id, user_id)
      SELECT m.tenant_id, m.id, ${userId}
      FROM messages m
      WHERE m.tenant_id = ${tenantId}
        AND m.conversation_id = ${conversationId}
        AND m.is_archived = false
        AND NOT (m.sender_type = 'employee' AND m.sender_id = ${userId})
      ON CONFLICT (message_id, user_id) WHERE user_id IS NOT NULL DO NOTHING
      RETURNING message_id AS "messageId"
    `;
    return rows.map((row) => row.messageId);
  }

  /**
   * The client's first open (step 12's portal): the same one-statement insert
   * as `markReadForUser`, for the `client_id` column (`uq_read_client` +
   * `ON CONFLICT DO NOTHING`). The client's OWN messages never get a row.
   */
  async markReadForClient(
    conversationId: number,
    clientId: number,
    tenantId: number,
  ): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<{ messageId: number }[]>`
      INSERT INTO message_reads (tenant_id, message_id, client_id)
      SELECT m.tenant_id, m.id, ${clientId}
      FROM messages m
      WHERE m.tenant_id = ${tenantId}
        AND m.conversation_id = ${conversationId}
        AND m.is_archived = false
        AND NOT (m.sender_type = 'client' AND m.sender_id = ${clientId})
      ON CONFLICT (message_id, client_id) WHERE client_id IS NOT NULL DO NOTHING
      RETURNING message_id AS "messageId"
    `;
    return rows.map((row) => row.messageId);
  }

  /**
   * Step 26 C — who (employees only) has read these messages, in ONE query
   * for the whole page. `tenant_id` passed by hand: the unscoped client.
   */
  findUserReads(
    messageIds: number[],
    tenantId: number,
  ): Promise<{ messageId: number; userId: number }[]> {
    if (messageIds.length === 0) return Promise.resolve([]);
    return this.prisma.messageRead
      .findMany({
        where: {
          tenantId,
          messageId: { in: messageIds },
          userId: { not: null },
        },
        select: { messageId: true, userId: true },
      })
      .then((rows) =>
        rows.map((row) => ({ messageId: row.messageId, userId: row.userId! })),
      );
  }

  /** Messages in one conversation the user has not read (and did not write). */
  async countUnread(
    conversationId: number,
    userId: number,
    tenantId: number,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ unread: number }[]>`
      SELECT COUNT(*)::int AS unread
      FROM messages m
      WHERE m.tenant_id = ${tenantId}
        AND m.conversation_id = ${conversationId}
        AND m.is_archived = false
        AND NOT (m.sender_type = 'employee' AND m.sender_id = ${userId})
        AND NOT EXISTS (
          SELECT 1 FROM message_reads r
          WHERE r.message_id = m.id AND r.user_id = ${userId}
        )
    `;
    return rows[0]?.unread ?? 0;
  }

  /**
   * The unread count of every ACTIVE conversation the user is a member of
   * (conversations with nothing unread are left out).
   */
  countUnreadByConversation(
    userId: number,
    tenantId: number,
  ): Promise<UnreadRow[]> {
    return this.prisma.$queryRaw<UnreadRow[]>`
      SELECT m.conversation_id AS "conversationId", COUNT(*)::int AS unread
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id AND c.is_archived = false
      JOIN conversation_members cm
        ON cm.conversation_id = m.conversation_id AND cm.user_id = ${userId}
      WHERE m.tenant_id = ${tenantId}
        AND m.is_archived = false
        AND NOT (m.sender_type = 'employee' AND m.sender_id = ${userId})
        AND NOT EXISTS (
          SELECT 1 FROM message_reads r
          WHERE r.message_id = m.id AND r.user_id = ${userId}
        )
      GROUP BY m.conversation_id
      ORDER BY m.conversation_id
    `;
  }

  /**
   * Step 25 — the unread count of these client conversations for one user.
   * A client chat has no members (the inbox rule decides who reads it), so
   * the conversations are named, not joined through `conversation_members`.
   */
  async countUnreadForConversations(
    conversationIds: number[],
    userId: number,
    tenantId: number,
  ): Promise<Map<number, number>> {
    if (conversationIds.length === 0) return new Map();
    const rows = await this.prisma.$queryRaw<UnreadRow[]>`
      SELECT m.conversation_id AS "conversationId", COUNT(*)::int AS unread
      FROM messages m
      WHERE m.tenant_id = ${tenantId}
        AND m.conversation_id = ANY(${conversationIds}::int[])
        AND m.is_archived = false
        AND NOT (m.sender_type = 'employee' AND m.sender_id = ${userId})
        AND NOT EXISTS (
          SELECT 1 FROM message_reads r
          WHERE r.message_id = m.id AND r.user_id = ${userId}
        )
      GROUP BY m.conversation_id
    `;
    return new Map(rows.map((row) => [row.conversationId, row.unread]));
  }
}
