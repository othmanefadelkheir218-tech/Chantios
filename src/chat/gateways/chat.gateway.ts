import { HttpException, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';
import { Server, Socket } from 'socket.io';
import { TokenHelper } from '../../auth/helpers/token.helper';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { toSnakeKeys } from '../../common/helpers/case.helper';
import { ALLOWED_ORIGINS } from '../../config/env.config';
import { AdminJoinSupportHandler } from '../handlers/admin-join-support.handler';
import { CheckAccessHandler } from '../handlers/check-access.handler';
import { conversationRoom, readCookie } from '../helpers/chat-access.helper';
import { ReadReceipt } from '../helpers/read-receipt.helper';
import {
  onlineUserIds,
  PresenceEvent,
  tenantPresenceRoom,
  userPresenceRoom,
} from '../../common/helpers/presence.helper';

/** Who a connected socket is. Set once, at the handshake, from a signed token. */
export type SocketIdentity =
  | { kind: 'user'; tenantId: number; userId: number; impersonated: boolean }
  | { kind: 'admin'; adminUserId: number; ip: string | null };

interface JoinPayload {
  conversation_id?: unknown;
  tenant_id?: unknown;
}

export interface JoinAck {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Real-time delivery (doc/notes/Phaces/11-chat.md). One Socket.io room per
 * conversation, over the Redis adapter (`redis-io.adapter.ts`).
 *
 * The handshake must carry a valid token (the `access_token` cookie, or
 * `auth.token`; a platform admin sends `auth: { role: 'admin' }` and the
 * `admin_access_token`). `join` then runs the SAME membership check as the
 * HTTP routes (`CheckAccessHandler`) — an unchecked socket is a leak, so a
 * non-member is refused and never enters the room.
 *
 * Writes never come through here: messages are sent by the HTTP route, whose
 * handler then calls `emitNewMessage` / `emitMessageRead`.
 */
@Injectable()
@WebSocketGateway({
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectPinoLogger(ChatGateway.name)
    private readonly logger: PinoLogger,
    private readonly tokens: TokenHelper,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
    private readonly access: CheckAccessHandler,
    private readonly adminJoin: AdminJoinSupportHandler,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const identity = this.authenticate(client);
    if (!identity) {
      this.logger.warn(`Socket ${client.id} refused: no valid token`);
      client.emit('error', { status: 401, error: 'Not authenticated' });
      client.disconnect(true);
      return;
    }
    client.data = { identity };
    this.logger.debug(`Socket ${client.id} connected (${identity.kind})`);
    if (identity.kind === 'user') await this.enterPresence(client, identity);
  }

  /** The user's last socket is gone: tell their company they are offline. */
  async handleDisconnect(client: Socket): Promise<void> {
    const identity = (client.data as { identity?: SocketIdentity }).identity;
    if (identity?.kind !== 'user' || identity.impersonated) return;
    const left = await this.server
      ?.in(userPresenceRoom(identity.userId))
      .fetchSockets();
    if (left?.length === 0)
      this.emitPresence(identity.tenantId, identity.userId, false);
  }

  /** `online_users` — client → server: who of my company is online now. The return value is the ack. */
  @SubscribeMessage('online_users')
  async onlineUsers(
    @ConnectedSocket() client: Socket,
  ): Promise<{ user_ids: number[] }> {
    const identity = (client.data as { identity?: SocketIdentity }).identity;
    if (identity?.kind !== 'user') return { user_ids: [] };
    const sockets = await this.server
      ?.in(tenantPresenceRoom(identity.tenantId))
      .fetchSockets();
    return { user_ids: onlineUserIds(sockets ?? []) };
  }

  /** `join` — client → server, after an access check. The return value is the ack. */
  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPayload,
  ): Promise<JoinAck> {
    const identity = (client.data as { identity?: SocketIdentity }).identity;
    const conversationId = Number(body?.conversation_id);
    if (!identity || !Number.isInteger(conversationId) || conversationId < 1) {
      return { ok: false, status: 400, error: 'conversation_id is required' };
    }

    try {
      if (identity.kind === 'user') {
        // A socket handler has no HTTP request, so no tenant in context yet:
        // open a fresh store and put the token's tenant in it, exactly what
        // `TenantGuard` does for a route.
        await this.cls.run(async () => {
          this.tenantContext.setTenantId(identity.tenantId);
          this.tenantContext.setUserId(identity.userId);
          await this.access.assertCanJoin(conversationId, identity.userId);
        });
      } else {
        const tenantId = Number(body?.tenant_id);
        if (!Number.isInteger(tenantId) || tenantId < 1) {
          return { ok: false, status: 400, error: 'tenant_id is required' };
        }
        await this.adminJoin.execute(
          conversationId,
          tenantId,
          identity.adminUserId,
          identity.ip,
        );
      }
      await client.join(conversationRoom(conversationId));
      return { ok: true };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        return {
          ok: false,
          status: error.getStatus(),
          error: error.message,
        };
      }
      this.logger.error({ err: error }, 'Socket join failed');
      return { ok: false, status: 500, error: 'Internal error' };
    }
  }

  @SubscribeMessage('leave')
  async leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPayload,
  ): Promise<JoinAck> {
    const conversationId = Number(body?.conversation_id);
    if (!Number.isInteger(conversationId) || conversationId < 1) {
      return { ok: false, status: 400, error: 'conversation_id is required' };
    }
    await client.leave(conversationRoom(conversationId));
    return { ok: true };
  }

  /**
   * `new_message` — server → room. Called by the handlers after the message is
   * saved. The payload is snake_case like every HTTP response: the
   * `SnakeCaseInterceptor` only wraps HTTP, so a socket emit converts itself.
   */
  emitNewMessage(conversationId: number, message: unknown): void {
    this.server
      ?.to(conversationRoom(conversationId))
      .emit('new_message', toSnakeKeys(message));
  }

  /**
   * `message_read` — server → room: a reader has seen a message. In the team
   * chat it also carries the message's new `read_count` / `member_count`
   * (step 26 C), so the sender's ticks update without a reload.
   */
  emitMessageRead(
    conversationId: number,
    messageId: number,
    reader: { type: 'employee' | 'client'; id: number },
    receipt?: ReadReceipt,
  ): void {
    this.server?.to(conversationRoom(conversationId)).emit('message_read', {
      conversation_id: conversationId,
      message_id: messageId,
      reader,
      ...(receipt && {
        read_count: receipt.readCount,
        member_count: receipt.memberCount,
      }),
    });
  }

  /**
   * Every user socket hears its company's presence updates. Only a real login
   * counts as online: an impersonation socket listens but is not counted.
   */
  private async enterPresence(
    client: Socket,
    identity: Extract<SocketIdentity, { kind: 'user' }>,
  ): Promise<void> {
    await client.join(tenantPresenceRoom(identity.tenantId));
    if (identity.impersonated) return;
    await client.join(userPresenceRoom(identity.userId));
    const sockets = await this.server
      ?.in(userPresenceRoom(identity.userId))
      .fetchSockets();
    if (sockets?.length === 1)
      this.emitPresence(identity.tenantId, identity.userId, true);
  }

  /** `presence` — server → the company: one user came online or went offline. */
  private emitPresence(
    tenantId: number,
    userId: number,
    online: boolean,
  ): void {
    const event: PresenceEvent = { user_id: userId, online };
    this.server?.to(tenantPresenceRoom(tenantId)).emit('presence', event);
  }

  private authenticate(client: Socket): SocketIdentity | null {
    const auth = client.handshake.auth as
      { role?: string; token?: string } | undefined;
    const cookie = client.handshake.headers.cookie;
    try {
      if (auth?.role === 'admin') {
        const token = auth.token ?? readCookie(cookie, 'admin_access_token');
        if (!token) return null;
        const payload = this.tokens.verifyAdminAccessToken(token);
        return {
          kind: 'admin',
          adminUserId: payload.sub,
          ip: client.handshake.address ?? null,
        };
      }
      const token = auth?.token ?? readCookie(cookie, 'access_token');
      if (!token) return null;
      const payload = this.tokens.verifyAccessToken(token);
      return {
        kind: 'user',
        tenantId: payload.tenantId,
        userId: payload.sub,
        impersonated: payload.impersonatedBy !== undefined,
      };
    } catch {
      return null;
    }
  }
}
