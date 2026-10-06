import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

/** `GET /api/quotes/:id` — with lines (the per-rate breakdown is computed from them client-side/PDF). */
@Injectable()
export class FindQuoteHandler {
  constructor(
    @InjectPinoLogger(FindQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
  ) {}

  async execute(id: number) {
    const quote = await this.quotes.findById(id);
    if (!quote) {
      this.logger.warn(`Quote ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    const lines = await this.quotes.findLines(id);
    return toQuoteEntity(quote, lines);
  }
}
