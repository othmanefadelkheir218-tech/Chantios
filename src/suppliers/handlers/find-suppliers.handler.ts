import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindSuppliersQueryDto } from '../dto/find-suppliers-query.dto';
import {
  buildSupplierFilter,
  toSupplierEntity,
} from '../helpers/supplier.helper';
import { SupplierRepository } from '../repositories/supplier.repository';

/** `GET /api/suppliers` — paginated, `?search=&is_active=`. */
@Injectable()
export class FindSuppliersHandler {
  constructor(
    @InjectPinoLogger(FindSuppliersHandler.name)
    private readonly logger: PinoLogger,
    private readonly suppliers: SupplierRepository,
  ) {}

  async execute({ page, limit, search, is_active }: FindSuppliersQueryDto) {
    this.logger.debug(`Listing suppliers (page ${page}, limit ${limit})`);

    const [data, total] = await this.suppliers.findMany(
      buildSupplierFilter(search, is_active),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toSupplierEntity), total, page, limit);
  }
}
