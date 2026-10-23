import { Prisma, Tenant } from '@prisma/client';
import { isDeepStrictEqual } from 'node:util';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
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

/** IBAN / BIC are stored without spaces, in capitals. `null` clears the field. */
function normalizeBankCode(value: string | null | undefined) {
  if (value === undefined || value === null) return value;
  return value.replace(/\s+/g, '').toUpperCase();
}

/** `PATCH /api/tenant` DTO into Prisma data. Never `email` or `currency` (not in the DTO). */
export function toTenantProfileData(
  dto: UpdateTenantProfileDto,
): Prisma.TenantUpdateInput {
  const { end_of_day_reminder_time, iban, bic, ...rest } = dto;
  return {
    ...toCamelKeys<Prisma.TenantUpdateInput>(rest),
    ...(iban !== undefined && { iban: normalizeBankCode(iban) }),
    ...(bic !== undefined && { bic: normalizeBankCode(bic) }),
    ...(end_of_day_reminder_time && {
      endOfDayReminderTime: timeToDate(end_of_day_reminder_time),
    }),
  };
}

/**
 * Same values as before (an empty body, or the same data again): the caller
 * writes no audit line. `updatedAt` always moves, so it is ignored.
 */
export function isSameTenant(
  before: ReturnType<typeof toTenantEntity>,
  after: ReturnType<typeof toTenantEntity>,
): boolean {
  return isDeepStrictEqual(
    { ...before, updatedAt: 0 },
    { ...after, updatedAt: 0 },
  );
}

/** Step 27: the country or the TVA number changed → the TVA may change from the next invoice. */
export function taxProfileChanged(before: Tenant, after: Tenant): boolean {
  return (
    before.country !== after.country ||
    before.vatNumber !== after.vatNumber ||
    before.vatNumberStatus !== after.vatNumberStatus
  );
}

/** Response shape: the reminder time goes back to `HH:mm`. */
export function toTenantEntity(tenant: Tenant) {
  return {
    ...tenant,
    endOfDayReminderTime: dateToTime(tenant.endOfDayReminderTime),
  };
}

/**
 * Builds the Prisma filter to search in name, legal name, email and city.
 * `deleted` = only soft-deleted tenants; otherwise only live ones.
 */
export function buildTenantFilter(
  search?: string,
  status?: Tenant['status'],
  deleted = false,
): Prisma.TenantWhereInput {
  return {
    deletedAt: deleted ? { not: null } : null,
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
