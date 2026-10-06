/**
 * Who is talking in a conversation: exactly one of the three, matching the
 * `conversation_members` columns (and its `chk_member_one_identity` CHECK).
 */
export interface ChatIdentity {
  userId?: number;
  clientId?: number;
  adminUserId?: number;
}

/** A `conversation_members` row, as far as the access check needs it. */
export interface MemberRow {
  userId: number | null;
  clientId: number | null;
  adminUserId: number | null;
}

/**
 * THE membership check — the one implementation, used by every HTTP route AND
 * by the socket `join` (an unchecked socket is a leak). A caller is a member
 * only if a member row carries the SAME id in the SAME column.
 */
export function isMemberOf(
  members: MemberRow[],
  identity: ChatIdentity,
): boolean {
  return members.some(
    (member) =>
      (identity.userId !== undefined && member.userId === identity.userId) ||
      (identity.clientId !== undefined &&
        member.clientId === identity.clientId) ||
      (identity.adminUserId !== undefined &&
        member.adminUserId === identity.adminUserId),
  );
}

/** The Socket.io room of one conversation. Ids are global, so the name is unique across tenants. */
export function conversationRoom(conversationId: number): string {
  return `conversation:${conversationId}`;
}

/** Reads one cookie out of a raw `Cookie:` header (the socket handshake has no cookie-parser). */
export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return undefined;
}
