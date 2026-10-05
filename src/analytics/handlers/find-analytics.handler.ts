import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindAnalyticsQueryDto } from '../dto/find-analytics-query.dto';
import { AnalyticsRepository } from '../repositories/analytics.repository';

@Injectable()
export class FindAnalyticsHandler {
  constructor(
    @InjectPinoLogger(FindAnalyticsHandler.name)
    private readonly logger: PinoLogger,
    private readonly analytics: AnalyticsRepository,
  ) {}

  async execute(query: FindAnalyticsQueryDto) {
    const { page, limit, tenant_id, event_name, from, to } = query;
    this.logger.debug(
      `Listing analytics events (page ${page}, limit ${limit})`,
    );

    const where: Prisma.AnalyticsEventWhereInput = {
      ...(tenant_id && { tenantId: tenant_id }),
      ...(event_name && { eventName: event_name }),
      ...((from || to) && { createdAt: { gte: from, lte: to } }),
    };
    const [data, total] = await this.analytics.findMany(
      where,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
