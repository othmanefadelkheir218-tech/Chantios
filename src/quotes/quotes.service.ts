import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { FindQuotesQueryDto } from './dto/find-quotes-query.dto';
import { SetQuoteLinesDto } from './dto/set-quote-lines.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { AcceptQuoteHandler } from './handlers/accept-quote.handler';
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

  accept(id: number, actor: AuthenticatedUser) {
    return this.acceptQuote.execute(id, actor);
  }

  refuse(id: number, actor: AuthenticatedUser) {
    return this.refuseQuote.execute(id, actor);
  }

  // ---- Internal API for `invoices` (coverage) and step 10 (budget) ----

  /** Sum of `amount_excl_vat` across accepted quotes for a project. */
  sumAcceptedByProject(projectId: number) {
    return this.quotes.sumAcceptedByProject(projectId);
  }
}
