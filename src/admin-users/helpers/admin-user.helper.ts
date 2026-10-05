import { AdminUser, Prisma } from '@prisma/client';

/**
 * What may leave the module. An allow-list, not "everything but the secrets":
 * a column added later is private until someone decides to expose it.
 */
export function toAdminUserEntity(admin: AdminUser) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

/** Builds the Prisma filter to search in name and email. */
export function buildAdminUserFilter(
  search?: string,
): Prisma.AdminUserWhereInput {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  };
}
