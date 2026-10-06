import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'adminRoles';

/** Restricts a platform route to these `admin_users.role` values, checked by `AdminAuthGuard`. */
export const AdminRoles = (...roles: string[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
