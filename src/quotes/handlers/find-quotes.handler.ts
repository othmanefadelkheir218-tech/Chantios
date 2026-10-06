import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindQuotesQueryDto } from '../dto/find-quotes-query.dto';
import { buildQuoteFilter, toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

@Injectable()
export class FindQuotesHandler {
  constructor(
    @InjectPinoLogger(FindQuotesHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
  ) {}

  async execute({
    page,
    limit,
    project_id,
    client_id,
    status,
  }: FindQuotesQueryDto) {
    this.logger.debug(`Listing quotes (page ${page}, limit ${limit})`);
    const [data, total] = await this.quotes.findMany(
      buildQuoteFilter(project_id, client_id, status),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(
      data.map((q) => toQuoteEntity(q)),
      total,
      page,
      limit,
    );
  }
}
