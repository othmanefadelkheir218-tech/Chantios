import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { randomBytes } from 'node:crypto';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { env } from '../../config/env.config';
import { buildConsentUrl } from '../helpers/gmail-oauth.helper';

/** What the signed Google `state` carries. */
export interface GmailConnectState {
  tenantId: number;
  userId: number;
  nonce: string;
}

export const GMAIL_STATE_AUDIENCE = 'gmail-connect';
const GMAIL_STATE_TTL = '10m';

/**
 * `POST /api/email-inboxes/gmail/connect` — the Google consent link for the
 * caller's OWN Gmail (doc/notes/client-email.md § Who does what). The tenant
 * and the user travel in a signed `state`, valid 10 minutes: the public
 * callback trusts nothing else.
 */
@Injectable()
export class StartGmailConnectHandler {
  constructor(
    @InjectPinoLogger(StartGmailConnectHandler.name)
    private readonly logger: PinoLogger,
    private readonly jwt: JwtService,
  ) {}

  async execute(actor: AuthenticatedUser) {
    if (actor.impersonatedBy) {
      // A mailbox is personal: a platform admin acting as this user may not connect one.
      throw new ForbiddenException(
        'A Gmail cannot be connected while impersonating',
      );
    }
    const payload: GmailConnectState = {
      tenantId: actor.tenantId,
      userId: actor.userId,
      nonce: randomBytes(12).toString('hex'),
    };
    const state = await this.jwt.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      audience: GMAIL_STATE_AUDIENCE,
      expiresIn: GMAIL_STATE_TTL,
    });
    this.logger.info(`Gmail connect started by user ${actor.userId}`);
    return { url: buildConsentUrl(state) };
  }
}
