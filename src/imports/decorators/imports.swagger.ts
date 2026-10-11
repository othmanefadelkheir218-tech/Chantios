import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { ImportBatchEntity } from '../entities/import-batch.entity';

const createDecorators = (summary: string, description: string) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiAcceptedResponse({
      description: 'Saved as pending, the job runs in the background',
      type: ImportBatchEntity,
    }),
    ApiBadRequestResponse({
      description: '0 or more than 500 rows, or a bad type',
    }),
    ApiForbiddenResponse({
      description: 'The file needs a right the user does not have',
    }),
    ApiConflictResponse({ description: 'The same rows were already imported' }),
  );

export const ApiImportMaterials = () =>
  createDecorators(
    'Import materials from a file',
    'Empty `id` = create. Existing `id` = update `purchase_price` / `minimum_stock` only. `stock_depart` (new rows, admin/manager) writes a "Stock initial" adjustment. All or nothing.',
  );

export const ApiImportStock = () =>
  createDecorators(
    'Import stock movements from a file',
    '`purchase` or `adjustment` only, at the material price. Adjustments need admin/manager and a note. All or nothing.',
  );

export const ApiFindImports = () =>
  applyDecorators(
    ApiOperation({ summary: 'List the imports, newest first' }),
    ApiPaginatedResponse(ImportBatchEntity, 'Paginated list of imports'),
  );

export const ApiFindImport = () =>
  applyDecorators(
    ApiOperation({ summary: 'One import, with its errors' }),
    ApiIntParam('id', 'Import id'),
    ApiOkResponse({ type: ImportBatchEntity }),
    ApiNotFoundResponse({ description: 'Import not found' }),
  );
