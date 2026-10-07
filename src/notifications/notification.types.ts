/** Alerts for the people of one company (stored in `notifications.user_id`). */
export const TENANT_ALERT_TYPES = [
  'low_stock',
  'reservation_unmet',
  'margin_warning',
  'margin_critical',
  'invoice_late',
  'invoice_paid',
  'purchase_due',
  'abnormal_hours',
  'missing_timesheet',
  'stalled_project',
  'missing_report',
  'progress_stalled',
  'project_cancelled',
  'new_message',
  'support_reply',
  'task_assigned',
  'task_starting',
  'task_status_changed',
  'end_of_day_reminder',
  'subscription_payment_failed',
  'subscription_renewal_upcoming',
] as const;

/** Alerts for ChantierOS staff (stored in `notifications.admin_user_id`, `tenant_id` NULL). */
export const PLATFORM_ALERT_TYPES = [
  'tenant_signed_up',
  'payment_received',
  'payment_failed',
  'tenant_status_changed',
  'support_ticket_opened',
  'usage_spike',
] as const;

/** Email only, no row (doc/notes/alerts.md § 5). */
export const CLIENT_EMAIL_TYPES = [
  'client_quote_sent',
  'client_invoice_sent',
  'client_invoice_late',
  'client_portal_message',
] as const;

export type TenantAlertType = (typeof TENANT_ALERT_TYPES)[number];
export type PlatformAlertType = (typeof PLATFORM_ALERT_TYPES)[number];
export type ClientEmailType = (typeof CLIENT_EMAIL_TYPES)[number];
export type NotificationType =
  TenantAlertType | PlatformAlertType | ClientEmailType;

export const NOTIFICATIONS_QUEUE = 'notifications';

/** Who reads a notification: exactly one of the two (DB CHECK `chk_notification_one_recipient`). */
export type NotificationRecipient =
  { userId: number; tenantId: number } | { adminUserId: number };

/**
 * What a caller hands to `NotificationsService.dispatch()`.
 * - `tenantId`: the company the alert is about (not needed for platform alerts).
 * - `userIds`: explicit recipients, for the types that target named people
 *   (a worker's task, the members of a conversation).
 * - `excludeUserIds`: never notify these (the sender of a message).
 * - `clientEmail`: the address of a client email type.
 * - `payload`: stored as is in `notifications.payload` — snake_case keys,
 *   `entity_id` is the key `dedupeDays` looks at.
 * - `dedupeDays`: skip a recipient who already got the same type + `entity_id`
 *   inside that window (a daily cron must not repeat itself every morning).
 */
export interface DispatchContext {
  tenantId?: number | null;
  userIds?: number[];
  excludeUserIds?: number[];
  clientEmail?: string;
  payload?: Record<string, unknown>;
  dedupeDays?: number;
}

export interface NotificationJob {
  type: NotificationType;
  context: DispatchContext;
}

export function isPlatformType(type: string): type is PlatformAlertType {
  return (PLATFORM_ALERT_TYPES as readonly string[]).includes(type);
}

export function isClientEmailType(type: string): type is ClientEmailType {
  return (CLIENT_EMAIL_TYPES as readonly string[]).includes(type);
}
