/** Input of `CreateCheckoutSessionHandler` (step 21). */
export interface CheckoutSessionInput {
  tenantId: number;
  customerId: string;
  priceId: string;
  /** Step 27 — the resolved TVA TaxRate: the subscription's `default_tax_rates`. */
  taxRateId: string;
  /** Unix seconds. Set during a trial: the first charge waits until then. */
  trialEnd?: number;
  locale: 'fr' | 'en' | 'nl';
  successUrl: string;
  cancelUrl: string;
}
