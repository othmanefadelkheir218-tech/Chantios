import { Injectable } from '@nestjs/common';
import { Prisma, TimeEntry } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface LabourCostRow {
  labourCost: string;
  totalHours: string;
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

  // TODO: step 13 — `findProjectsWithNoEntriesSince(days)` for the stalled-project
  // alert and the missing-timesheet query (a task `in_progress` today with no
  // entry for today) live with the alerts, not here.
}
