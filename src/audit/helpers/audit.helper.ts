import { Prisma } from '@prisma/client';

/** One line of `audit_logs`, as the callers describe it. */
export interface AuditEntry {
  tenantId?: string | null;
  adminUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `entity_id` is a uuid column: anything else is stored as NULL. */
export function asUuidOrNull(value: unknown): string | null {
  return typeof value === 'string' && UUID_REGEX.test(value) ? value : null;
}

/**
 * Keys that hold a credential. Every secret column of the schema ends in
 * `_hash`; `pin` is matched as a whole word so `postal_code` is not hit.
 */
const SECRET_KEY = /password|secret|token|hash|totp|^pin$|_pin$/i;

/** Copy of `value` where every secret-looking key is replaced by `[redacted]`. */
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item));
  if (typeof value !== 'object' || value === null) return value;
  if (value instanceof Date || Prisma.Decimal.isDecimal(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEY.test(key) ? '[redacted]' : redactSecrets(item);
  }
  return out;
}
