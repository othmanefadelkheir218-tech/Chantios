import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma } from '@prisma/client';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/**
 * Prisma logs: only `warn` by default (errors are handled and logged by Nest).
 * Set PRISMA_LOG=query in .env to see every SQL query.
 */
const log: Prisma.LogLevel[] =
  env.PRISMA_LOG === 'query' ? ['query', 'info', 'warn', 'error'] : ['warn'];

/** Options used by PrismaService to create the client (adapter + logs). */
export const prismaClientOptions: Prisma.PrismaClientOptions = {
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  log,
};

/** Checks that the Prisma client can really run a query. Never throws. */
export async function getOrmStatus(prisma: {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'ORM',
      ok: true,
      detail: `Prisma ${Prisma.prismaVersion.client} (adapter pg)`,
    };
  } catch (error) {
    return { name: 'ORM', ok: false, detail: errorMessage(error) };
  }
}
