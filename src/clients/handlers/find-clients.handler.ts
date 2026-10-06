import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindClientsQueryDto } from '../dto/find-clients-query.dto';
import { buildClientFilter, toClientEntity } from '../helpers/clients.helper';
import { ClientRepository } from '../repositories/client.repository';

@Injectable()
export class FindClientsHandler {
  constructor(
    @InjectPinoLogger(FindClientsHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
  ) {}

  async execute({ page, limit, search, is_active }: FindClientsQueryDto) {
    this.logger.debug(`Listing clients (page ${page}, limit ${limit})`);

    const [data, total] = await this.clients.findMany(
      buildClientFilter(search, is_active),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toClientEntity), total, page, limit);
  }
}
