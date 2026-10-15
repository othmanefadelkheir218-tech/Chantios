export const BILLING_RENEWAL_QUEUE = 'billing-renewal';

/** One BullMQ job: run the renewal for exactly one tenant. */
export interface RenewalJobData {
  tenantId: number;
}

/** A card company's renewal, from Stripe's `invoice.created` (step 21). */
export interface StripeRenewalInput {
  /** The draft invoice that takes the overage; `null` = already final. */
  invoiceId: string | null;
  /** The month that just ended — the one the usage belongs to. */
  periodStart: Date;
  periodEnd: Date;
}
