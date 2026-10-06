import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PermissionScope, Prisma, Report } from '@prisma/client';

/** A `in_progress` project with no report for this many days → "missing report" alert (step 13). */
export const MISSING_REPORT_DAYS = 3;
/** A `in_progress` project whose `progress_pct` has not moved for this many days → "stalled" alert (step 13). */
export const STALLED_PROGRESS_DAYS = 7;

/** What may leave the module. */
export function toReportEntity(report: Report) {
  return {
    id: report.id,
    tenantId: report.tenantId,
    projectId: report.projectId,
    reportDate: report.reportDate,
    progressPct: report.progressPct,
    weather: report.weather,
    note: report.note,
    createdBy: report.createdBy,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

/**
 * Builds the Prisma filter for the report list. `from`/`to` are inclusive
 * report dates. `createdBy` limits the list to one author (`scope = 'own'`).
 */
export function buildReportFilter(filters: {
  projectId?: number;
  from?: string;
  to?: string;
  createdBy?: number;
}): Prisma.ReportWhereInput {
  const reportDate = {
    ...(filters.from && { gte: new Date(filters.from) }),
    ...(filters.to && { lte: new Date(filters.to) }),
  };
  return {
    ...(filters.projectId !== undefined && { projectId: filters.projectId }),
    ...(filters.createdBy !== undefined && { createdBy: filters.createdBy }),
    ...(Object.keys(reportDate).length > 0 && { reportDate }),
  };
}

/** `2026-11-03` — today's UTC calendar day, the default `report_date`. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Who may post a report or declare material: `admin`, `manager`,
 * `supervisor` and `leader` — the roles whose `reports` scope is `all`. The
 * `worker` (scope `own`) logs hours only: never a report, never stock.
 * `sales` and `accountant` have no `reports` access at all (the guard).
 */
export function assertCanPost(scope: PermissionScope): void {
  if (scope === 'own') {
    throw new ForbiddenException(
      'Your role cannot post site reports or declare material — it can only log hours',
    );
  }
}

/** A site report is only ever posted on a project that is running. */
export function assertProjectInProgress(status: string): void {
  if (status !== 'in_progress') {
    throw new BadRequestException(
      `Site reports can only be posted on an in_progress project (this one is ${status})`,
    );
  }
}
