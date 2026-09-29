import Redis from 'ioredis';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/** Pings Redis before Nest starts. Never throws. */
export async function connectRedis(): Promise<ServiceStatus> {
  const url = new URL(env.REDIS_URL);
  const target = `${url.hostname}:${url.port}`;
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // do not retry: we only check the connection
  });
  redis.on('error', () => undefined); // errors are reported in the status below

  try {
    await redis.connect();
    await redis.ping();
    const info = await redis.info('server');
    const version = /redis_version:(\S+)/.exec(info)?.[1] ?? '?';
    return { name: 'Redis', ok: true, detail: `Redis ${version} (${target})` };
  } catch (error) {
    return {
      name: 'Redis',
      ok: false,
      detail: `cannot connect to ${target} - ${errorMessage(error)}`,
    };
  } finally {
    redis.disconnect();
  }
}
