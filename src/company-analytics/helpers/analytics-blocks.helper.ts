import { Prisma, QuoteStatus } from '@prisma/client';
import { localMoment } from '../../common/helpers/tenant-local-time.helper';
import { MarginRow, toMarginEntity } from '../../margins/helpers/margin.helper';
import { AnalyticsPeriod } from './analytics-period.helper';

/** How many rows the "top / best / worst" lists show. */
export const ANALYTICS_LIST_SIZE = 5;

const ZERO = new Prisma.Decimal(0);

/** `part ÷ whole × 100`, 1 decimal, or `null` when there is nothing to divide by. */
export function percentOf(
  part: Prisma.Decimal | number,
  whole: Prisma.Decimal | number,
): Prisma.Decimal | null {
  const total = new Prisma.Decimal(whole);
  if (total.lte(0)) return null;
  return new Prisma.Decimal(part).div(total).mul(100).toDecimalPlaces(1);
}

/**
 * Per-day totals → one total per month of the period, in order, `0` for an
 * empty month. A `@db.Date` day is UTC midnight, so its month is read as is.
 */
export function totalsByMonth(
  months: string[],
  rows: { day: Date; value: Prisma.Decimal }[],
): Prisma.Decimal[] {
  const byMonth = new Map(months.map((month) => [month, ZERO]));
  for (const row of rows) {
    const month = row.day.toISOString().slice(0, 7);
    const current = byMonth.get(month);
    if (current !== undefined) byMonth.set(month, current.add(row.value));
  }
  return months.map((month) => byMonth.get(month) ?? ZERO);
}

export const sumAll = (values: Prisma.Decimal[]) =>
  values.reduce((sum, value) => sum.add(value), ZERO);

/** The month (`YYYY-MM`) of a moment in the tenant's timezone, or `null` when its local day is outside the period. */
function localMonthIn(
  at: Date | null,
  period: AnalyticsPeriod,
  timeZone: string,
): string | null {
  if (!at) return null;
  const day = localMoment(at, timeZone).date;
  return day >= period.from && day <= period.to ? day.slice(0, 7) : null;
}

export interface QuoteDates {
  status: QuoteStatus;
  sentAt: Date | null;
  acceptedAt: Date | null;
  refusedAt: Date | null;
}

/**
 * The `quotes` block (doc/notes/analytics.md). Per month: sent by `sent_at`,
 * accepted by `accepted_at`, refused by `refused_at`. Conversion = the quotes
 * sent in the period that are now `accepted` ÷ the quotes sent in the period.
 */
export function quotesBlock(
  quotes: QuoteDates[],
  period: AnalyticsPeriod,
  timeZone: string,
) {
  const byMonth = new Map(
    period.months.map((month) => [month, { sent: 0, accepted: 0, refused: 0 }]),
  );
  const count = (at: Date | null, key: 'sent' | 'accepted' | 'refused') => {
    const month = localMonthIn(at, period, timeZone);
    const row = month ? byMonth.get(month) : undefined;
    if (row) row[key] += 1;
    return row !== undefined;
  };

  const sentInPeriod = { sent: 0, accepted: 0, refused: 0, waiting: 0 };
  for (const quote of quotes) {
    if (count(quote.sentAt, 'sent')) {
      sentInPeriod.sent += 1;
      if (quote.status === 'accepted') sentInPeriod.accepted += 1;
      if (quote.status === 'refused') sentInPeriod.refused += 1;
      if (quote.status === 'sent') sentInPeriod.waiting += 1;
    }
    count(quote.acceptedAt, 'accepted');
    count(quote.refusedAt, 'refused');
  }

  return {
    ...sentInPeriod,
    conversionPct: percentOf(sentInPeriod.accepted, sentInPeriod.sent),
    byMonth: period.months.map((month) => ({ month, ...byMonth.get(month)! })),
  };
}

/**
 * The `margins` block. Average = Σ margin ÷ Σ budget, so a big project
 * weighs more. `rows` come best first; "worst" is taken from what is left,
 * so a project is never in both lists. Worst first in "worst".
 */
export function marginsBlock(rows: MarginRow[]) {
  const budget = sumAll(rows.map((row) => row.budgetExclVat));
  const margin = sumAll(rows.map((row) => row.marginExclVat));
  const best = rows.slice(0, ANALYTICS_LIST_SIZE);
  const worst = rows
    .slice(Math.max(best.length, rows.length - ANALYTICS_LIST_SIZE))
    .reverse();
  return {
    averagePct: percentOf(margin, budget),
    projectCount: rows.length,
    best: best.map(toMarginEntity),
    worst: worst.map(toMarginEntity),
  };
}

/** The aging groups, in the order the page shows them. */
const AGING_BUCKETS = [
  'not_due',
  'late_1_30',
  'late_31_60',
  'late_60_plus',
] as const;

/** The `aging` block: the four groups (an empty one is `0`) + the total open. */
export function agingBlock(
  rows: { bucket: string; count: number; balanceDue: Prisma.Decimal }[],
) {
  const buckets = AGING_BUCKETS.map((bucket) => {
    const row = rows.find((item) => item.bucket === bucket);
    return {
      bucket,
      count: row?.count ?? 0,
      balanceDue: row?.balanceDue ?? ZERO,
    };
  });
  return {
    buckets,
    total: {
      count: buckets.reduce((sum, bucket) => sum + bucket.count, 0),
      balanceDue: sumAll(buckets.map((bucket) => bucket.balanceDue)),
    },
  };
}
