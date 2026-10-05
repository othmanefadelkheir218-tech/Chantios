import { SetMetadata } from '@nestjs/common';
import { PermissionModule as PermissionModuleEnum } from '@prisma/client';

export const PERMISSION_MODULE_KEY = 'permissionModule';

/**
 * Marks which `module` key (doc/notes/roles-permissions.md) a route belongs
 * to, for `PermissionGuard` to resolve against the default matrix + this
 * tenant's `role_permissions` overrides.
 */
export const Module = (module: PermissionModuleEnum) =>
  SetMetadata(PERMISSION_MODULE_KEY, module);
