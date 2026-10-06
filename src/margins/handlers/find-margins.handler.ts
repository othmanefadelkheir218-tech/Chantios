import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindMarginsQueryDto } from '../dto/find-margins-query.dto';
import { toMarginEntity } from '../helpers/margin.helper';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * `GET /api/margins` — the dashboard list, one row per project, read live from
 * `project_margin_live`. `margin_pct` is `NULL` (never an error) for a project
 * with no accepted quote.
 */
@Injectable()
export class FindMarginsHandler {
  constructor(
    @InjectPinoLogger(FindMarginsHandler.name)
    private readonly logger: PinoLogger,
    private readonly margins: MarginRepository,
  ) {}

  async execute({ page, limit, status }: FindMarginsQueryDto) {
    this.logger.debug(`Listing margins (page ${page}, limit ${limit})`);
    const [rows, total] = await this.margins.findAll(
      status,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(rows.map(toMarginEntity), total, page, limit);
  }
}
