import { applyDecorators } from '@nestjs/common';
import {
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
        'Writes the plan and all its features in one transaction. It is never the default unless `is_default` is true.',
    }),
    ApiCreatedResponse({ description: 'Plan created', type: PlanEntity }),
    ApiBadRequestResponse({
      description: 'Invalid data, or a feature_key is repeated',
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
        'Closes the plan to new signups. Refused when it is the default plan. Existing tenants keep it.',
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
        'The old row is deactivated, the new row points to it with `parent_plan_id`. What you leave out is copied. Tenants on the old row keep it. A default plan passes its flag to the new version.',
    }),
    idParam(),
    ApiCreatedResponse({ description: 'New version', type: PlanEntity }),
    ApiBadRequestResponse({
      description: 'Invalid data, or plan already replaced',
    }),
    ApiNotFoundResponse({ description: 'Plan not found' }),
  );
