import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, TimeEntry } from '@prisma/client';
import { MAX_DAILY_HOURS } from './daily-hours.helper';

/** What may leave the module. */
export function toTimeEntryEntity(entry: TimeEntry) {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    projectId: entry.projectId,
    userId: entry.userId,
    taskId: entry.taskId,
    workDate: entry.workDate,
    hours: entry.hours,
    hourlyRate: entry.hourlyRate,
    comment: entry.comment,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/** The entry plus what the same-day rule found — lets the app show a friendly message. */
export function withDailyInfo(
  entity: ReturnType<typeof toTimeEntryEntity>,
  dailyTotal: Prisma.Decimal,
  abnormal: boolean,
) {
  return {
    ...entity,
    dailyTotalHours: dailyTotal.toFixed(2),
    abnormalHours: abnormal,
  };
}

/** `hours > 0 AND hours <= 24` — mirrors the `chk_hours_range` DB constraint. */
export function assertHoursRange(hours: string): void {
  const value = new Prisma.Decimal(hours);
  if (value.lessThanOrEqualTo(0) || value.greaterThan(MAX_DAILY_HOURS)) {
    throw new BadRequestException(
      `hours must be more than 0 and at most ${MAX_DAILY_HOURS}`,
    );
  }
}

/** Builds the Prisma filter for the time-entry list. `from`/`to` are inclusive work dates. */
export function buildTimeEntryFilter(filters: {
  userId?: number;
  projectId?: number;
  from?: string;
  to?: string;
}): Prisma.TimeEntryWhereInput {
  const workDate = {
    ...(filters.from && { gte: new Date(filters.from) }),
    ...(filters.to && { lte: new Date(filters.to) }),
  };
  return {
    ...(filters.userId !== undefined && { userId: filters.userId }),
    ...(filters.projectId !== undefined && { projectId: filters.projectId }),
    ...(Object.keys(workDate).length > 0 && { workDate }),
  };
}

/** `2026-11-03` — the UTC calendar day of a timestamp. */
export function toUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * If `task_id` is given, the task must exist and belong to the entry's
 * project. `task` is what `TasksService.findByIdRaw` returned.
 */
export function assertTaskInProject(
  task: { projectId: number } | null,
  projectId: number,
): void {
  if (!task) {
    throw new BadRequestException('Task not found');
  }
  if (task.projectId !== projectId) {
    throw new BadRequestException('The task does not belong to this project');
  }
}

/** Roles with scope `own` log for themselves only. */
export function assertCanLogFor(
  targetUserId: number,
  actorUserId: number,
  isOwnScope: boolean,
): void {
  if (isOwnScope && targetUserId !== actorUserId) {
    throw new ForbiddenException('You can only log your own hours');
  }
}
