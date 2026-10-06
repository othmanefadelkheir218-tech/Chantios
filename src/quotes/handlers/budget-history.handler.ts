import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ProjectsService } from '../../projects/projects.service';
import { QuoteRepository } from '../repositories/quote.repository';

/**
 * `GET /api/projects/:id/budget-history` — the budget is not a column: it is
 * the sum of the project's accepted quotes, so extra work is a SECOND quote
 * and the budget grows by itself. The accepted quotes with their
 * `accepted_at` ARE the history — no table, no update code. Each line carries
 * the running budget after it.
 */
@Injectable()
export class BudgetHistoryHandler {
  constructor(
    @InjectPinoLogger(BudgetHistoryHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(projectId: number) {
    this.logger.debug(`Reading the budget history of project ${projectId}`);
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const accepted = await this.quotes.findAcceptedByProject(projectId);
    let running = new Prisma.Decimal(0);
    const items = accepted.map((quote) => {
      running = running.plus(quote.amountExclVat);
      return {
        quoteId: quote.id,
        number: quote.number,
        amountExclVat: quote.amountExclVat,
        acceptedAt: quote.acceptedAt,
        budgetAfter: running,
      };
    });
    return { projectId, budgetExclVat: running, items };
  }
}
