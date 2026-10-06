import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { RecipeLine } from '../../stock/helpers/recipe.helper';
import { StockService } from '../../stock/stock.service';
import { isPastValidUntil, toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

/**
 * `POST /api/quotes/:id/accept` — the acceptance chain, **one transaction**
 * across 3 modules (doc/notes/Phaces/06-quotes-invoices.md):
 *
 *   quotes.status = 'accepted', accepted_at = now
 *   projects.status -> 'in_progress'   (through ProjectsService, step 04's matrix)
 *   project_status_history row          (written by the same call)
 *   stock_reservations upserted from the recipe   (through StockService, step 05)
 *
 * If any part fails, nothing is written — the quote stays `sent`. Refuses
 * (400) a quote with zero lines, an expired `valid_until`, or a project
 * that is not `prospect`/`in_progress` (checked by `ProjectsService`, which
 * owns that rule). Both the staff route (here) and the step 12
 * client-portal route call this same handler, so `accepted_at` is always
 * real.
 */
@Injectable()
export class AcceptQuoteHandler {
  constructor(
    @InjectPinoLogger(AcceptQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly quotes: QuoteRepository,
    private readonly projects: ProjectsService,
    private readonly stock: StockService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Accepting quote ${id}`);

    const quote = await this.quotes.findById(id);
    if (!quote) {
      this.logger.warn(`Cannot accept quote: ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    if (quote.status !== 'sent') {
      throw new BadRequestException(
        `Cannot accept a quote from status ${quote.status}`,
      );
    }
    if (isPastValidUntil(quote.validUntil)) {
      this.logger.warn(`Cannot accept quote ${id}: valid_until has passed`);
      throw new BadRequestException('This quote has expired');
    }
    const lines = await this.quotes.findLines(id);
    if (lines.length === 0) {
      this.logger.warn(`Cannot accept quote ${id}: no lines`);
      throw new BadRequestException('Cannot accept a quote with no lines');
    }

    const accepted = await this.tenantPrisma.db.$transaction(async (tx) => {
      const accepted = await this.quotes.setStatus(
        id,
        'accepted',
        { acceptedAt: new Date() },
        tx,
      );

      // Throws (400/404) and rolls back everything above if the project is
      // not prospect/in_progress — ProjectsService owns that rule.
      await this.projects.beginFromQuoteAcceptance(quote.projectId, actor, tx);

      const recipeLines: RecipeLine[] = lines.map((line) => ({
        serviceId: line.serviceId,
        quantity: line.quantity,
      }));
      await this.stock.reserveForProject(
        quote.projectId,
        recipeLines,
        actor,
        tx,
      );

      return accepted;
    });

    const entity = toQuoteEntity(accepted, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'accept',
      entityType: 'quote',
      entityId: id,
      oldValue: { status: quote.status },
      newValue: { status: 'accepted', projectId: quote.projectId },
      ipAddress: null,
    });
    this.logger.info(
      `Quote accepted: ${id} — project ${quote.projectId} in_progress, reservations created`,
    );
    return entity;
  }
}
