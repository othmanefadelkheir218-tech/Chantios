import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { AdminUserEntity } from '../entities/admin-user.entity';

const idParam = () => ApiIntParam('id', 'Admin user id');

export const ApiCreateAdminUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a platform admin user (super_admin)',
      description:
        'ChantierOS staff only — internal. The password is hashed with argon2id and never returned.',
    }),
    ApiCreatedResponse({ description: 'Created', type: AdminUserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data (validation error)' }),
    ApiConflictResponse({ description: 'Email already used' }),
  );

export const ApiFindAdminUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List platform admin users (super_admin)',
      description: 'Paginated, newest first. Filter with `search`.',
    }),
    ApiPaginatedResponse(AdminUserEntity, 'Paginated list of admin users'),
  );

export const ApiUpdateAdminUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a platform admin user (super_admin)',
      description: 'Name, role and password. The email cannot change.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Updated', type: AdminUserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data or invalid id' }),
    ApiNotFoundResponse({ description: 'Admin user not found' }),
  );

export const ApiDeactivateAdminUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Deactivate a platform admin user (super_admin)',
      description: 'Sets `is_active = false`. The row is never deleted.',
    }),
    idParam(),
    ApiNoContentResponse({ description: 'Deactivated' }),
    ApiBadRequestResponse({ description: 'The id is not a valid number' }),
    ApiNotFoundResponse({ description: 'Admin user not found' }),
  );
