import { Injectable } from '@nestjs/common';
import { QuoteStatus } from '@prisma/client';
import {
  ActingParty,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { FindQuotesQueryDto } from './dto/find-quotes-query.dto';
import { SetQuoteLinesDto } from './dto/set-quote-lines.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { AcceptQuoteHandler } from './handlers/accept-quote.handler';
import { BudgetHistoryHandler } from './handlers/budget-history.handler';
import { CreateQuoteHandler } from './handlers/create-quote.handler';
import { FindQuoteHandler } from './handlers/find-quote.handler';
import { FindQuotesHandler } from './handlers/find-quotes.handler';
import { RefuseQuoteHandler } from './handlers/refuse-quote.handler';
import { SendQuoteHandler } from './handlers/send-quote.handler';
import { SetQuoteLinesHandler } from './handlers/set-quote-lines.handler';
import { UpdateQuoteHandler } from './handlers/update-quote.handler';
import { QuoteRepository } from './repositories/quote.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class QuotesService {
  constructor(
    private readonly createQuote: CreateQuoteHandler,
    private readonly findQuotes: FindQuotesHandler,
    private readonly findQuote: FindQuoteHandler,
    private readonly updateQuote: UpdateQuoteHandler,
    private readonly setLines: SetQuoteLinesHandler,
    private readonly sendQuote: SendQuoteHandler,
    private readonly acceptQuote: AcceptQuoteHandler,
    private readonly refuseQuote: RefuseQuoteHandler,
    private readonly quotes: QuoteRepository,
    private readonly budgetHistoryHandler: BudgetHistoryHandler,
  ) {}

  create(dto: CreateQuoteDto, actor: AuthenticatedUser) {
    return this.createQuote.execute(dto, actor);
  }

  findAll(query: FindQuotesQueryDto) {
    return this.findQuotes.execute(query);
  }

  findOne(id: number) {
    return this.findQuote.execute(id);
  }

  update(id: number, dto: UpdateQuoteDto, actor: AuthenticatedUser) {
    return this.updateQuote.execute(id, dto, actor);
  }

  replaceLines(id: number, dto: SetQuoteLinesDto, actor: AuthenticatedUser) {
    return this.setLines.execute(id, dto, actor);
  }

  send(id: number, actor: AuthenticatedUser) {
    return this.sendQuote.execute(id, actor);
  }

  accept(id: number, actor: ActingParty) {
    return this.acceptQuote.execute(id, actor);
  }

  refuse(id: number, actor: ActingParty) {
    return this.refuseQuote.execute(id, actor);
  }

  // ---- Internal API for `invoices` (coverage) and step 10 (budget) ----

  // ---- Internal API for step 12 (client portal) ----

  /** A project's quotes in the given statuses, with their lines (the portal picks the statuses). */
  findByProjectAndStatuses(projectId: number, statuses: QuoteStatus[]) {
    return this.quotes.findByProjectAndStatuses(projectId, statuses);
  }

  /** The raw quote row, scoped to the current tenant, or `null`. */
  findByIdRaw(id: number) {
    return this.quotes.findById(id);
  }

  /** `GET /api/projects/:id/budget-history` — the accepted quotes by `accepted_at`, with the running budget. */
  budgetHistory(projectId: number) {
    return this.budgetHistoryHandler.execute(projectId);
  }

  /** Sum of `amount_excl_vat` across accepted quotes for a project. */
  sumAcceptedByProject(projectId: number) {
    return this.quotes.sumAcceptedByProject(projectId);
  }
}
