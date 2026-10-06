import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import {
  hashToken,
  isTokenUsable,
  PORTAL_EXPIRED_MESSAGE,
} from '../helpers/portal.helper';
import { PortalTokenRepository } from '../repositories/portal-token.repository';

/**
 * The only gate of every client route (`/api/portal/:token/...`). No JWT, so
 * `AuthGuard` and `TenantGuard` never run — the URL is the key.
 *
 * Three checks, in order:
 *   1. the sha256 of the URL token matches a `token_hash` row;
 *   2. `is_active = true`;
 *   3. `expires_at` has not passed.
 * ANY failure gives the SAME `403` and the SAME message — no detail about
 * which check failed, so a probe learns nothing.
 *
 * Then THE detail of this step: the Prisma tenant extension still needs a
 * `tenant_id`, and a portal request has none. The token row supplies it — the
 * guard writes that row's `tenant_id` into `nestjs-cls` before any other query
 * runs. Skip it and every repository read after this throws "no tenant in
 * context". The same row also fixes the project and the client for the whole
 * request, so a route can never be talked into another project's data.
 */
@Injectable()
export class PortalTokenGuard implements CanActivate {
  constructor(
    private readonly tokens: PortalTokenRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const rawToken = req.params?.token;
    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new ForbiddenException(PORTAL_EXPIRED_MESSAGE);
    }

    const token = await this.tokens.findByHash(hashToken(rawToken));
    if (!token || !isTokenUsable(token)) {
      throw new ForbiddenException(PORTAL_EXPIRED_MESSAGE);
    }

    this.tenantContext.setTenantId(token.tenantId);

    const portal: PortalContextData = {
      tokenId: token.id,
      tenantId: token.tenantId,
      projectId: token.projectId,
      clientId: token.clientId,
      expiresAt: token.expiresAt,
      ip: req.ip ?? null,
    };
    (req as unknown as { portal: PortalContextData }).portal = portal;
    return true;
  }
}
