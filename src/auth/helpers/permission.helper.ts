import { ForbiddenException } from '@nestjs/common';
import {
  PermissionModule,
  PermissionScope,
  RolePermission,
} from '@prisma/client';

/** The 7 fixed roles (doc/notes/roles-permissions.md), keyed by `roles.name`. */
export type RoleName =
  | 'admin'
  | 'manager'
  | 'site_supervisor'
  | 'team_leader'
  | 'worker'
  | 'sales'
  | 'accountant';

/** `own` = create / edit / delete, own rows only. `own_view` = read, own rows only. */
type Level = 'full' | 'view' | 'own' | 'own_view' | 'none';

export interface ResolvedPermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: PermissionScope;
}

/**
 * The code default for every (role, module) pair — copied from
 * doc/notes/roles-permissions.md § "Default permissions per role". Keep the
 * two identical; `role_permissions` stores only tenant overrides on top of
 * this, nothing is seeded per tenant.
 */
export const DEFAULT_PERMISSION_MATRIX: Record<
  RoleName,
  Record<PermissionModule, Level>
> = {
  admin: {
    clients: 'full',
    projects: 'full',
    tasks: 'full',
    time_entries: 'full',
    catalogue: 'full',
    stock: 'full',
    quotes: 'full',
    invoices: 'full',
    purchase_invoices: 'full',
    margins: 'full',
    subcontractors: 'full',
    reports: 'full',
    media: 'full',
    chat: 'full',
    team: 'full',
    settings: 'full',
    analytics: 'view',
    contacts: 'view',
    notes: 'own',
  },
  manager: {
    clients: 'full',
    projects: 'full',
    tasks: 'full',
    time_entries: 'full',
    catalogue: 'full',
    stock: 'full',
    quotes: 'full',
    invoices: 'none',
    purchase_invoices: 'none',
    margins: 'full',
    subcontractors: 'full',
    reports: 'full',
    media: 'full',
    chat: 'full',
    team: 'view',
    settings: 'none',
    analytics: 'none',
    contacts: 'view',
    notes: 'own',
  },
  site_supervisor: {
    clients: 'view',
    projects: 'full',
    tasks: 'full',
    time_entries: 'full',
    catalogue: 'view',
    stock: 'view',
    quotes: 'none',
    invoices: 'none',
    purchase_invoices: 'none',
    margins: 'none',
    subcontractors: 'view',
    reports: 'full',
    media: 'full',
    chat: 'full',
    team: 'none',
    settings: 'none',
    analytics: 'none',
    contacts: 'none',
    notes: 'own',
  },
  team_leader: {
    clients: 'none',
    projects: 'view',
    tasks: 'full',
    time_entries: 'full',
    catalogue: 'none',
    stock: 'view',
    quotes: 'none',
    invoices: 'none',
    purchase_invoices: 'none',
    margins: 'none',
    subcontractors: 'none',
    reports: 'full',
    media: 'full',
    chat: 'full',
    team: 'none',
    settings: 'none',
    analytics: 'none',
    contacts: 'none',
    notes: 'own',
  },
  worker: {
    clients: 'none',
    projects: 'none',
    tasks: 'own_view',
    time_entries: 'own',
    catalogue: 'none',
    stock: 'none',
    quotes: 'none',
    invoices: 'none',
    purchase_invoices: 'none',
    margins: 'none',
    subcontractors: 'none',
    reports: 'own_view',
    media: 'own',
    chat: 'own',
    team: 'none',
    settings: 'none',
    analytics: 'none',
    contacts: 'none',
    notes: 'own',
  },
  sales: {
    clients: 'full',
    projects: 'view',
    tasks: 'none',
    time_entries: 'none',
    catalogue: 'view',
    stock: 'none',
    quotes: 'full',
    invoices: 'view',
    purchase_invoices: 'none',
    margins: 'none',
    subcontractors: 'none',
    reports: 'none',
    media: 'view',
    chat: 'full',
    team: 'none',
    settings: 'none',
    analytics: 'none',
    contacts: 'none',
    notes: 'own',
  },
  accountant: {
    clients: 'view',
    projects: 'view',
    tasks: 'none',
    time_entries: 'none',
    catalogue: 'none',
    stock: 'view',
    quotes: 'view',
    invoices: 'full',
    purchase_invoices: 'full',
    margins: 'full',
    subcontractors: 'view',
    reports: 'none',
    media: 'view',
    chat: 'full',
    team: 'none',
    settings: 'none',
    analytics: 'view',
    contacts: 'none',
    notes: 'own',
  },
};

function levelToPermission(level: Level): ResolvedPermission {
  switch (level) {
    case 'full':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        scope: 'all',
      };
    case 'view':
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      };
    case 'own':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        scope: 'own',
      };
    case 'own_view':
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'own',
      };
    case 'none':
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      };
  }
}

/**
 * The code default for a role + module, as the four booleans + scope
 * `PermissionGuard` actually checks.
 */
export function defaultPermission(
  role: RoleName,
  module: PermissionModule,
): ResolvedPermission {
  return levelToPermission(DEFAULT_PERMISSION_MATRIX[role][module]);
}

/**
 * The code default, with this tenant's override applied on top if one
 * exists for this (role, module) — `role_permissions` stores overrides only.
 */
export function resolvePermission(
  role: RoleName,
  module: PermissionModule,
  overrides: Pick<
    RolePermission,
    'module' | 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'scope'
  >[],
): ResolvedPermission {
  const override = overrides.find((row) => row.module === module);
  if (override) {
    return {
      canView: override.canView,
      canCreate: override.canCreate,
      canEdit: override.canEdit,
      canDelete: override.canDelete,
      scope: override.scope,
    };
  }
  return defaultPermission(role, module);
}

/** The two lookups a permission check needs — `RolesService` has them. */
interface PermissionSource {
  findRoleById(id: number): Promise<{ name: string } | null>;
  findOverridesForRole(
    roleId: number,
  ): Promise<Parameters<typeof resolvePermission>[2]>;
}

/**
 * Every module's resolved permission for one role — the same answer as
 * `PermissionGuard` (default matrix + this tenant's overrides). Used by the
 * pages that show one block per module (dashboard, analytics).
 */
export async function loadPermissions(
  roles: PermissionSource,
  roleId: number,
): Promise<(module: PermissionModule) => ResolvedPermission> {
  const role = await roles.findRoleById(roleId);
  if (!role) {
    throw new ForbiddenException('Unknown role');
  }
  const overrides = await roles.findOverridesForRole(roleId);
  return (module) =>
    resolvePermission(role.name as RoleName, module, overrides);
}
