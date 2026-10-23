import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.config';
import { InvoiceSummary } from '../dto/invoice-summary.dto';
import {
  invoiceTaxRateIds,
  lineTax,
  taxLabel,
  TaxRateInfo,
} from '../helpers/invoice-tax.helper';
import { FindTaxRatesHandler } from './find-tax-rates.handler';

/** One page of Stripe is enough: 100 invoices = more than 8 years of months. */
const MAX_INVOICES = 100;

/**
 * Every invoice of a company in Stripe, for the billing history
 * (doc/notes/subscription-plans.md § The billing history). Best-effort:
 * `null` when Stripe cannot be read — the history still shows the usage.
 * Void invoices are left out: nobody pays them.
 */
@Injectable()
export class ListCustomerInvoicesHandler {
  constructor(
    @InjectPinoLogger(ListCustomerInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly findTaxRates: FindTaxRatesHandler,
  ) {}

  async execute(customerId: string): Promise<InvoiceSummary[] | null> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: MAX_INVOICES,
      });
      const kept = invoices.data.filter((invoice) => invoice.status !== 'void');
      // Step 27: each line's TVA, with its percent (cached: it never changes).
      const rates = await this.findTaxRates.execute(invoiceTaxRateIds(kept));
      return kept.map((invoice) => toSummary(invoice, rates));
    } catch (error) {
      this.logger.warn(
        `Failed to list Stripe invoices of ${customerId}: ${String(error)}`,
      );
      return null;
    }
  }
}

function toSummary(
  invoice: Stripe.Invoice,
  rates: Map<string, TaxRateInfo>,
): InvoiceSummary {
  return {
    id: invoice.id ?? '',
    status: invoice.status ?? 'draft',
    periodStart: invoice.period_start,
    lines: invoice.lines.data.map((line) => {
      const tax = lineTax(line);
      const label = taxLabel(tax.rateIds, rates);
      return {
        amount: line.amount,
        tax: tax.amount,
        taxRate: label.rate,
        reverseCharge: label.reverseCharge,
        kind:
          line.parent?.type === 'subscription_item_details' ? 'plan' : 'extra',
        periodStart: line.period.start,
      };
    }),
  };
}
