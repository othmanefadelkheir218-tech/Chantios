import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/** `GET /api/support/tickets` — tenant-scoped: own tenant only, structurally (the extension). */
@Injectable()
export class FindTicketsHandler {
  constructor(
    @InjectPinoLogger(FindTicketsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
  ) {}

  async execute({ page, limit }: PaginationQueryDto) {
    this.logger.debug(`Listing support tickets (page ${page}, limit ${limit})`);
    const [data, total] = await this.tickets.findMany(
      {},
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
