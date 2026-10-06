import { Injectable } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProjectAlertRow {
  projectId: number;
  tenantId: number;
}

/** The only place where the reports module talks to the database. */
@Injectable()
export class ReportRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  create(data: Prisma.ReportUncheckedCreateInput): Promise<Report> {
    return this.tenantPrisma.db.report.create({ data });
  }

  findById(id: number): Promise<Report | null> {
    return this.tenantPrisma.db.report.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.ReportWhereInput,
    skip: number,
    take: number,
  ): Promise<[Report[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.report.findMany({
        where,
        orderBy: [{ reportDate: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.report.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.ReportUncheckedUpdateInput): Promise<Report> {
    return this.tenantPrisma.db.report.update({ where: { id }, data });
  }

  /** Every report id of a project — the photos are read for all of them in one query. */
  async findIdsByProject(projectId: number): Promise<number[]> {
    const rows = await this.tenantPrisma.db.report.findMany({
      where: { projectId },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  /** The upsert check — `UNIQUE (tenant_id, project_id, report_date)`. */
  findByProjectAndDate(
    projectId: number,
    reportDate: Date,
  ): Promise<Report | null> {
    return this.tenantPrisma.db.report.findFirst({
      where: { projectId, reportDate },
    });
  }

  /**
   * The progress % read: the newest report of the project. Progress is never
   * stored on `projects` — this is the only place it comes from.
   */
  findLatestByProject(projectId: number): Promise<Report | null> {
    return this.tenantPrisma.db.report.findFirst({
      where: { projectId },
      orderBy: [{ reportDate: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Cross-tenant, for the daily alert cron (raw SQL on the unscoped client —
   * there is no tenant in context in a cron). `in_progress` projects that have
   * been running for at least `days` days and have had NO report in the last
   * `days` days. Step 13 turns each row into an alert.
   */
  findProjectsWithNoReportSince(days: number): Promise<ProjectAlertRow[]> {
    return this.prisma.$queryRaw<ProjectAlertRow[]>`
      SELECT p.id AS "projectId", p.tenant_id AS "tenantId"
      FROM projects p
      WHERE p.status = 'in_progress'
        AND COALESCE(
              (SELECT MAX(h.changed_at) FROM project_status_history h
                WHERE h.project_id = p.id AND h.to_status = 'in_progress'),
              p.created_at
            ) <= now() - make_interval(days => ${days}::int)
        AND NOT EXISTS (
              SELECT 1 FROM reports r
               WHERE r.project_id = p.id
                 AND r.report_date > CURRENT_DATE - ${days}::int
            )
    `;
  }

  /**
   * Cross-tenant, for the daily alert cron. `in_progress` projects below 100 %
   * whose newest report has the same `progress_pct` as every report of the
   * last `days` days, and that already had a report at least `days` days ago —
   * i.e. the number has not moved for a week. Step 13 turns each row into an
   * alert.
   */
  findProgressUnchangedSince(days: number): Promise<ProjectAlertRow[]> {
    return this.prisma.$queryRaw<ProjectAlertRow[]>`
      SELECT l."projectId", l."tenantId"
      FROM (
        SELECT DISTINCT ON (r.project_id)
               r.project_id AS "projectId", r.tenant_id AS "tenantId",
               r.progress_pct AS "progressPct"
        FROM reports r
        ORDER BY r.project_id, r.report_date DESC, r.id DESC
      ) l
      JOIN projects p ON p.id = l."projectId" AND p.status = 'in_progress'
      WHERE l."progressPct" < 100
        AND EXISTS (
              SELECT 1 FROM reports r
               WHERE r.project_id = l."projectId"
                 AND r.report_date <= CURRENT_DATE - ${days}::int
            )
        AND NOT EXISTS (
              SELECT 1 FROM reports r
               WHERE r.project_id = l."projectId"
                 AND r.report_date > CURRENT_DATE - ${days}::int
                 AND r.progress_pct <> l."progressPct"
            )
    `;
  }
}
