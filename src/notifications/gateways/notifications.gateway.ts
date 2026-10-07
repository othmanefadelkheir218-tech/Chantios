import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Notification } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { TokenHelper } from '../../auth/helpers/token.helper';
import { readCookie } from '../../chat/helpers/chat-access.helper';
import { toSnakeKeys } from '../../common/helpers/case.helper';
import { ALLOWED_ORIGINS } from '../../config/env.config';

export const userRoom = (userId: number) => `user:${userId}`;
export const adminRoom = (adminUserId: number) => `admin:${adminUserId}`;

/**
 * Real-time delivery of notifications (doc/notes/Phaces/13-alerts.md). One
 * Socket.io room per user and one per platform admin, over the same Redis
 * adapter as the chat (`redis-io.adapter.ts`).
 *
 * The room is chosen by the SERVER from the signed token at the handshake —
 * a client cannot ask to join another person's room, there is no `join`
 * message at all. The chat gateway shares the same socket server and refuses
 * a socket with no valid token; this one only adds the personal room.
 *
 * Writes never come through here: `DispatchNotificationHandler` saves the
 * row, then calls `emit`.
 */
@Injectable()
@WebSocketGateway({
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectPinoLogger(NotificationsGateway.name)
    private readonly logger: PinoLogger,
    private readonly tokens: TokenHelper,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const room = this.roomOf(client);
    if (!room) return; // the chat gateway already refused a socket with no token
    await client.join(room);
    this.logger.debug(`Socket ${client.id} joined ${room}`);
  }

  /** `notification` — server → the recipient's room. Snake_case like every HTTP response. */
  emit(row: Notification): void {
    const room = row.adminUserId
      ? adminRoom(row.adminUserId)
      : row.userId
        ? userRoom(row.userId)
        : null;
    if (!room) return;
    this.server?.to(room).emit('notification', toSnakeKeys(row));
  }

  private roomOf(client: Socket): string | null {
    const auth = client.handshake.auth as
      { role?: string; token?: string } | undefined;
    const cookie = client.handshake.headers.cookie;
    try {
      if (auth?.role === 'admin') {
        const token = auth.token ?? readCookie(cookie, 'admin_access_token');
        if (!token) return null;
        return adminRoom(this.tokens.verifyAdminAccessToken(token).sub);
      }
      const token = auth?.token ?? readCookie(cookie, 'access_token');
      if (!token) return null;
      return userRoom(this.tokens.verifyAccessToken(token).sub);
    } catch {
      return null;
    }
  }
}
