import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { RecordPaymentDto } from '../dto/record-payment.dto';
import {
  assertPositiveAmount,
  toInvoiceEntity,
} from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';

/**
 * `POST /api/invoices/:id/payments` — writes the append-only ledger row,
 * then reads `invoice_balance` and sets status purely from `balance_due`:
 * `0` -> `paid`, `0 < balance < amount_incl_vat` -> `partially_paid`. Never
 * writes `overdue` (client-invoices.md § "Late is calculated, never
 * stored"). Both writes run in one transaction so a concurrent second
 * payment never reads a stale balance.
 *
 * Refuses (400) a payment against a `draft` (not official yet) or
 * `cancelled` (dropped) invoice — a judgment call, the step file does not
 * say explicitly, but an append-only ledger against a document that was
 * never sent or was voided would make no accounting sense.
 */
@Injectable()
export class RecordPaymentHandler {
  constructor(
    @InjectPinoLogger(RecordPaymentHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    invoiceId: number,
    dto: RecordPaymentDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Recording payment of ${dto.amount} on invoice ${invoiceId}`,
    );

    assertPositiveAmount(dto.amount);

    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice) {
      this.logger.warn(`Cannot record payment: invoice ${invoiceId} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot record a payment on a ${invoice.status} invoice`,
      );
    }

    const { payment, updatedInvoice, balance } =
      await this.tenantPrisma.db.$transaction(async (tx) => {
        const payment = await this.payments.create(
          {
            tenantId: actor.tenantId,
            invoiceId,
            amount: dto.amount,
            method: dto.method,
            reference: dto.reference ?? null,
            ...(dto.payment_date && {
              paymentDate: new Date(dto.payment_date),
            }),
            createdBy: actor.userId,
          },
          tx,
        );

        const balance = await this.invoices.findWithBalance(invoiceId, tx);
        if (!balance) {
          throw new NotFoundException('Invoice not found');
        }

        let status = invoice.status;
        if (balance.balanceDue.lte(0)) {
          status = 'paid';
        } else if (balance.balanceDue.lt(balance.amountInclVat)) {
          status = 'partially_paid';
        }
        const updatedInvoice = await this.invoices.setStatus(
          invoiceId,
          status,
          {},
          tx,
        );

        return { payment, updatedInvoice, balance };
      });

    const lines = await this.invoices.findLines(invoiceId);
    const entity = {
      ...toInvoiceEntity(updatedInvoice, lines),
      balance: {
        amountPaid: balance.amountPaid,
        balanceDue: balance.balanceDue,
        isLate: balance.isLate,
      },
    };

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'record_payment',
      entityType: 'invoice',
      entityId: invoiceId,
      newValue: {
        paymentId: payment.id,
        amount: dto.amount,
        status: updatedInvoice.status,
      },
      ipAddress: null,
    });
    this.logger.info(
      `Payment ${payment.id} recorded on invoice ${invoiceId}: status now ${updatedInvoice.status}`,
    );
    return entity;
  }
}
