import { Prisma, Tenant } from '@prisma/client';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

/** `end_of_day_reminder_time` is a TIME column: Prisma wants a Date. */
export function timeToDate(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

export function dateToTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/** Turns a create/update DTO into the data Prisma expects. */
export function toTenantData(
  dto: CreateTenantDto | UpdateTenantDto,
): Prisma.TenantUpdateInput {
  const { end_of_day_reminder_time, email, ...rest } = dto;
  return {
    ...toCamelKeys<Prisma.TenantUpdateInput>(rest),
    ...(email && { email: email.toLowerCase() }),
    ...(end_of_day_reminder_time && {
      endOfDayReminderTime: timeToDate(end_of_day_reminder_time),
    }),
  };
}

/** Response shape: the reminder time goes back to `HH:mm`. */
export function toTenantEntity(tenant: Tenant) {
  return {
    ...tenant,
    endOfDayReminderTime: dateToTime(tenant.endOfDayReminderTime),
  };
}

/** Builds the Prisma filter to search in name, legal name, email and city. */
export function buildTenantFilter(
  search?: string,
  status?: Tenant['status'],
): Prisma.TenantWhereInput {
  return {
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}
