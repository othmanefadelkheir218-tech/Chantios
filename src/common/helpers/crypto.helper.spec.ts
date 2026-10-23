import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from './crypto.helper';

describe('crypto.helper', () => {
  const key = randomBytes(32);

  it('reads back what it encrypted', () => {
    const secret = '1//0gRefreshToken-éà';
    const encrypted = encryptSecret(secret, key);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted, key)).toBe(secret);
  });

  it('gives a different text each time (random iv)', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key));
  });

  it('fails with a wrong key', () => {
    const encrypted = encryptSecret('secret', key);
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow();
  });

  it('fails when the text was changed', () => {
    const [version, iv, tag, data] = encryptSecret('secret', key).split('.');
    const bytes = Buffer.from(data, 'base64url');
    bytes[0] ^= 0xff;
    const tampered = [version, iv, tag, bytes.toString('base64url')].join('.');
    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  it('refuses an unknown format', () => {
    expect(() => decryptSecret('plain-text', key)).toThrow(
      'Unknown encrypted secret format',
    );
  });
});
