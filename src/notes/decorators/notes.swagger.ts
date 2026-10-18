import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';

const PRIVATE =
  "Private: only the caller's own notes, whatever the role (the tenant admin too). 403 while impersonating.";

const noteId = () => ApiIntParam('id', 'Note id');
const notFound = () =>
  ApiNotFoundResponse({ description: 'Not your note, or unknown' });
const forbidden = () =>
  ApiForbiddenResponse({
    description: 'No notes permission, or impersonating',
  });

export const ApiFindNotes = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List my notes (notes:view)',
      description: `One view: notes (default), archive or trash. Pinned first, then last edited. \`search\` looks in the title and the body; \`label_id\` filters. ${PRIVATE}`,
    }),
    ApiOkResponse({ description: '{ data, total, page, limit }' }),
    forbidden(),
  );

export const ApiFindNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'One of my notes, with labels and images',
      description: PRIVATE,
    }),
    noteId(),
    ApiOkResponse({ description: 'The note' }),
    notFound(),
  );

export const ApiCreateNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a note (notes:create)',
      description:
        'content = the editor document (Tiptap JSON, max 200 KB). The server builds the search text. Pinned wins over archived.',
    }),
    ApiCreatedResponse({ description: 'The note' }),
    ApiBadRequestResponse({
      description: 'Invalid data, unknown label, too large',
    }),
  );

export const ApiUpdateNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Edit a note (notes:edit)',
      description:
        'label_ids replaces the labels. Pinning an archived note brings it back. A note in the trash cannot be edited (400).',
    }),
    noteId(),
    ApiOkResponse({ description: 'The note' }),
    ApiBadRequestResponse({
      description: 'In the trash, unknown label, invalid data',
    }),
    notFound(),
  );

export const ApiTrashNote = () =>
  applyDecorators(
    ApiOperation({ summary: 'Move a note to the trash (7 days)' }),
    noteId(),
    ApiOkResponse({ description: 'The note, with deleted_at' }),
    notFound(),
  );

export const ApiRestoreNote = () =>
  applyDecorators(
    ApiOperation({ summary: 'Restore a note from the trash' }),
    noteId(),
    ApiOkResponse({ description: 'The note' }),
    notFound(),
  );

export const ApiDeleteNote = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a note for good, with its images (only from the trash)',
    }),
    noteId(),
    ApiOkResponse({ description: '{ deleted: [id] }' }),
    ApiBadRequestResponse({ description: 'Not in the trash' }),
    notFound(),
  );

export const ApiEmptyTrash = () =>
  applyDecorators(
    ApiOperation({ summary: 'Empty my trash — every note in it, for good' }),
    ApiOkResponse({ description: '{ deleted: [ids] }' }),
  );

export const ApiAddNoteImage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Add an image to a note',
      description:
        'Multipart `file`. JPEG, PNG or WebP, 10 MB max. Counts in the plan storage.',
    }),
    noteId(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiCreatedResponse({ description: '{ id, file_url, file_name }' }),
    ApiBadRequestResponse({
      description: 'No file, too large, wrong type, or note in the trash',
    }),
    notFound(),
  );

export const ApiRemoveNoteImage = () =>
  applyDecorators(
    ApiOperation({ summary: 'Remove one image from a note (for good)' }),
    noteId(),
    ApiIntParam('mediaId', 'Image (media) id'),
    ApiOkResponse({ description: '{ deleted: [mediaId] }' }),
    notFound(),
  );

export const ApiFindNoteLabels = () =>
  applyDecorators(
    ApiOperation({ summary: 'My note labels, by name', description: PRIVATE }),
    ApiOkResponse({ description: 'The labels' }),
  );

export const ApiCreateNoteLabel = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a note label' }),
    ApiCreatedResponse({ description: 'The label' }),
    ApiConflictResponse({
      description: 'You already have a label with this name',
    }),
  );

export const ApiRenameNoteLabel = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rename a note label' }),
    ApiIntParam('id', 'Label id'),
    ApiOkResponse({ description: 'The label' }),
    ApiConflictResponse({
      description: 'You already have a label with this name',
    }),
    ApiNotFoundResponse({ description: 'Not your label, or unknown' }),
  );

export const ApiDeleteNoteLabel = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete a note label — its notes stay' }),
    ApiIntParam('id', 'Label id'),
    ApiOkResponse({ description: '{ deleted: [id] }' }),
    ApiNotFoundResponse({ description: 'Not your label, or unknown' }),
  );
