import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { PlansService } from '../../plans/plans.service';
import { TenantsService } from '../../tenants/tenants.service';
import { FindSubscriptionsQueryDto } from '../dto/find-subscriptions-query.dto';
import { withListNames } from '../helpers/subscription-names.helper';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * `GET /api/admin/subscriptions`. Each row also carries the company and plan
 * names (two lookups for the whole page, through the owning modules' services).
 */
@Injectable()
export class FindSubscriptionsHandler {
  constructor(
    @InjectPinoLogger(FindSubscriptionsHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
    private readonly tenants: TenantsService,
    private readonly plans: PlansService,
  ) {}

  async execute({ page, limit, status }: FindSubscriptionsQueryDto) {
    this.logger.debug(`Listing subscriptions (page ${page}, limit ${limit})`);

    const [data, total] = await this.subscriptions.findMany(
      status ? { status } : {},
      toSkip(page, limit),
      limit,
    );
    const planIds = data.flatMap((row) =>
      row.pendingPlanId ? [row.planId, row.pendingPlanId] : [row.planId],
    );
    const [tenantNames, planNames] = await Promise.all([
      this.tenants.findNamesByIds([
        ...new Set(data.map((row) => row.tenantId)),
      ]),
      this.plans.findNames([...new Set(planIds)]),
    ]);
    return toPaginated(
      withListNames(data, tenantNames, planNames),
      total,
      page,
      limit,
    );
  }
}
