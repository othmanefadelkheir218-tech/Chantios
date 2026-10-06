import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindServicesQueryDto } from '../dto/find-services-query.dto';
import { buildServiceFilter, toServiceEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

@Injectable()
export class FindServicesHandler {
  constructor(
    @InjectPinoLogger(FindServicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
  ) {}

  async execute({ page, limit, category_id, search }: FindServicesQueryDto) {
    this.logger.debug(`Listing services (page ${page}, limit ${limit})`);
    const [data, total] = await this.services.findMany(
      buildServiceFilter(category_id, search),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toServiceEntity), total, page, limit);
  }
}
