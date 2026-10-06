import { Injectable } from '@nestjs/common';
import { PortalEventType, PortalTracking, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** The only place where the portal module talks to `portal_tracking` — one row per open or download. */
@Injectable()
export class PortalTrackingRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(
    data: Prisma.PortalTrackingUncheckedCreateInput,
  ): Promise<PortalTracking> {
    return this.tenantPrisma.db.portalTracking.create({ data });
  }

  /** Every event of every link the project ever had ("opened 3 times, downloaded once"). */
  countByType(projectId: number, eventType: PortalEventType): Promise<number> {
    return this.tenantPrisma.db.portalTracking.count({
      where: { eventType, portalToken: { projectId } },
    });
  }

  /** The newest events of a project's links, newest first. */
  findRecentByProject(
    projectId: number,
    take: number,
  ): Promise<PortalTracking[]> {
    return this.tenantPrisma.db.portalTracking.findMany({
      where: { portalToken: { projectId } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }
}
