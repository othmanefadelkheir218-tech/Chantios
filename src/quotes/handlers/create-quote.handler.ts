import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { computeDocumentTotals } from '../../documents/helpers/document-totals.helper';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import {
  assertNonZeroQuantity,
  toQuoteEntity,
  toVatLine,
} from '../helpers/quote.helper';
import {
  QuoteLineCreateInput,
  QuoteRepository,
} from '../repositories/quote.repository';

/**
 * `POST /api/quotes` — number taken now (inside this transaction), status
 * `draft`, `default_vat_rate` copied from the tenant. Totals computed per
 * rate group from the DB-trigger-computed `total_excl_vat` of the lines
 * just inserted (doc/notes/Phaces/06-quotes-invoices.md).
 */
@Injectable()
export class CreateQuoteHandler {
  constructor(
    @InjectPinoLogger(CreateQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly quotes: QuoteRepository,
    private readonly documents: DocumentsService,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateQuoteDto, actor: AuthenticatedUser) {
    this.logger.info(
      `Creating quote for client ${dto.client_id}, project ${dto.project_id}`,
    );

    const client = await this.clients.findByIdRaw(dto.client_id);
    if (!client || !client.isActive) {
      this.logger.warn(
        `Cannot create quote: client ${dto.client_id} not found or archived`,
      );
      throw new BadRequestException('Client not found or archived');
    }
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(dto.project_id);

    for (const line of dto.lines) {
      assertNonZeroQuantity(line.quantity);
    }

    const tenant = await this.tenants.findOne(actor.tenantId);

    const { quote, lines } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const number = await this.documents.allocateNumber('quote', tx);

        const lineInputs: QuoteLineCreateInput[] = dto.lines.map((line) => ({
          tenantId: actor.tenantId,
          serviceId: line.service_id ?? null,
          description: line.description,
          unit: line.unit ?? null,
          quantity: line.quantity,
          unitPriceExclVat: line.unit_price_excl_vat,
          vatRate: line.vat_rate,
          position: line.position,
        }));

        const created = await this.quotes.create(
          {
            tenantId: actor.tenantId,
            clientId: dto.client_id,
            projectId: dto.project_id,
            status: 'draft',
            ...(dto.issue_date && { issueDate: new Date(dto.issue_date) }),
            ...(dto.valid_until && { validUntil: new Date(dto.valid_until) }),
            defaultVatRate: tenant.defaultVatRate,
            note: dto.note ?? null,
            createdBy: actor.userId,
          },
          lineInputs,
          number,
          tx,
        );

        const insertedLines = await this.quotes.findLines(created.id, tx);
        const totals = computeDocumentTotals(insertedLines.map(toVatLine));
        const quote = await this.quotes.setTotals(created.id, totals, tx);

        return { quote, lines: insertedLines };
      },
    );

    const entity = toQuoteEntity(quote, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'quote',
      entityId: quote.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Quote created: ${quote.id} (${quote.number})`);
    return entity;
  }
}
