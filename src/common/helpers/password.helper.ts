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
