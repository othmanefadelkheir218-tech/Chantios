import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindReservationsQueryDto } from '../dto/find-reservations-query.dto';
import {
  buildReservationFilter,
  toReservationEntity,
} from '../helpers/stock.helper';
import { StockReservationRepository } from '../repositories/stock-reservation.repository';

/** `GET /api/stock/reservations` — `?project_id=&material_id=`. */
@Injectable()
export class FindReservationsHandler {
  constructor(
    @InjectPinoLogger(FindReservationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reservations: StockReservationRepository,
  ) {}

  async execute({
    page,
    limit,
    project_id,
    material_id,
  }: FindReservationsQueryDto) {
    this.logger.debug(
      `Listing stock reservations (page ${page}, limit ${limit})`,
    );
    const [data, total] = await this.reservations.findMany(
      buildReservationFilter(project_id, material_id),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toReservationEntity), total, page, limit);
  }
}
