/**
 * The API speaks snake_case (like the database and the step files),
 * Prisma speaks camelCase. These two helpers translate the keys.
 * Dates, Decimals and class instances are never touched.
 */

const toSnake = (key: string) =>
  key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

const toCamel = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/** Keys whose content is free-form JSON: kept exactly as stored. */
const FREE_FORM_KEYS = new Set(['payload', 'oldValue', 'newValue']);

/** `{ legalName }` → `{ legal_name }`, deep. */
export function toSnakeKeys<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => toSnakeKeys(item)) as T;
  }
  if (!isPlainObject(value)) return value as T;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[toSnake(key)] = FREE_FORM_KEYS.has(key) ? item : toSnakeKeys(item);
  }
  return out as T;
}

/** `{ legal_name }` → `{ legalName }`, top level and arrays of objects. */
export function toCamelKeys<T = Record<string, unknown>>(value: object): T {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[toCamel(key)] = Array.isArray(item)
      ? (item as unknown[]).map((entry) =>
          typeof entry === 'object' && entry !== null
            ? toCamelKeys<unknown>(entry)
            : entry,
        )
      : item;
  }
  return out as T;
}
