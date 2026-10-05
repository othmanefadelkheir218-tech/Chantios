import { PermissionModule, Role, RolePermission } from '@prisma/client';
import {
  RoleName,
  resolvePermission,
} from '../../auth/helpers/permission.helper';

export function toRoleEntity(role: Role) {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    isActive: role.isActive,
  };
}

/**
 * One row per (role, module): the code default, with this tenant's override
 * applied on top where one exists. 7 roles × 16 modules.
 */
export function buildPermissionsMatrix(
  roles: Role[],
  overrides: RolePermission[],
) {
  const modules = Object.values(PermissionModule);
  const rows: {
    roleId: number;
    roleName: string;
    module: PermissionModule;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    scope: string;
  }[] = [];

  for (const role of roles) {
    const roleOverrides = overrides.filter((row) => row.roleId === role.id);
    for (const module of modules) {
      const resolved = resolvePermission(
        role.name as RoleName,
        module,
        roleOverrides,
      );
      rows.push({
        roleId: role.id,
        roleName: role.name,
        module,
        ...resolved,
      });
    }
  }
  return rows;
}
