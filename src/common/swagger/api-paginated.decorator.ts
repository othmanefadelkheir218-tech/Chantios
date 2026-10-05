import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';

/** Documents the `{ data, total, page, limit, totalPages }` list response. */
export const ApiPaginatedResponse = <T extends Type<unknown>>(
  model: T,
  description: string,
) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          total: { type: 'number', example: 42 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 3 },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
  );

/** `:id` / `:tenantId` path parameter documented as an integer. */
export const ApiIntParam = (name: string, description: string) =>
  ApiParam({ name, description, type: Number });
