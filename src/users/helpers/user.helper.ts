import { Prisma, User } from '@prisma/client';

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
