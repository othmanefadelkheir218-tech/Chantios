import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { MediaEntity } from '../entities/media.entity';

const idParam = () => ApiIntParam('id', 'Media id');

const fileUploadBody = (extra: Record<string, { type: string }> = {}) => ({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
      ...extra,
    },
  },
});

export const ApiUploadMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload a file (media:create)',
      description:
        'Multipart. Rejected before ImageKit is called if the size (>10MB) or MIME type is not allowed for `entity_type`.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody(
      fileUploadBody({
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
      }),
    ),
    ApiCreatedResponse({ description: 'File uploaded', type: MediaEntity }),
    ApiBadRequestResponse({
      description: 'Too large, disallowed MIME type, or invalid data',
    }),
  );

export const ApiFindMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List media (media:view)',
      description:
        'Paginated, newest first. Filter with `entity_type`/`entity_id`. A `worker` (scope `own`) only sees their own uploads. Excludes trashed rows.',
    }),
    ApiPaginatedResponse(MediaEntity, 'Paginated list of files'),
  );

export const ApiFindOneMedia = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get one file (media:view)' }),
    idParam(),
    ApiOkResponse({ description: 'The file', type: MediaEntity }),
    ApiNotFoundResponse({ description: 'Media not found' }),
  );

export const ApiRenameMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Rename a file (media:edit)',
      description: '`file_name` only — `file_url` never changes.',
    }),
    idParam(),
    ApiOkResponse({ description: 'File renamed', type: MediaEntity }),
    ApiNotFoundResponse({ description: 'Media not found' }),
  );

export const ApiSoftDeleteMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Trash files (media:delete)',
      description:
        'Bulk, `{ ids }`. Sets `deleted_at`; ImageKit untouched. A locked id is skipped, not refused — the rest of the batch proceeds.',
    }),
    ApiOkResponse({ description: 'Files trashed' }),
  );

export const ApiHardDeleteMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Permanently delete files (media:delete)',
      description:
        'Bulk, `{ ids }`. ImageKit removed first, then the row, immediately — no trash. Same locked-id skip as soft delete.',
    }),
    ApiOkResponse({ description: 'Files permanently deleted' }),
  );

export const ApiRestoreMedia = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Restore trashed files (media:edit)',
      description: 'Bulk, `{ ids }`. Clears `deleted_at`.',
    }),
    ApiOkResponse({ description: 'Files restored' }),
  );

export const ApiStorageUsage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Storage usage for this tenant (settings:view)',
      description:
        '`SUM(file_size)`, including trashed rows — trash is not free storage. The `storage_gb` billing dimension.',
    }),
    ApiOkResponse({ description: 'Storage usage in bytes and GB' }),
  );

export const ApiReplaceTenantLogo = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Replace the company logo (settings:create)',
      description:
        'Multipart. Hard-deletes the previous logo (no trash) and updates `tenants.logo_media_id`.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody(fileUploadBody()),
    ApiCreatedResponse({ description: 'Logo replaced', type: MediaEntity }),
    ApiBadRequestResponse({
      description: 'Too large or disallowed MIME type',
    }),
  );
