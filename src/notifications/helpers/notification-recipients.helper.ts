import { PermissionModule } from '@prisma/client';
import {
  RoleName,
  resolvePermission,
} from '../../auth/helpers/permission.helper';
import {
  NotificationType,
  isClientEmailType,
  isPlatformType,
} from '../notification.types';

/**
 * WHO gets each alert — the one place. Nobody else decides a recipient.
 * - `staff`: the tenant's admin and manager, kept only if their role can VIEW
 *   `module` (default matrix + this tenant's `role_permissions` overrides) —
 *   so the billing alerts skip a manager unless the company gave them invoices.
 * - `explicit`: named users given by the caller (a worker's task, the members
 *   of a conversation).
 * - `platform`: every active ChantierOS admin user.
 * - `client`: an email address, no row.
 */
export type RecipientRule =
  | { kind: 'staff'; module: PermissionModule }
  | { kind: 'explicit' }
  | { kind: 'platform' }
  | { kind: 'client' };

export const STAFF_ROLES: readonly RoleName[] = ['admin', 'manager'];

const STAFF_MODULE: Partial<Record<NotificationType, PermissionModule>> = {
  low_stock: 'stock',
  reservation_unmet: 'stock',
  margin_warning: 'margins',
  margin_critical: 'margins',
  invoice_late: 'invoices',
  invoice_paid: 'invoices',
  purchase_due: 'purchase_invoices',
  abnormal_hours: 'time_entries',
  missing_timesheet: 'time_entries',
  stalled_project: 'projects',
  project_cancelled: 'projects',
  missing_report: 'reports',
  progress_stalled: 'reports',
  subscription_payment_failed: 'settings',
  subscription_renewal_upcoming: 'settings',
};

export function recipientRule(type: NotificationType): RecipientRule {
  if (isPlatformType(type)) return { kind: 'platform' };
  if (isClientEmailType(type)) return { kind: 'client' };
  const module = STAFF_MODULE[type];
  return module ? { kind: 'staff', module } : { kind: 'explicit' };
}

export interface StaffCandidate {
  id: number;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
}

type Overrides = Parameters<typeof resolvePermission>[2];

/** Pure: the candidates who may see `module`, given each role's overrides. */
export function filterStaffRecipients(
  candidates: StaffCandidate[],
  module: PermissionModule,
  overridesByRoleId: Map<number, Overrides>,
): StaffCandidate[] {
  return candidates.filter((user) => {
    if (!STAFF_ROLES.includes(user.roleName as RoleName)) return false;
    const overrides = overridesByRoleId.get(user.roleId) ?? [];
    return resolvePermission(user.roleName as RoleName, module, overrides)
      .canView;
  });
}
