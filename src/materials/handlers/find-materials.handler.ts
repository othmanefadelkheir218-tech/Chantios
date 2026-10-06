import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindMaterialsQueryDto } from '../dto/find-materials-query.dto';
import {
  buildMaterialFilter,
  toMaterialWithStockEntity,
} from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/** `GET /api/materials` — joined with `material_stock_live`. */
@Injectable()
export class FindMaterialsHandler {
  constructor(
    @InjectPinoLogger(FindMaterialsHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async execute({ page, limit, search }: FindMaterialsQueryDto) {
    this.logger.debug(`Listing materials (page ${page}, limit ${limit})`);
    const [data, total] = await this.materials.findWithStockLevels(
      buildMaterialFilter(search),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(
      data.map((m) => toMaterialWithStockEntity(m, m.stock)),
      total,
      page,
      limit,
    );
  }
}
