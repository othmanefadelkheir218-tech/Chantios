import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.config';
import { InvoiceSummary } from '../dto/invoice-summary.dto';

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
  ) {}

  async execute(customerId: string): Promise<InvoiceSummary[] | null> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: MAX_INVOICES,
      });
      return invoices.data
        .filter((invoice) => invoice.status !== 'void')
        .map(toSummary);
    } catch (error) {
      this.logger.warn(
        `Failed to list Stripe invoices of ${customerId}: ${String(error)}`,
      );
      return null;
    }
  }
}

function toSummary(invoice: Stripe.Invoice): InvoiceSummary {
  return {
    id: invoice.id ?? '',
    status: invoice.status ?? 'draft',
    periodStart: invoice.period_start,
    lines: invoice.lines.data.map((line) => ({
      amount: line.amount,
      kind:
        line.parent?.type === 'subscription_item_details' ? 'plan' : 'extra',
      periodStart: line.period.start,
    })),
  };
}
