import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/** `2026-11-03` — a calendar date with no time part. */
export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True for a real calendar date written `YYYY-MM-DD`. The shape alone is not
 * enough: `2026-13-45` matches the pattern but is not a date, and handing it
 * to Prisma ends in a `500`. The round trip through `Date` rejects it (and
 * `2026-02-30`, which JS would silently roll over to March).
 */
export function isValidDateOnly(value: unknown): boolean {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Validates a date-only string (`2026-11-03`) — the one rule for every `_date` field of the API. */
export function IsDateOnly(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isValidDateOnly(value),
        defaultMessage: (args: ValidationArguments) =>
          `${args.property} must be a valid date like 2026-11-03`,
      },
    });
  };
}
