import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OneTimeCodeType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CODE_LIFETIME_MS,
  CODE_MAX_ATTEMPTS,
  generateCode,
  hashCode,
} from './helpers/one-time-code.helper';
import {
  OneTimeCodeRepository,
  OneTimeCodeScope,
} from './repositories/one-time-code.repository';

/**
 * Generic across every `one_time_code_type` (password_reset, email_verification,
 * admin_2fa) — see doc/notes/auth-tokens.md. No public routes: callers (e.g.
 * `tenants`) own the HTTP shape and the business rule of what the code gates.
 */
@Injectable()
export class OneTimeCodesService {
  constructor(
    @InjectPinoLogger(OneTimeCodesService.name)
    private readonly logger: PinoLogger,
    private readonly codes: OneTimeCodeRepository,
  ) {}

  /**
   * Invalidates any still-active code for this type+scope, then creates a
   * fresh one. Returns the plaintext code — only `codeHash` is stored.
   */
  async generate(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
  ): Promise<string> {
    await this.codes.consumePriorActive(type, scope);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS[type]);
    await this.codes.create(type, scope, hashCode(code), expiresAt);

    this.logger.info(
      `Generated a ${type} code (scope ${JSON.stringify(scope)})`,
    );
    return code;
  }

  /**
   * Opens a challenge whose answer is NOT stored here (a TOTP code lives in
   * the authenticator app). The row only carries the life span and the try
   * counter; its hash is random, so nothing can ever match it. Returns the
   * row id, which the caller puts in the challenge token.
   */
  async openChallenge(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
  ): Promise<number> {
    await this.codes.consumePriorActive(type, scope);
    const row = await this.codes.create(
      type,
      scope,
      hashCode(randomBytes(32).toString('hex')),
      new Date(Date.now() + CODE_LIFETIME_MS[type]),
    );
    return row.id;
  }

  /**
   * Counts one try on the challenge. `false` = the challenge is dead (replaced
   * by a newer login, expired, already used, or out of tries) — and it is
   * consumed on the spot, so a right answer after the last wrong one is still
   * refused. Call it BEFORE checking the answer.
   */
  async takeChallengeAttempt(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
    challengeId: number,
  ): Promise<boolean> {
    const active = await this.codes.findActive(type, scope);
    if (!active || active.id !== challengeId) return false;

    const maxAttempts = CODE_MAX_ATTEMPTS[type];
    if (
      maxAttempts !== undefined &&
      !(await this.codes.takeAttempt(active.id, maxAttempts))
    ) {
      await this.codes.markConsumed(active.id);
      this.logger.warn(
        `${type} challenge locked out after ${maxAttempts} attempts`,
      );
      return false;
    }
    return true;
  }

  /** The answer was right: the challenge cannot be used again. */
  closeChallenge(challengeId: number): Promise<void> {
    return this.codes.markConsumed(challengeId);
  }

  deleteExpiredOlderThan(date: Date): Promise<number> {
    return this.codes.deleteExpiredOlderThan(date);
  }

  /** Compares hashes, never raw values (doc/notes/auth-tokens.md § Shared rules). */
  async verify(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
    rawCode: string,
  ): Promise<boolean> {
    const active = await this.codes.findActive(type, scope);
    if (!active) {
      this.logger.warn(
        `No active ${type} code (scope ${JSON.stringify(scope)})`,
      );
      return false;
    }

    const maxAttempts = CODE_MAX_ATTEMPTS[type];
    if (maxAttempts !== undefined && active.attemptCount >= maxAttempts) {
      await this.codes.markConsumed(active.id);
      this.logger.warn(
        `${type} code locked out after ${active.attemptCount} attempts`,
      );
      return false;
    }

    if (hashCode(rawCode) !== active.codeHash) {
      await this.codes.incrementAttempt(active.id);
      return false;
    }

    await this.codes.markConsumed(active.id);
    return true;
  }
}
