import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { PaginatedUsersDto } from '../dto/paginated-users.dto';
import { UserEntity } from '../entities/user.entity';

const idParam = () =>
  ApiParam({ name: 'id', description: 'User id (UUID)', format: 'uuid' });

export const ApiCreateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a user',
      description: 'Creates a new user. The phone number must be unique.',
    }),
    ApiCreatedResponse({ description: 'User created', type: UserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data (validation error)' }),
    ApiConflictResponse({ description: 'Phone number already used' }),
  );

export const ApiFindUsers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List users',
      description:
        'Returns a paginated list, newest first. Use `search` to filter by name, last name or phone.',
    }),
    ApiOkResponse({
      description: 'Paginated list of users',
      type: PaginatedUsersDto,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
  );

export const ApiFindUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one user by id' }),
    idParam(),
    ApiOkResponse({ description: 'The user', type: UserEntity }),
    ApiBadRequestResponse({ description: 'The id is not a valid UUID' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );

export const ApiUpdateUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a user',
      description: 'Updates only the fields that you send.',
    }),
    idParam(),
    ApiOkResponse({ description: 'User updated', type: UserEntity }),
    ApiBadRequestResponse({ description: 'Invalid data or invalid UUID' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiConflictResponse({ description: 'Phone number already used' }),
  );

export const ApiDeleteUser = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete a user' }),
    idParam(),
    ApiNoContentResponse({ description: 'User deleted' }),
    ApiBadRequestResponse({ description: 'The id is not a valid UUID' }),
    ApiNotFoundResponse({ description: 'User not found' }),
  );
