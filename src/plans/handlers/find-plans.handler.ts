import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindPlansQueryDto } from '../dto/find-plans-query.dto';
import { buildPlanFilter } from '../helpers/plan.helper';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class FindPlansHandler {
  constructor(
    @InjectPinoLogger(FindPlansHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  async execute({ page, limit, search, is_active }: FindPlansQueryDto) {
    this.logger.debug(`Listing plans (page ${page}, limit ${limit})`);

    const [data, total] = await this.plans.findMany(
      buildPlanFilter(search, is_active),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
