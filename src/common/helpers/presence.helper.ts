/**
 * Who is online (doc/notes/chat-conversations.md § Online status). No storage: a user is
 * online while at least one of their sockets is connected. Socket.io keeps
 * the rooms, and the Redis adapter shares them across API instances.
 */

/** Every socket of one company's users: presence updates go here, never to another company. */
export const tenantPresenceRoom = (tenantId: number) =>
  `presence:tenant:${tenantId}`;

/**
 * The sockets that make one user "online". Separate from the notification
 * room `user:<id>`, because an impersonation socket joins that one but must
 * not count here (a platform admin is not the company's boss).
 */
export const userPresenceRoom = (userId: number) => `presence:user:${userId}`;

/** `presence` event body, snake_case like every socket payload. */
export interface PresenceEvent {
  user_id: number;
  online: boolean;
}

/** The user ids behind a list of sockets, once each, counted sockets only. */
export function onlineUserIds(sockets: { data: unknown }[]): number[] {
  const ids = new Set<number>();
  for (const socket of sockets) {
    const identity = (socket.data as { identity?: PresenceIdentity })?.identity;
    if (identity?.kind === 'user' && !identity.impersonated) {
      ids.add(identity.userId);
    }
  }
  return [...ids];
}

type PresenceIdentity = {
  kind: string;
  userId: number;
  impersonated?: boolean;
};
