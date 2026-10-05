import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiUuidParam,
} from '../../common/swagger/api-paginated.decorator';
import {
  SubscriptionEntity,
  UsageSnapshotEntity,
} from '../entities/subscription.entity';

const tenantParam = () => ApiUuidParam('tenantId', 'Tenant id (UUID)');

export const ApiFindSubscriptions = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List subscriptions (admin staff)',
      description:
        'One row per tenant — there is no separate `subscriptions` table. Filter with `status`.',
    }),
    ApiPaginatedResponse(SubscriptionEntity, 'Paginated list of subscriptions'),
  );

export const ApiFindSubscription = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get the subscription of a tenant (admin staff)' }),
    tenantParam(),
    ApiOkResponse({
      description: 'The subscription',
      type: SubscriptionEntity,
    }),
    ApiBadRequestResponse({ description: 'The id is not a valid UUID' }),
    ApiNotFoundResponse({ description: 'No subscription for this tenant' }),
  );

export const ApiChangePlan = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Move a tenant to another plan at its next renewal (super_admin)',
      description:
        'Writes `pending_plan_id` and `pending_plan_effective_at` (= the end of the current period). `plan_id` does not change now.',
    }),
    tenantParam(),
    ApiOkResponse({ description: 'Change planned', type: SubscriptionEntity }),
    ApiBadRequestResponse({
      description: 'Plan inactive, same as the current plan, or invalid data',
    }),
    ApiNotFoundResponse({ description: 'Subscription or plan not found' }),
  );

export const ApiFindUsage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Usage snapshots of a tenant (admin staff)',
      description:
        'One row per dimension per billing cycle, newest cycle first. Limits and rates are the copy taken at snapshot time.',
    }),
    tenantParam(),
    ApiPaginatedResponse(UsageSnapshotEntity, 'Paginated usage snapshots'),
  );
