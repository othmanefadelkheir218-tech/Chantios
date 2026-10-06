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
import { ClientEntity } from '../entities/client.entity';

const idParam = () => ApiIntParam('id', 'Client id');

export const ApiCreateClient = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a client (clients:create)',
      description: "`vat_number` is required when `type = 'professional'`.",
    }),
    ApiCreatedResponse({ description: 'Client created', type: ClientEntity }),
    ApiBadRequestResponse({
      description: 'Invalid data, or missing vat_number for a professional',
    }),
    ApiConflictResponse({ description: 'Email already used in this tenant' }),
  );

export const ApiFindClients = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List clients (clients:view)',
      description:
        'Paginated, newest first. `search` matches name, email and phone.',
    }),
    ApiPaginatedResponse(ClientEntity, 'Paginated list of clients'),
  );

export const ApiFindClient = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one client (clients:view)' }),
    idParam(),
    ApiOkResponse({ description: 'The client', type: ClientEntity }),
    ApiNotFoundResponse({ description: 'Client not found' }),
  );

export const ApiUpdateClient = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update a client (clients:edit)' }),
    idParam(),
    ApiOkResponse({ description: 'Client updated', type: ClientEntity }),
    ApiBadRequestResponse({
      description: 'Invalid data, or missing vat_number for a professional',
    }),
    ApiConflictResponse({ description: 'Email already used in this tenant' }),
    ApiNotFoundResponse({ description: 'Client not found' }),
  );

export const ApiArchiveClient = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Archive a client (clients:delete)',
      description: '`is_active = false`. The row is never deleted.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Client archived', type: ClientEntity }),
    ApiNotFoundResponse({ description: 'Client not found' }),
  );
