import * as argon2 from 'argon2';

/** argon2id with the project-wide settings (doc/notes/auth-tokens.md). */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verifies a password or PIN against its argon2id hash. Used by every login
 * flow: admin, tenant user, and the worker mobile PIN (doc/notes/auth-tokens.md
 * — one hashing scheme for both).
 */
export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
