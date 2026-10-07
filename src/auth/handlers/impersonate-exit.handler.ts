import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { clearAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';

/**
 * `DELETE /api/admin/impersonate` — the route carries no `tenantId`, so the
 * tenant being exited is read off the still-present `access_token` cookie
 * (the one about to be cleared) rather than asked for again; an
 * expired/invalid/missing cookie just means the exit row names no tenant,
 * never a reason to skip it.
 *
 * **Audit row before cookie clear, and nothing in between may swallow a
 * failure**: `AuditService.write` is awaited directly (not the best-effort
 * `NotificationsService.dispatch` pattern), so a write that throws stops the
 * handler before `clearAuthCookies` runs — an impersonation session that
 * cannot be proven to have ended on paper is never silently cleared.
 */
@Injectable()
export class ImpersonateExitHandler {
  constructor(
    @InjectPinoLogger(ImpersonateExitHandler.name)
    private readonly logger: PinoLogger,
    private readonly tokens: TokenHelper,
    private readonly audit: AuditService,
  ) {}

  async execute(req: Request, actor: RequestActor, res: Response) {
    this.logger.info(
      `Admin ${actor.adminUserId} ending an impersonation session`,
    );

    const tenantId = this.currentTenantId(req);

    await this.audit.write({
      tenantId,
      adminUserId: actor.adminUserId,
      action: 'impersonate_exit',
      entityType: 'tenant',
      entityId: tenantId,
      ipAddress: actor.ip,
    });

    clearAuthCookies(res);
    this.logger.info(
      `Admin ${actor.adminUserId} impersonation session ended${
        tenantId ? ` (tenant ${tenantId})` : ''
      }`,
    );
    return { ended: true };
  }

  /** The tenant of the impersonated session, read from its own access token. */
  private currentTenantId(req: Request): number | null {
    const token = (req.cookies as Record<string, string> | undefined)
      ?.access_token;
    if (!token) return null;
    try {
      return this.tokens.verifyAccessToken(token).tenantId;
    } catch {
      return null;
    }
  }
}
