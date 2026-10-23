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
 * - `viewers` (step 25): every active user of ANY role who can view `module`.
 *   `named: 'only'` keeps only the caller's `userIds` among them when given
 *   (a Gmail inbox: its owner); `named: 'also'` adds the `userIds` to them
 *   (a disconnected Gmail: its owner + the users with `settings`).
 */
export type RecipientRule =
  | { kind: 'staff'; module: PermissionModule }
  | { kind: 'viewers'; module: PermissionModule; named: 'only' | 'also' }
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
  subscription_payment_received: 'settings',
  subscription_renewal_upcoming: 'settings',
  trial_ending: 'settings',
  trial_ended: 'settings',
  subscription_blocked: 'settings',
};

/** Step 25 — doc/notes/client-email.md § Where it shows. */
const VIEWER_RULES: Partial<Record<NotificationType, RecipientRule>> = {
  new_email: { kind: 'viewers', module: 'email', named: 'only' },
  email_mailbox_disconnected: {
    kind: 'viewers',
    module: 'settings',
    named: 'also',
  },
};

export function recipientRule(type: NotificationType): RecipientRule {
  if (isPlatformType(type)) return { kind: 'platform' };
  const viewers = VIEWER_RULES[type];
  if (viewers) return viewers;
  if (isClientEmailType(type)) return { kind: 'client' };
  const module = STAFF_MODULE[type];
  return module ? { kind: 'staff', module } : { kind: 'explicit' };
}

export interface StaffCandidate {
  id: number;
  /** `null` = a worker with no email: in-app only, no email sent. */
  email: string | null;
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

/** Pure: the candidates of any role who may view `module`. */
export function filterModuleViewers(
  candidates: StaffCandidate[],
  module: PermissionModule,
  overridesByRoleId: Map<number, Overrides>,
): StaffCandidate[] {
  return candidates.filter((user) => {
    const overrides = overridesByRoleId.get(user.roleId) ?? [];
    return resolvePermission(user.roleName as RoleName, module, overrides)
      .canView;
  });
}

/** Pure: the `viewers` rule — module viewers, combined with the named users. */
export function pickViewers(
  candidates: StaffCandidate[],
  rule: Extract<RecipientRule, { kind: 'viewers' }>,
  overridesByRoleId: Map<number, Overrides>,
  userIds: number[] | undefined,
): StaffCandidate[] {
  const viewers = filterModuleViewers(
    candidates,
    rule.module,
    overridesByRoleId,
  );
  if (!userIds || userIds.length === 0) return viewers;
  const named = new Set(userIds);
  if (rule.named === 'only')
    return viewers.filter((user) => named.has(user.id));
  const ids = new Set(viewers.map((user) => user.id));
  return [
    ...viewers,
    ...candidates.filter((user) => named.has(user.id) && !ids.has(user.id)),
  ];
}
