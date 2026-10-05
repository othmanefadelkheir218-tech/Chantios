import { Prisma } from '@prisma/client';

/** One line of `audit_logs`, as the callers describe it. */
export interface AuditEntry {
  tenantId?: number | null;
  adminUserId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
}

/**
 * `tenant_id` / `entity_id` are integer columns: anything that is not a
 * positive integer (already a number, or a numeric string straight off a
 * route param) is stored as NULL.
 */
export function asIdOrNull(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
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
