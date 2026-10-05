import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import { env } from '../../config/env.config';

/** Validated at boot by `envSchema` (config/env.config.ts) — always a duration like `15m`/`7d`. */
const ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN as StringValue;
const REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN as StringValue;

export interface AccessTokenPayload {
  sub: number;
  tenantId: number;
  roleId: number;
  email: string;
  kind: 'user';
}

export interface RefreshTokenPayload {
  sub: number;
  tenantId: number;
  jti: string;
  kind: 'user';
}

export interface AdminAccessTokenPayload {
  sub: number;
  role: string;
  email: string;
  kind: 'admin';
}

export interface AdminRefreshTokenPayload {
  sub: number;
  jti: string;
  kind: 'admin';
}

export interface Admin2faChallengePayload {
  sub: number;
  codeId: number;
  purpose: 'admin_2fa';
}

/**
 * Sign/verify/sha256/rotate (doc/notes/Phaces/02-auth-users.md). Uses
 * `@nestjs/jwt` (doc/notes/technical/build-order.md § 4 Packages), one
 * secret for access tokens, a different one for refresh tokens — a leaked
 * access token can never be replayed as a refresh token or vice versa.
 */
@Injectable()
export class TokenHelper {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: Omit<AccessTokenPayload, 'kind'>): string {
    return this.jwt.sign(
      { ...payload, kind: 'user' },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: ACCESS_EXPIRES_IN },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET });
  }

  /** `jti` lets a stolen-and-replayed refresh token be told apart from a fresh one. */
  signRefreshToken(
    tenantId: number,
    userId: number,
  ): { token: string; jti: string } {
    const jti = randomUUID();
    const token = this.jwt.sign(
      {
        sub: userId,
        tenantId,
        jti,
        kind: 'user',
      } satisfies RefreshTokenPayload,
      { secret: env.JWT_REFRESH_SECRET, expiresIn: REFRESH_EXPIRES_IN },
    );
    return { token, jti };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwt.verify(token, { secret: env.JWT_REFRESH_SECRET });
  }

  signAdminAccessToken(payload: Omit<AdminAccessTokenPayload, 'kind'>): string {
    return this.jwt.sign(
      { ...payload, kind: 'admin' },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: ACCESS_EXPIRES_IN },
    );
  }

  verifyAdminAccessToken(token: string): AdminAccessTokenPayload {
    return this.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET });
  }

  signAdminRefreshToken(adminUserId: number): { token: string; jti: string } {
    const jti = randomUUID();
    const token = this.jwt.sign(
      {
        sub: adminUserId,
        jti,
        kind: 'admin',
      } satisfies AdminRefreshTokenPayload,
      { secret: env.JWT_REFRESH_SECRET, expiresIn: REFRESH_EXPIRES_IN },
    );
    return { token, jti };
  }

  verifyAdminRefreshToken(token: string): AdminRefreshTokenPayload {
    return this.jwt.verify(token, { secret: env.JWT_REFRESH_SECRET });
  }

  /** The 5-minute window between an admin password check and its TOTP code. */
  signAdmin2faChallenge(adminUserId: number, codeId: number): string {
    return this.jwt.sign(
      {
        sub: adminUserId,
        codeId,
        purpose: 'admin_2fa',
      } satisfies Admin2faChallengePayload,
      { secret: env.JWT_ACCESS_SECRET, expiresIn: '5m' },
    );
  }

  verifyAdmin2faChallenge(token: string): Admin2faChallengePayload {
    return this.jwt.verify(token, { secret: env.JWT_ACCESS_SECRET });
  }

  /** Refresh tokens are stored hashed — the raw value lives only in the cookie. */
  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
