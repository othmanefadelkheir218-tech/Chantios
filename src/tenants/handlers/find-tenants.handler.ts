import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindTenantsQueryDto } from '../dto/find-tenants-query.dto';
import { buildTenantFilter, toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class FindTenantsHandler {
  constructor(
    @InjectPinoLogger(FindTenantsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
  ) {}

  async execute({ page, limit, search, status }: FindTenantsQueryDto) {
    this.logger.debug(`Listing tenants (page ${page}, limit ${limit})`);

    const [data, total] = await this.tenants.findMany(
      buildTenantFilter(search, status),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toTenantEntity), total, page, limit);
  }
}
