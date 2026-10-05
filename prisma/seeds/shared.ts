/**
 * Shared by every seed script: one Prisma client, one password hasher.
 * Each seed file is idempotent and can be run on its own.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — check your .env');
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** argon2id with the project-wide settings (doc/notes/auth-tokens.md). */
export function hashSecret(secret: string): Promise<string> {
  return argon2.hash(secret, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/** Runs one seed step, prints errors, and always closes the connection. */
export async function runSeed(
  title: string,
  steps: () => Promise<void>,
  options: { disconnect?: boolean } = {},
): Promise<void> {
  console.log(`${title}\n`);
  try {
    await steps();
    console.log('\nDone.');
  } catch (error) {
    console.error('\nSeed failed:', error);
    process.exitCode = 1;
  } finally {
    if (options.disconnect !== false) await prisma.$disconnect();
  }
}
