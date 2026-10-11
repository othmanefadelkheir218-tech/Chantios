import { Injectable } from '@nestjs/common';
import { MarginAlertLevel } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the margins module touches `project_margin_alerts` —
 * one row per `(project_id, level)`, the dedup that makes each alert level
 * fire ONCE.
 */
@Injectable()
export class MarginAlertRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * Writes the `(project, level)` row and returns `true` only if THIS call
   * created it. The primary key is the dedup: two saves at the same moment
   * cannot both insert, so an alert can never be sent twice.
   */
  async createIfAbsent(
    projectId: number,
    level: MarginAlertLevel,
    tenantId: number,
  ): Promise<boolean> {
    const { count } = await this.tenantPrisma.db.projectMarginAlert.createMany({
      data: [{ tenantId, projectId, level }],
      skipDuplicates: true,
    });
    return count === 1;
  }

  /**
   * The reset: deletes the rows of every level that is NOT reached any more
   * (an extra accepted quote raised the budget, so the cost fell back under
   * the threshold) — those levels can fire again later.
   */
  async deleteLevelsNotIn(
    projectId: number,
    reached: MarginAlertLevel[],
  ): Promise<number> {
    const { count } = await this.tenantPrisma.db.projectMarginAlert.deleteMany({
      where: { projectId, level: { notIn: reached } },
    });
    return count;
  }

  /**
   * Dashboard (step 18): open (`in_progress`) projects at each alert level.
   * A critical project also has a warning row, so `warning` counts the
   * projects at warning only. Rows of a closed project are ignored.
   */
  async countOpenProjectsByLevel(): Promise<{
    warning: number;
    critical: number;
  }> {
    const [warning, critical] = await Promise.all([
      this.tenantPrisma.db.projectMarginAlert.count({
        where: {
          level: 'warning',
          project: {
            status: 'in_progress',
            marginAlerts: { none: { level: 'critical' } },
          },
        },
      }),
      this.tenantPrisma.db.projectMarginAlert.count({
        where: { level: 'critical', project: { status: 'in_progress' } },
      }),
    ]);
    return { warning, critical };
  }
}
