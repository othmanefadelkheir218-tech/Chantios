import ms from 'ms';
import type { Response } from 'express';
import { env } from '../../config/env.config';

/** httpOnly, secure in prod, sameSite lax (doc/notes/auth-tokens.md). */
const BASE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_MAX_AGE = ms(env.JWT_ACCESS_EXPIRES_IN as ms.StringValue);
const REFRESH_MAX_AGE = ms(env.JWT_REFRESH_EXPIRES_IN as ms.StringValue);

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie('access_token', accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie('refresh_token', refreshToken, {
    ...BASE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', BASE_OPTIONS);
  res.clearCookie('refresh_token', BASE_OPTIONS);
}

/**
 * Impersonation (step 16): the SAME `access_token` cookie a real login sets
 * — same name, same options, same short lifetime — and deliberately NO
 * `refresh_token`. The session is meant to end when the access token expires
 * naturally, not be renewable like a real login. The admin's own
 * `admin_access_token`/`admin_refresh_token` cookies are untouched, so they
 * can always get back to their own session.
 */
export function setImpersonationCookie(
  res: Response,
  accessToken: string,
): void {
  res.cookie('access_token', accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });
}

export function setAdminAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie('admin_access_token', accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie('admin_refresh_token', refreshToken, {
    ...BASE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAdminAuthCookies(res: Response): void {
  res.clearCookie('admin_access_token', BASE_OPTIONS);
  res.clearCookie('admin_refresh_token', BASE_OPTIONS);
}
