import { randomInt } from 'crypto';
import { Prisma, User } from '@prisma/client';

/** The `worker` role id (roles-permissions.md). */
export const WORKER_ROLE_ID = 5;

/** A random 8-digit login code (auth-tokens.md § 2b). Uniqueness is checked by the caller. */
export function randomLoginCode(): string {
  return String(randomInt(10_000_000, 100_000_000));
}

/**
 * What may leave the module. An allow-list, not "everything but the
 * secrets" — `password_hash`, `mobile_pin_hash` and `failed_pin_count`
 * never appear in a response.
 */
export function toUserEntity(user: User) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    roleId: user.roleId,
    name: user.name,
    email: user.email,
    loginCode: user.loginCode,
    mustChangePassword: user.mustChangePassword,
    phone: user.phone,
    hourlyRate: user.hourlyRate,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Builds the Prisma filter for the team list: search, role, active state. */
export function buildUserFilter(
  search?: string,
  roleId?: number,
  isActive?: boolean,
): Prisma.UserWhereInput {
  return {
    ...(roleId !== undefined && { roleId }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}
