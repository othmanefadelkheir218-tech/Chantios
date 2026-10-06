import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { QuotesService } from '../../quotes/quotes.service';
import { InvoiceRepository } from '../repositories/invoice.repository';

/**
 * `GET /api/projects/:id/invoice-coverage` — the soft warning
 * (client-invoices.md § "Soft rule"): total invoiced (excl. VAT,
 * `cancelled` invoices excluded) vs the sum of accepted quotes for the
 * project. **Never blocks, never throws for a mismatch** — create stays
 * allowed either way, this is read-only information for staff.
 */
@Injectable()
export class InvoiceCoverageHandler {
  constructor(
    @InjectPinoLogger(InvoiceCoverageHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly quotes: QuotesService,
  ) {}

  async execute(projectId: number) {
    const [invoicedExclVat, quotedExclVat] = await Promise.all([
      this.invoices.sumByProject(projectId),
      this.quotes.sumAcceptedByProject(projectId),
    ]);

    const matches = invoicedExclVat.equals(quotedExclVat);
    this.logger.debug(
      `Coverage for project ${projectId}: invoiced=${invoicedExclVat.toString()}, quoted=${quotedExclVat.toString()}`,
    );

    return {
      projectId,
      invoicedExclVat: invoicedExclVat.toFixed(2),
      quotedExclVat: quotedExclVat.toFixed(2),
      warning: !matches,
      message: matches
        ? null
        : 'Total invoiced does not match the accepted quotes for this project',
    };
  }
}
