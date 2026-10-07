import { Injectable } from '@nestjs/common';
import { Prisma, TimeEntry } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface LabourCostRow {
  labourCost: string;
  totalHours: string;
}

export interface StalledProjectRow {
  projectId: number;
  projectName: string;
}

export interface MissingTimesheetRow {
  userId: number;
  userName: string;
}

/** The only place where the time-entries module talks to the database. */
@Injectable()
export class TimeEntryRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  create(data: Prisma.TimeEntryUncheckedCreateInput): Promise<TimeEntry> {
    return this.tenantPrisma.db.timeEntry.create({ data });
  }

  findById(id: number): Promise<TimeEntry | null> {
    return this.tenantPrisma.db.timeEntry.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.TimeEntryWhereInput,
    skip: number,
    take: number,
  ): Promise<[TimeEntry[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.timeEntry.findMany({
        where,
        orderBy: [{ workDate: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.timeEntry.count({ where }),
    ]);
  }

  update(
    id: number,
    data: Prisma.TimeEntryUncheckedUpdateInput,
  ): Promise<TimeEntry> {
    return this.tenantPrisma.db.timeEntry.update({ where: { id }, data });
  }

  delete(id: number): Promise<TimeEntry> {
    return this.tenantPrisma.db.timeEntry.delete({ where: { id } });
  }

  /**
   * SUM of the employee's hours on one day across EVERY project — the input
   * of the daily-hours rule. `excludeId` leaves out the row being edited, so
   * an update is not counted against itself.
   */
  async sumHoursForUserOnDate(
    userId: number,
    workDate: Date,
    excludeId?: number,
  ): Promise<Prisma.Decimal> {
    const result = await this.tenantPrisma.db.timeEntry.aggregate({
      where: {
        userId,
        workDate,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      _sum: { hours: true },
    });
    return result._sum.hours ?? new Prisma.Decimal(0);
  }

  /** The one row allowed per employee + project + day (`UNIQUE`). */
  findByUserProjectDate(
    userId: number,
    projectId: number,
    workDate: Date,
  ): Promise<TimeEntry | null> {
    return this.tenantPrisma.db.timeEntry.findFirst({
      where: { userId, projectId, workDate },
    });
  }

  /**
   * `SUM(hours × hourly_rate)` with the FROZEN rate on each row — never
   * `users.hourly_rate`. Raw SQL on the unscoped client, so `tenant_id` is
   * passed by hand (the tenant extension cannot see inside `$queryRaw`).
   */
  async sumLabourCostByProject(
    projectId: number,
    tenantId: number,
  ): Promise<LabourCostRow> {
    const rows = await this.prisma.$queryRaw<LabourCostRow[]>`
      SELECT ROUND(COALESCE(SUM(hours * hourly_rate), 0), 2)::text AS "labourCost",
             COALESCE(SUM(hours), 0)::text AS "totalHours"
      FROM time_entries
      WHERE tenant_id = ${tenantId} AND project_id = ${projectId}
    `;
    return rows[0];
  }

  /**
   * The stalled-project alert: `in_progress` projects of this tenant that have
   * been running for at least `days` days and have had NO hours logged in the
   * last `days` days. Raw SQL — `tenant_id` is passed by hand.
   */
  findProjectsWithNoEntriesSince(
    days: number,
    tenantId: number,
  ): Promise<StalledProjectRow[]> {
    return this.prisma.$queryRaw<StalledProjectRow[]>`
      SELECT p.id AS "projectId", p.name AS "projectName"
      FROM projects p
      WHERE p.tenant_id = ${tenantId}
        AND p.status = 'in_progress'
        AND COALESCE(
              (SELECT MAX(h.changed_at) FROM project_status_history h
                WHERE h.project_id = p.id AND h.to_status = 'in_progress'),
              p.created_at
            ) <= now() - make_interval(days => ${days}::int)
        AND NOT EXISTS (
              SELECT 1 FROM time_entries e
               WHERE e.project_id = p.id AND e.tenant_id = p.tenant_id
                 AND e.work_date > CURRENT_DATE - ${days}::int
            )
    `;
  }

  /**
   * The missing-timesheet alert: active employees of this tenant who have a
   * task `in_progress` and no time entry on `date`.
   */
  findMissingTimesheets(
    date: string,
    tenantId: number,
  ): Promise<MissingTimesheetRow[]> {
    return this.prisma.$queryRaw<MissingTimesheetRow[]>`
      SELECT DISTINCT u.id AS "userId", u.name AS "userName"
      FROM task_assignees ta
      JOIN tasks t ON t.id = ta.task_id AND t.tenant_id = ta.tenant_id
      JOIN users u ON u.id = ta.user_id
      WHERE ta.tenant_id = ${tenantId}
        AND t.status = 'in_progress'
        AND u.is_active = true
        AND NOT EXISTS (
              SELECT 1 FROM time_entries e
               WHERE e.user_id = u.id AND e.tenant_id = ta.tenant_id
                 AND e.work_date = ${date}::date
            )
      ORDER BY u.id
    `;
  }

  /** Ids of the users of the CURRENT tenant who logged hours on `date` (the end-of-day reminder). */
  async findUserIdsWithEntryOn(date: Date): Promise<number[]> {
    const rows = await this.tenantPrisma.db.timeEntry.findMany({
      where: { workDate: date },
      select: { userId: true },
      distinct: ['userId'],
    });
    return rows.map((row) => row.userId);
  }
}
