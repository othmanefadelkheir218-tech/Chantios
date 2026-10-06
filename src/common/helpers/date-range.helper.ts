import { BadRequestException } from '@nestjs/common';

/**
 * The single implementation of "`end_date` not before `start_date`" — used by
 * projects, subcontractor contracts and tasks (each backed by its own DB
 * CHECK too). Accepts the ISO date strings a DTO carries or the `Date` a
 * Prisma row already has; only runs when both dates exist.
 */
export function assertDateOrder(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): void {
  if (!startDate || !endDate) return;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    throw new BadRequestException('end_date cannot be before start_date');
  }
}
