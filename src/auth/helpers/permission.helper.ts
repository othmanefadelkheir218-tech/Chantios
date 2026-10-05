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

type Level = 'full' | 'view' | 'own' | 'none';

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
  },
  worker: {
    clients: 'none',
    projects: 'none',
    tasks: 'own',
    time_entries: 'own',
    catalogue: 'none',
    stock: 'none',
    quotes: 'none',
    invoices: 'none',
    purchase_invoices: 'none',
    margins: 'none',
    subcontractors: 'none',
    reports: 'own',
    media: 'own',
    chat: 'own',
    team: 'none',
    settings: 'none',
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
