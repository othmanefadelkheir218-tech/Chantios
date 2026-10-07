export const BILLING_RENEWAL_QUEUE = 'billing-renewal';

/** One BullMQ job: run the renewal for exactly one tenant. */
export interface RenewalJobData {
  tenantId: number;
}
