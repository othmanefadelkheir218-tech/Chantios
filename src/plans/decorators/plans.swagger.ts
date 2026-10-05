import { applyDecorators } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { PlanEntity } from '../entities/plan.entity';

const idParam = () => ApiIntParam('id', 'Plan id');

export const ApiCreatePlan = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a plan (super_admin)',
      description:
        'Writes the plan and all its features in one transaction. It is never the default unless `is_default` is true. `stripe_price_id` is created automatically (a Stripe Product + a recurring monthly Price in EUR) — it is not a field you send.',
    }),
    ApiCreatedResponse({ description: 'Plan created', type: PlanEntity }),
    ApiBadRequestResponse({
      description:
        'Invalid data, a feature_key is repeated, or features is missing one of the 6 required keys',
    }),
    ApiBadGatewayResponse({
      description: 'Failed to create the Stripe price for this plan',
    }),
  );

export const ApiFindPlans = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List plans (admin staff)',
      description:
        'Paginated, newest first, features included. Filter with `search` and `is_active`.',
    }),
    ApiPaginatedResponse(PlanEntity, 'Paginated list of plans'),
  );

export const ApiFindPlan = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one plan with its features (admin staff)' }),
    idParam(),
    ApiOkResponse({ description: 'The plan', type: PlanEntity }),
    ApiBadRequestResponse({ description: 'The id is not a valid number' }),
    ApiNotFoundResponse({ description: 'Plan not found' }),
  );

export const ApiDeactivatePlan = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Deactivate a plan (super_admin)',
      description:
        'Closes the plan to new signups. Refused when it is the default plan. Existing tenants keep it. Also archives its Stripe Price (best-effort — a Stripe failure here is logged, never blocks this).',
    }),
    idParam(),
    ApiOkResponse({ description: 'Plan deactivated', type: PlanEntity }),
    ApiBadRequestResponse({ description: 'It is the default plan' }),
    ApiNotFoundResponse({ description: 'Plan not found' }),
  );

export const ApiSetDefaultPlan = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Make a plan the default (super_admin)',
      description:
        'The old default is cleared in the same transaction. An inactive plan cannot be the default.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Plan is now the default', type: PlanEntity }),
    ApiBadRequestResponse({ description: 'The plan is inactive' }),
    ApiNotFoundResponse({ description: 'Plan not found' }),
  );

export const ApiCreatePlanVersion = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new version of a plan (super_admin)',
      description:
        "The old row is deactivated, the new row points to it with `parent_plan_id`. What you leave out is copied — omitting `features` copies the parent's. Sending `features` replaces the whole list and must still contain exactly the 6 required keys. Tenants on the old row keep it. A default plan passes its flag to the new version. The new version gets its own `stripe_price_id` (created automatically); the parent's old Stripe Price is archived.",
    }),
    idParam(),
    ApiCreatedResponse({ description: 'New version', type: PlanEntity }),
    ApiBadRequestResponse({
      description:
        'Invalid data, plan already replaced, or a sent features list is missing one of the 6 required keys',
    }),
    ApiNotFoundResponse({ description: 'Plan not found' }),
    ApiBadGatewayResponse({
      description: 'Failed to create the Stripe price for this version',
    }),
  );
