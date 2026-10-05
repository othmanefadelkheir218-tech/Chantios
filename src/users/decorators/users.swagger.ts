import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { UserEntity } from '../entities/user.entity';

const idParam = () => ApiIntParam('id', 'User id');

export const ApiFindUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List the team (team:view)',
      description:
        'Paginated, newest first. Filter with `search`, `role_id`, `is_active`.',
    }),
    ApiPaginatedResponse(UserEntity, 'Paginated list of team members'),
  );

export const ApiFindUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one team member (team:view)' }),
    idParam(),
    ApiOkResponse({ description: 'The user', type: UserEntity }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );

export const ApiUpdateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a team member (admin)',
      description:
        'Role, hourly_rate and is_active are admin-only fields. An entry is written to audit_logs.',
    }),
    idParam(),
    ApiOkResponse({ description: 'User updated', type: UserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data or invalid id' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );

export const ApiDeactivateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Deactivate a team member (admin)',
      description:
        '`is_active = false` and every one of their sessions is revoked. History is kept.',
    }),
    idParam(),
    ApiOkResponse({ description: 'User deactivated', type: UserEntity }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );

export const ApiUpdateProfile = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update my own name/phone' }),
    ApiOkResponse({ description: 'Profile updated', type: UserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiSetPin = () =>
  applyDecorators(
    ApiOperation({
      summary: "Set a worker's mobile PIN (admin)",
      description: 'argon2id-hashed. Worker role only.',
    }),
    idParam(),
    ApiOkResponse({ description: 'PIN set', type: UserEntity }),
    ApiBadRequestResponse({ description: 'The user is not a worker' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );
