import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { env } from '../../config/env.config';

/**
 * Every call to Google for "Connect Gmail" (doc/notes/client-email.md). We
 * ask for `gmail.send` only — never a read scope — plus `openid email` to
 * know which Gmail connected.
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GMAIL_SEND_URL =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const SCOPES = `openid email ${GMAIL_SEND_SCOPE}`;

/** Google refused the refresh token: the user removed the access, or it expired. */
export class GmailAccessLostError extends Error {
  constructor(readonly reason: string) {
    super(`Gmail access lost: ${reason}`);
  }
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  /** Space-separated scopes the user really granted. */
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GrantedTokens {
  refreshToken: string;
  /** The Gmail address that logged in at Google. */
  email: string;
  scopes: string;
}

function credentials() {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new BadRequestException('Google OAuth is not configured');
  }
  return { clientId, clientSecret };
}

/** The Google consent link. `state` is our signed JWT. */
export function buildConsentUrl(state: string): string {
  const { clientId } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // a refresh token: we send later without the user
    prompt: 'consent', // always a refresh token, even on a reconnect
    include_granted_scopes: 'false',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function requestToken(
  params: Record<string, string>,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...params,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (data.error === 'invalid_grant') {
    throw new GmailAccessLostError(data.error_description ?? 'invalid_grant');
  }
  if (!res.ok || !data.access_token) {
    throw new BadGatewayException(
      `Google token request failed: ${data.error ?? res.status}`,
    );
  }
  return data;
}

/**
 * The callback's one-time code → a refresh token + the Gmail address.
 * `null` scopes check is the caller's: Google shows "send" as a checkbox.
 */
export async function exchangeCode(code: string): Promise<GrantedTokens> {
  const tokens = await requestToken({
    code,
    grant_type: 'authorization_code',
    redirect_uri: env.GOOGLE_REDIRECT_URI,
  });
  if (!tokens.refresh_token || !tokens.id_token) {
    throw new BadGatewayException('Google returned no refresh token');
  }
  // The id_token comes straight from Google over TLS: reading its payload is enough.
  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8'),
  ) as { email?: string; email_verified?: boolean };
  if (!payload.email) {
    throw new BadGatewayException('Google returned no email address');
  }
  return {
    refreshToken: tokens.refresh_token,
    email: payload.email.toLowerCase(),
    scopes: tokens.scope ?? '',
  };
}

export function hasSendScope(scopes: string): boolean {
  return scopes.split(' ').includes(GMAIL_SEND_SCOPE);
}

/** A short-lived access token. Throws `GmailAccessLostError` on `invalid_grant`. */
export async function getAccessToken(refreshToken: string): Promise<string> {
  const tokens = await requestToken({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  return tokens.access_token as string;
}

/** Removes our access at Google. Best effort: a token already dead is fine. */
export async function revokeToken(token: string): Promise<boolean> {
  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });
  return res.ok;
}

/** Sends one raw MIME email as the connected Gmail. */
export async function sendRawEmail(
  accessToken: string,
  rawMime: string,
): Promise<{ id: string; threadId: string }> {
  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: Buffer.from(rawMime, 'utf8').toString('base64url'),
    }),
  });
  const data = (await res.json()) as {
    id?: string;
    threadId?: string;
    error?: { message?: string; status?: string };
  };
  // 401 = token refused. 403 PERMISSION_DENIED = the send scope is gone. A 403
  // rate limit is NOT a lost access: it stays a plain send failure.
  if (
    res.status === 401 ||
    (res.status === 403 && data.error?.status === 'PERMISSION_DENIED')
  ) {
    throw new GmailAccessLostError(data.error?.message ?? `HTTP ${res.status}`);
  }
  if (!res.ok || !data.id) {
    throw new BadGatewayException(
      `Gmail send failed: ${data.error?.message ?? res.status}`,
    );
  }
  return { id: data.id, threadId: data.threadId ?? '' };
}
