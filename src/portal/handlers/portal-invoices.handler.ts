import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InvoicesService } from '../../invoices/invoices.service';
import { MediaService } from '../../media/media.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { VISIBLE_INVOICE_STATUSES } from '../helpers/portal.helper';
import { toPortalInvoice } from '../helpers/portal-view.helper';

/**
 * `GET /api/portal/:token/invoices` — `sent`, `partially_paid` and `paid`
 * only: never `draft`, never `cancelled`. A late invoice carries the `late`
 * label (calculated from the `invoice_balance` view, never a stored status).
 * Purchase invoices — money OUT — are a different table and never appear.
 */
@Injectable()
export class PortalInvoicesHandler {
  constructor(
    @InjectPinoLogger(PortalInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoicesService,
    private readonly media: MediaService,
  ) {}

  async execute(portal: PortalContextData) {
    this.logger.debug(`Portal invoices of project ${portal.projectId}`);
    const rows = await this.invoices.findByProjectWithBalance(
      portal.projectId,
      VISIBLE_INVOICE_STATUSES,
    );
    const documents = await this.media.findByEntityIds(
      'invoice',
      rows.map((row) => row.invoice.id),
    );
    return {
      data: rows.map((row) =>
        toPortalInvoice(
          row.invoice,
          row.balance,
          documents.get(row.invoice.id),
        ),
      ),
    };
  }
}
