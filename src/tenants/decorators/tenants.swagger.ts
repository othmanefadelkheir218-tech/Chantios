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
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { TenantEntity } from '../entities/tenant.entity';

const idParam = () => ApiIntParam('id', 'Tenant id');

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
    ApiBadRequestResponse({ description: 'The id is not a valid number' }),
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
    ApiBadRequestResponse({ description: 'Invalid data or invalid id' }),
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
      description:
        'Invalid status, the id is not a valid number, or the status is unchanged',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );

export const ApiSoftDeleteTenant = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Soft delete a tenant (super_admin)',
      description:
        'Sets `deleted_at`. The tenant disappears from list/find until restored. Independent of `status`. audit_logs records the old and new `deleted_at`.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Tenant deleted', type: TenantEntity }),
    ApiBadRequestResponse({
      description:
        'The id is not a valid number, or the tenant is already deleted',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );

export const ApiSoftDeleteTenants = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk soft delete tenants (super_admin)',
      description:
        'Body `{ ids: number[] }`. Rows already deleted are skipped, not refused — the response is the count actually changed, which may be less than `ids.length`.',
    }),
    ApiOkResponse({
      description: 'Count of tenants soft deleted',
      schema: { properties: { count: { type: 'number', example: 2 } } },
    }),
    ApiBadRequestResponse({
      description: 'Invalid body (ids must be a non-empty array of integers)',
    }),
  );

export const ApiRestoreTenant = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Restore a soft-deleted tenant (super_admin)',
      description:
        'Clears `deleted_at`. audit_logs records the old and new `deleted_at`.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Tenant restored', type: TenantEntity }),
    ApiBadRequestResponse({
      description: 'The id is not a valid number, or the tenant is not deleted',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );

export const ApiRestoreTenants = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk restore tenants (super_admin)',
      description:
        'Body `{ ids: number[] }`. Rows not deleted are skipped, not refused — the response is the count actually changed, which may be less than `ids.length`.',
    }),
    ApiOkResponse({
      description: 'Count of tenants restored',
      schema: { properties: { count: { type: 'number', example: 2 } } },
    }),
    ApiBadRequestResponse({
      description: 'Invalid body (ids must be a non-empty array of integers)',
    }),
  );

export const ApiSendTenantVerificationEmail = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Email the tenant a verification code (super_admin)',
      description:
        "Generates a 6-digit code (24h lifetime) and emails it to the tenant's own `email`. Sending a new code invalidates any code sent before it.",
    }),
    idParam(),
    ApiOkResponse({
      description: 'Email sent',
      schema: { properties: { sent: { type: 'boolean', example: true } } },
    }),
    ApiBadRequestResponse({
      description:
        'The id is not a valid number, or the email is already verified',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );

export const ApiVerifyTenantEmail = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify the tenant email with the code (super_admin)',
      description:
        'Body `{ code: string }`. Sets `email_verified_at` on a match. A wrong code does not consume it — the same code can be retried until it expires (24h).',
    }),
    idParam(),
    ApiOkResponse({ description: 'Email verified', type: TenantEntity }),
    ApiBadRequestResponse({
      description:
        'The id is not a valid number, the email is already verified, or the code is invalid/expired',
    }),
    ApiNotFoundResponse({ description: 'Tenant not found' }),
  );
