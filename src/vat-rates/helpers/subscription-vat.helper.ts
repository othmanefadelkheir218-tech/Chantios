import { VatNumberStatus } from '@prisma/client';

/** What the rule needs to know about a company. */
export interface VatCompany {
  country: string | null;
  vatNumber: string | null;
  vatNumberStatus: VatNumberStatus | null;
}

/** What the rule needs to know about the company's TVA-table row. */
export interface VatRow {
  rate: string;
  isEu: boolean;
  isActive: boolean;
  stripeTaxRateId: string;
  stripeReverseChargeTaxRateId: string | null;
}

export type SubscriptionVat =
  | {
      kind: 'domestic' | 'reverse_charge' | 'country_rate';
      country: string;
      /** Percent, as a string ("21.00"). "0.00" for reverse charge. */
      rate: string;
      stripeTaxRateId: string;
    }
  | {
      kind: 'missing';
      reason: 'no_country' | 'country_not_supported';
    };

/** Reverse charge needs a TVA number VIES said is valid, or `not_checked` (VAT_NUMBER_CHECK=off). */
const REVERSE_CHARGE_STATUSES: readonly VatNumberStatus[] = [
  'valid',
  'not_checked',
];
/** With the real check on, only a number VIES said is valid gives the reverse charge. */
const CHECKED_STATUSES: readonly VatNumberStatus[] = ['valid'];

/**
 * THE rule of which TVA a company pays on its subscription — nothing else
 * decides it. doc/notes/subscription-plans.md § TVA on the subscription,
 * table in doc/notes/Phaces/27-subscription-tva.md § 3.
 *
 * `row` = the TVA-table row of the company's country, or `null`.
 */
export function resolveSubscriptionVat(
  company: VatCompany,
  sellerCountry: string,
  row: VatRow | null,
  /** false (`VAT_NUMBER_CHECK=vies`): a `not_checked` number from test mode no longer counts. */
  acceptNotChecked = true,
): SubscriptionVat {
  const country = company.country?.trim().toUpperCase() || null;
  if (!country) return { kind: 'missing', reason: 'no_country' };
  if (!row || !row.isActive) {
    return { kind: 'missing', reason: 'country_not_supported' };
  }

  const normal = {
    country,
    rate: row.rate,
    stripeTaxRateId: row.stripeTaxRateId,
  };
  if (country === sellerCountry) return { kind: 'domestic', ...normal };

  const hasCheckedNumber =
    !!company.vatNumber?.trim() &&
    company.vatNumberStatus !== null &&
    (acceptNotChecked ? REVERSE_CHARGE_STATUSES : CHECKED_STATUSES).includes(
      company.vatNumberStatus,
    );
  if (row.isEu && hasCheckedNumber && row.stripeReverseChargeTaxRateId) {
    return {
      kind: 'reverse_charge',
      country,
      rate: '0.00',
      stripeTaxRateId: row.stripeReverseChargeTaxRateId,
    };
  }
  return { kind: 'country_rate', ...normal };
}
