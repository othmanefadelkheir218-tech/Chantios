import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * `GET /api/admin/billing/snapshots` (step 14) — usage snapshots across
 * EVERY tenant, unlike `FindUsageHandler` which is scoped to one. Added here
 * (not in `billing/`) because `subscriptions` already owns `billing_usage_snapshots`
 * and `billing` must go through this service, never its repository.
 */
@Injectable()
export class FindAllUsageHandler {
  constructor(
    @InjectPinoLogger(FindAllUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute({ page, limit }: PaginationQueryDto) {
    this.logger.debug(`Listing usage snapshots of every tenant (page ${page})`);
    const [data, total] = await this.subscriptions.findAllUsage(
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
