import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindSubscriptionsQueryDto } from '../dto/find-subscriptions-query.dto';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class FindSubscriptionsHandler {
  constructor(
    @InjectPinoLogger(FindSubscriptionsHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute({ page, limit, status }: FindSubscriptionsQueryDto) {
    this.logger.debug(`Listing subscriptions (page ${page}, limit ${limit})`);

    const [data, total] = await this.subscriptions.findMany(
      status ? { status } : {},
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
