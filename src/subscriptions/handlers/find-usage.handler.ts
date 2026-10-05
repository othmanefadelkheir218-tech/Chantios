import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class FindUsageHandler {
  constructor(
    @InjectPinoLogger(FindUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number, { page, limit }: PaginationQueryDto) {
    this.logger.debug(`Listing usage snapshots of tenant ${tenantId}`);

    const [data, total] = await this.subscriptions.findUsage(
      tenantId,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
