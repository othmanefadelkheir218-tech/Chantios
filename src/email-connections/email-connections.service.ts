import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '../config/env.config';

// Local test only: keeps the connection across server reloads. Git-ignored.
// Holds a live Google refresh token — never use a file like this in production.
const TEST_CONNECTION_FILE = join(process.cwd(), '.gmail-test-connection.json');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
// `openid email` only tells us which Gmail connected — no mailbox access.
const SCOPES = `openid email ${GMAIL_SEND_SCOPE}`;

export interface TestSendInput {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
}

interface Connection {
  email: string;
  refreshToken: string;
  testKey: string;
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

/** RFC 2047 — keeps accents in the subject readable. */
function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

@Injectable()
export class EmailConnectionsService {
  private pendingState: string | null = null;
  private connection: Connection | null = null;

  constructor(
    @InjectPinoLogger(EmailConnectionsService.name)
    private readonly logger: PinoLogger,
  ) {
    this.connection = this.loadSavedConnection();
  }

  buildConsentUrl(): string {
    const { clientId } = this.credentials();
    this.pendingState = randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline', // gives a refresh token: we can send later without the user
      prompt: 'consent',
      state: this.pendingState,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(
    code: string | undefined,
    state: string | undefined,
    error: string | undefined,
  ) {
    if (error) throw new BadRequestException(`Google refused: ${error}`);
    if (!code || !state || state !== this.pendingState) {
      throw new BadRequestException('Invalid or expired connect request');
    }
    this.pendingState = null;

    const tokens = await this.requestToken({
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    });
    if (!tokens.refresh_token || !tokens.id_token) {
      throw new BadGatewayException('Google returned no refresh token');
    }
    // Google shows each permission as a checkbox — the user can leave "send" unchecked.
    if (!tokens.scope?.split(' ').includes(GMAIL_SEND_SCOPE)) {
      throw new BadRequestException(
        'The "Send email on your behalf" permission was not granted. Connect again and check that box.',
      );
    }
    // The id_token comes straight from Google over TLS, so reading its payload is enough here.
    const payload = JSON.parse(
      Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8'),
    ) as { email?: string };

    this.connection = {
      email: payload.email ?? 'unknown',
      refreshToken: tokens.refresh_token,
      testKey: randomBytes(16).toString('hex'),
    };
    if (env.NODE_ENV !== 'production') {
      writeFileSync(TEST_CONNECTION_FILE, JSON.stringify(this.connection));
    }
    this.logger.info(
      { email: this.connection.email },
      'Gmail connected (test)',
    );
    return {
      connected: this.connection.email,
      testKey: this.connection.testKey,
      next: 'POST /api/email-connections/google/test-send with header x-test-key',
    };
  }

  async testSend(testKey: string | undefined, input: TestSendInput) {
    if (!this.connection || testKey !== this.connection.testKey) {
      throw new UnauthorizedException('Not connected or wrong test key');
    }
    if (!input?.to || !input.subject || !input.text) {
      throw new BadRequestException('to, subject and text are required');
    }
    const { access_token } = await this.requestToken({
      refresh_token: this.connection.refreshToken,
      grant_type: 'refresh_token',
    });

    const lines = [
      `From: ${this.connection.email}`,
      `To: ${input.to}`,
      `Subject: ${encodeHeader(input.subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
    ];
    if (input.inReplyTo) {
      lines.push(
        `In-Reply-To: ${input.inReplyTo}`,
        `References: ${input.inReplyTo}`,
      );
    }
    const body = Buffer.from(input.text, 'utf8').toString('base64');
    const mime = `${lines.join('\r\n')}\r\n\r\n${body}`;

    const res = await fetch(GMAIL_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: Buffer.from(mime, 'utf8').toString('base64url'),
      }),
    });
    const data = (await res.json()) as { id?: string; threadId?: string };
    if (!res.ok) {
      this.logger.error(
        { status: res.status, data },
        'Gmail send failed (test)',
      );
      throw new BadGatewayException('Gmail send failed');
    }
    this.logger.info(
      { from: this.connection.email, to: input.to, ...data },
      'Gmail email sent (test)',
    );
    return { sent: true, from: this.connection.email, gmailId: data.id };
  }

  private loadSavedConnection(): Connection | null {
    if (env.NODE_ENV === 'production') return null;
    try {
      return JSON.parse(
        readFileSync(TEST_CONNECTION_FILE, 'utf8'),
      ) as Connection;
    } catch {
      return null; // no file yet: connect once
    }
  }

  private credentials() {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    return { clientId, clientSecret };
  }

  private async requestToken(
    params: Record<string, string>,
  ): Promise<TokenResponse> {
    const { clientId, clientSecret } = this.credentials();
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
    if (!res.ok || !data.access_token) {
      this.logger.error(
        {
          status: res.status,
          error: data.error,
          description: data.error_description,
        },
        'Google token request failed (test)',
      );
      throw new BadGatewayException('Google token request failed');
    }
    return data;
  }
}
