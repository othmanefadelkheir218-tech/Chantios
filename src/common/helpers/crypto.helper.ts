import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../../config/env.config';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION = 'v1';

function defaultKey(): Buffer {
  return Buffer.from(env.EMAIL_TOKEN_ENCRYPTION_KEY, 'base64');
}

/**
 * Encrypts a secret we must read back later (a Google refresh token).
 * AES-256-GCM: `v1.<iv>.<tag>.<cipher>`, each part base64url. A changed byte
 * or a wrong key makes `decryptSecret` throw — never a silent wrong value.
 */
export function encryptSecret(
  plain: string,
  key: Buffer = defaultKey(),
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, encrypted]
    .map((part) =>
      typeof part === 'string' ? part : part.toString('base64url'),
    )
    .join('.');
}

/** The reverse of `encryptSecret`. Throws on a wrong key or a tampered text. */
export function decryptSecret(
  encoded: string,
  key: Buffer = defaultKey(),
): string {
  const [version, iv, tag, encrypted] = encoded.split('.');
  if (version !== VERSION || !iv || !tag || !encrypted) {
    throw new Error('Unknown encrypted secret format');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
