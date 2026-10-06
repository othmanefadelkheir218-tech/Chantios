import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { computeDocumentTotals } from '../../documents/helpers/document-totals.helper';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { QuotesService } from '../../quotes/quotes.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import {
  addDays,
  assertNonZeroQuantity,
  toInvoiceEntity,
  toVatLine,
} from '../helpers/invoice.helper';
import {
  InvoiceLineCreateInput,
  InvoiceRepository,
} from '../repositories/invoice.repository';

/**
 * `POST /api/invoices` — number taken now, status `draft`. `due_date`
 * defaults to `issue_date + tenants.default_payment_days` when not given
 * (client-invoices.md § "Why due_date cannot be empty").
 */
@Injectable()
export class CreateInvoiceHandler {
  constructor(
    @InjectPinoLogger(CreateInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly invoices: InvoiceRepository,
    private readonly documents: DocumentsService,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly quotes: QuotesService,
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateInvoiceDto, actor: AuthenticatedUser) {
    this.logger.info(
      `Creating invoice for client ${dto.client_id}, project ${dto.project_id}`,
    );

    const client = await this.clients.findByIdRaw(dto.client_id);
    if (!client || !client.isActive) {
      this.logger.warn(
        `Cannot create invoice: client ${dto.client_id} not found or archived`,
      );
      throw new BadRequestException('Client not found or archived');
    }
    await this.projects.findOne(dto.project_id);
    if (dto.quote_id !== undefined) {
      await this.quotes.findOne(dto.quote_id);
    }
    for (const line of dto.lines) {
      assertNonZeroQuantity(line.quantity);
    }

    const tenant = await this.tenants.findOne(actor.tenantId);
    const issueDate = dto.issue_date ? new Date(dto.issue_date) : new Date();
    const dueDate = dto.due_date
      ? new Date(dto.due_date)
      : addDays(issueDate, tenant.defaultPaymentDays);

    const { invoice, lines } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const number = await this.documents.allocateNumber('invoice', tx);

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

        const created = await this.invoices.create(
          {
            tenantId: actor.tenantId,
            clientId: dto.client_id,
            projectId: dto.project_id,
            quoteId: dto.quote_id ?? null,
            status: 'draft',
            issueDate,
            dueDate,
            defaultVatRate: tenant.defaultVatRate,
            note: dto.note ?? null,
            createdBy: actor.userId,
          },
          lineInputs,
          number,
          tx,
        );

        const insertedLines = await this.invoices.findLines(created.id, tx);
        const totals = computeDocumentTotals(insertedLines.map(toVatLine));
        const invoice = await this.invoices.setTotals(created.id, totals, tx);

        return { invoice, lines: insertedLines };
      },
    );

    const entity = toInvoiceEntity(invoice, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'invoice',
      entityId: invoice.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Invoice created: ${invoice.id} (${invoice.number})`);
    return entity;
  }
}
