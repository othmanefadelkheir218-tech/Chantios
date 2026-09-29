import { Client } from 'pg';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/** Opens a real connection to PostgreSQL before Nest starts. Never throws. */
export async function connectDatabase(): Promise<ServiceStatus> {
  const url = new URL(env.DATABASE_URL);
  const target = `${url.hostname}:${url.port}${url.pathname}`;
  const client = new Client({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ server_version: string }>(
      'SHOW server_version',
    );
    return {
      name: 'Database',
      ok: true,
      detail: `PostgreSQL ${rows[0].server_version.split(' ')[0]} (${target})`,
    };
  } catch (error) {
    return {
      name: 'Database',
      ok: false,
      detail: `cannot connect to ${target} - ${errorMessage(error)}`,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
