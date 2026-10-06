import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindMovementsQueryDto } from '../dto/find-movements-query.dto';
import { buildMovementFilter, toMovementEntity } from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';

/** `GET /api/stock/movements` — `?material_id=&project_id=&type=&from=&to=`. */
@Injectable()
export class FindMovementsHandler {
  constructor(
    @InjectPinoLogger(FindMovementsHandler.name)
    private readonly logger: PinoLogger,
    private readonly movements: StockMovementRepository,
  ) {}

  async execute({
    page,
    limit,
    material_id,
    project_id,
    type,
    from,
    to,
  }: FindMovementsQueryDto) {
    this.logger.debug(`Listing stock movements (page ${page}, limit ${limit})`);
    const [data, total] = await this.movements.findMany(
      buildMovementFilter(material_id, project_id, type, from, to),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toMovementEntity), total, page, limit);
  }
}
