import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ServerOptions } from 'socket.io';
import { env } from '../../config/env.config';

/**
 * The Socket.io adapter with the Redis adapter plugged in, so a message sent
 * through one API instance still reaches a socket connected to another
 * (doc/notes/Phaces/11-chat.md; registered in `main.ts` per
 * `.instruction/main_file.txt` § WebSocket Configuration).
 *
 * If Redis cannot be reached at start-up the server falls back to the default
 * in-memory adapter and says so: chat then works on a single instance only,
 * but the API still boots (same "never block start-up" rule as
 * `config/redis.config.ts`).
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly redisLogger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private clients: Redis[] = [];

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<boolean> {
    const pub = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    const sub = pub.duplicate();
    pub.on('error', () => undefined);
    sub.on('error', () => undefined);
    try {
      await Promise.all([pub.connect(), sub.connect()]);
      this.adapterConstructor = createAdapter(pub, sub);
      this.clients = [pub, sub];
      return true;
    } catch (error) {
      pub.disconnect();
      sub.disconnect();
      this.redisLogger.warn(
        `Redis adapter not available (${error instanceof Error ? error.message : String(error)}) — chat runs on this instance only`,
      );
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as {
      adapter: (constructor: unknown) => void;
    };
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }

  /** Closes the sockets, then the two Redis clients, on shutdown. */
  async dispose(): Promise<void> {
    await super.dispose();
    for (const client of this.clients) client.disconnect();
    this.clients = [];
  }
}
