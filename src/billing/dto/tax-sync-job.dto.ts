/** Step 27 — re-syncs one company's TVA on Stripe in the background. */
export const BILLING_TAX_SYNC_QUEUE = 'billing-tax-sync';

export interface TaxSyncJobData {
  tenantId: number;
}
