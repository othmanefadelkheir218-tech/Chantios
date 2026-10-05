import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiUuidParam,
} from '../../common/swagger/api-paginated.decorator';
import { TenantEntity } from '../entities/tenant.entity';

const idParam = () => ApiUuidParam('id', 'Tenant id (UUID)');

export const ApiCreateTenant = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a tenant (super_admin)',
      description:
        'Creates a company. The email must be unique. One entry is written to audit_logs.',
    }),
    ApiCreatedResponse({ description: 'Tenant created', type: TenantEntity }),
    ApiBadRequestResponse({ description: 'Invalid data (validation error)' }),
    ApiConflictResponse({ description: 'Email already used' }),
  );

export const ApiFindTenants = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List tenants (admin staff)',
      description:
        'Paginated, newest first. Filter with `search` and `status`.',
    }),
    ApiPaginatedResponse(TenantEntity, 'Paginated list of tenants'),
  );

export const ApiFindTenant = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one tenant (admin staff)' }),
    idParam(),
    ApiOkResponse({ description: 'The tenant', type: TenantEntity }),
    ApiBadRequestResponse({ description: 'The id is not a valid UUID' }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );

export const ApiUpdateTenant = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a tenant (super_admin)',
      description:
        'Updates only the fields you send. The old and new values go to audit_logs.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Tenant updated', type: TenantEntity }),
    ApiBadRequestResponse({ description: 'Invalid data or invalid UUID' }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
    ApiConflictResponse({ description: 'Email already used' }),
  );

export const ApiSetTenantStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Suspend, ban or reactivate a tenant (super_admin)',
      description:
        'Sets `active`, `suspended` or `banned`. audit_logs records the old and the new status and the reason.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Status changed', type: TenantEntity }),
    ApiBadRequestResponse({
      description: 'Invalid status, invalid UUID, or the status is unchanged',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );
