import { Injectable } from '@nestjs/common';
import { PortalToken, Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the portal module talks to `portal_tokens`. */
@Injectable()
export class PortalTokenRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  /** In the caller's transaction (`tx` required): the old link goes inactive and the new one is written together. */
  create(
    data: Prisma.PortalTokenUncheckedCreateInput,
    tx: TenantTransactionClient,
  ): Promise<PortalToken> {
    return tx.portalToken.create({ data });
  }

  /**
   * NOT tenant-filtered — on purpose, on the UNWRAPPED client. This is the
   * query that ESTABLISHES the tenant: a portal request has no JWT, so when
   * `PortalTokenGuard` runs there is no `tenant_id` in `nestjs-cls` yet, and
   * the tenant extension would refuse the read. The guard looks the token up
   * by its sha256 hash here, then writes the row's `tenant_id` into CLS before
   * any other query runs. Same reason, same shape, as `users.findByEmail`
   * (step 02). It returns the row whatever its status — the guard decides.
   */
  findByHash(tokenHash: string): Promise<PortalToken | null> {
    return this.prisma.portalToken.findUnique({ where: { tokenHash } });
  }

  /** The project's one live link (`idx_portal_one_active`), if there is one. */
  findActiveByProject(projectId: number): Promise<PortalToken | null> {
    return this.tenantPrisma.db.portalToken.findFirst({
      where: { projectId, isActive: true },
    });
  }

  /** The newest link of a project, active or not (for the status read). */
  findLatestByProject(projectId: number): Promise<PortalToken | null> {
    return this.tenantPrisma.db.portalToken.findFirst({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /** Instant, no cache, no grace period: the very next request fails. Returns how many links went inactive. */
  async deactivateByProject(
    projectId: number,
    tx?: TenantTransactionClient,
  ): Promise<number> {
    const { count } = await (tx ?? this.tenantPrisma.db).portalToken.updateMany(
      {
        where: { projectId, isActive: true },
        data: { isActive: false },
      },
    );
    return count;
  }

  /**
   * The daily expiry cron — every tenant, no tenant in context (a cron has no
   * request), so the unwrapped client. Marks every link past `expires_at`
   * inactive. The guard also checks `expires_at` itself, so a link never
   * works past its date even before this runs.
   */
  async deactivateExpired(): Promise<number> {
    const { count } = await this.prisma.portalToken.updateMany({
      where: { isActive: true, expiresAt: { lt: new Date() } },
      data: { isActive: false },
    });
    return count;
  }
}
