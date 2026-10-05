import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../helpers/permission.helper';

export const ROLES_KEY = 'roles';

/** Marks a route as restricted to specific roles, checked by `PermissionGuard`. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
