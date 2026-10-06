import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { computeDocumentTotals } from '../../documents/helpers/document-totals.helper';
import { SetInvoiceLinesDto } from '../dto/set-invoice-lines.dto';
import {
  assertNonZeroQuantity,
  toInvoiceEntity,
  toVatLine,
} from '../helpers/invoice.helper';
import {
  InvoiceLineCreateInput,
  InvoiceRepository,
} from '../repositories/invoice.repository';

/**
 * `PUT /api/invoices/:id/lines` — `draft` only. Replaces every line and
 * recomputes the 3 totals in the same transaction.
 */
@Injectable()
export class SetInvoiceLinesHandler {
  constructor(
    @InjectPinoLogger(SetInvoiceLinesHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly invoices: InvoiceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    invoiceId: number,
    dto: SetInvoiceLinesDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Replacing lines for invoice ${invoiceId} (${dto.lines.length} line(s))`,
    );

    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice) {
      this.logger.warn(`Cannot set lines: invoice ${invoiceId} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status !== 'draft') {
      this.logger.warn(
        `Cannot set lines for invoice ${invoiceId}: status is ${invoice.status}, not draft`,
      );
      throw new BadRequestException(
        'Lines are frozen once the invoice has been sent',
      );
    }
    for (const line of dto.lines) {
      assertNonZeroQuantity(line.quantity);
    }

    const { updated, lines } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const lineInputs: InvoiceLineCreateInput[] = dto.lines.map((line) => ({
          tenantId: actor.tenantId,
          serviceId: line.service_id ?? null,
          description: line.description,
          unit: line.unit ?? null,
          quantity: line.quantity,
          unitPriceExclVat: line.unit_price_excl_vat,
          vatRate: line.vat_rate,
          position: line.position,
        }));

        await this.invoices.replaceLines(invoiceId, lineInputs, tx);
        const insertedLines = await this.invoices.findLines(invoiceId, tx);
        const totals = computeDocumentTotals(insertedLines.map(toVatLine));
        const updated = await this.invoices.setTotals(invoiceId, totals, tx);

        return { updated, lines: insertedLines };
      },
    );

    const entity = toInvoiceEntity(updated, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_lines',
      entityType: 'invoice',
      entityId: invoiceId,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Lines replaced for invoice ${invoiceId}: ${lines.length} row(s)`,
    );
    return entity;
  }
}
