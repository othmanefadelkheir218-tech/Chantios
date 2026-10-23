import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { encryptSecret } from '../../common/helpers/crypto.helper';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { env } from '../../config/env.config';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import {
  exchangeCode,
  GrantedTokens,
  hasSendScope,
  revokeToken,
} from '../helpers/gmail-oauth.helper';
import { forwardLocalPart, slugLocalPart } from '../helpers/inbox.helper';
import { EmailInboxRepository } from '../repositories/email-inbox.repository';
import {
  GMAIL_STATE_AUDIENCE,
  GmailConnectState,
} from './start-gmail-connect.handler';

export type GmailConnectError =
  | 'access_denied'
  | 'invalid_state'
  | 'send_permission_missing'
  | 'user_inactive'
  | 'google_error';

/** A refusal we can explain to the user on the settings page. */
class ConnectRefused extends Error {
  constructor(readonly reason: GmailConnectError) {
    super(reason);
  }
}

/**
 * `GET /api/email-inboxes/gmail/callback` (public — Google calls it). Checks
 * the signed `state`, requires `gmail.send` in the granted scopes, saves the
 * refresh token ENCRYPTED and gives the inbox its forward address. Never
 * throws: it always answers with the settings page URL to redirect to,
 * `?gmail=connected` or `?gmail=error&reason=…`.
 */
@Injectable()
export class FinishGmailConnectHandler {
  constructor(
    @InjectPinoLogger(FinishGmailConnectHandler.name)
    private readonly logger: PinoLogger,
    private readonly jwt: JwtService,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
    private readonly inboxes: EmailInboxRepository,
    private readonly tenants: TenantsService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    code: string | undefined,
    state: string | undefined,
    googleError: string | undefined,
  ): Promise<string> {
    let locale = 'fr';
    try {
      const claims = await this.verifyState(state);
      const tenant = await this.tenants.findForNotifications(claims.tenantId);
      locale = tenant?.locale ?? locale;
      if (googleError || !code) throw new ConnectRefused('access_denied');

      const granted = await this.exchange(code);
      if (!hasSendScope(granted.scopes)) {
        await revokeToken(granted.refreshToken).catch(() => false);
        throw new ConnectRefused('send_permission_missing');
      }

      await this.cls.run(async () => {
        this.tenantContext.setTenantId(claims.tenantId);
        await this.save(claims, granted, tenant?.name ?? 'company');
      });
      return this.settingsUrl(locale, 'gmail=connected');
    } catch (error: unknown) {
      const reason =
        error instanceof ConnectRefused ? error.reason : 'google_error';
      this.logger.warn({ err: error }, `Gmail connect refused: ${reason}`);
      return this.settingsUrl(locale, `gmail=error&reason=${reason}`);
    }
  }

  private async verifyState(
    state: string | undefined,
  ): Promise<GmailConnectState> {
    if (!state) throw new ConnectRefused('invalid_state');
    try {
      return await this.jwt.verifyAsync<GmailConnectState>(state, {
        secret: env.JWT_ACCESS_SECRET,
        audience: GMAIL_STATE_AUDIENCE,
      });
    } catch {
      throw new ConnectRefused('invalid_state');
    }
  }

  private async exchange(code: string): Promise<GrantedTokens> {
    try {
      return await exchangeCode(code);
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'Google code exchange failed');
      throw new ConnectRefused('google_error');
    }
  }

  private async save(
    claims: GmailConnectState,
    granted: GrantedTokens,
    companyName: string,
  ): Promise<void> {
    const user = await this.users.findActiveInTenant(
      claims.userId,
      claims.tenantId,
    );
    if (!user) throw new ConnectRefused('user_inactive');

    const encrypted = encryptSecret(granted.refreshToken);
    const existing = await this.inboxes.findGmailForOwner(
      user.id,
      granted.email,
    );
    if (existing) {
      await this.inboxes.setToken(existing.id, encrypted, granted.scopes);
      await this.writeAudit(claims, existing.id, 'gmail_reconnect');
      this.logger.info(`Gmail inbox ${existing.id} reconnected`);
      return;
    }

    const company = await this.inboxes.findCompanyInbox();
    const base =
      company?.addresses.find((address) => address.isPrimary)?.localPart ??
      slugLocalPart(companyName);
    for (let attempt = 1; ; attempt++) {
      try {
        const inbox = await this.inboxes.createGmailInbox({
          tenantId: claims.tenantId,
          ownerUserId: user.id,
          gmailAddress: granted.email,
          refreshTokenEncrypted: encrypted,
          scopes: granted.scopes,
          localPart: forwardLocalPart(base),
        });
        await this.writeAudit(claims, inbox.id, 'gmail_connect');
        this.logger.info(`Gmail inbox ${inbox.id} connected`);
        return;
      } catch (error: unknown) {
        // A random forward address that already exists: try another one.
        if (!isUniqueViolation(error) || attempt >= 3) throw error;
      }
    }
  }

  private writeAudit(
    claims: GmailConnectState,
    inboxId: number,
    action: string,
  ) {
    return this.audit.write({
      tenantId: claims.tenantId,
      userId: claims.userId,
      action,
      entityType: 'email_inbox',
      entityId: inboxId,
      ipAddress: null,
    });
  }

  private settingsUrl(locale: string, query: string): string {
    return `${env.APP_URL}/${locale}/settings/email?${query}`;
  }
}
