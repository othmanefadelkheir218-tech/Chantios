import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';

export const ApiFindRoles = () =>
  applyDecorators(
    ApiOperation({ summary: 'List the 7 roles' }),
    ApiOkResponse({ description: 'The 7 roles', type: [RoleEntity] }),
  );

export const ApiFindPermissions = () =>
  applyDecorators(
    ApiOperation({
      summary: "This tenant's resolved permissions (settings:view)",
      description:
        "Code defaults merged with this tenant's role_permissions overrides. 7 roles x 16 modules.",
    }),
    ApiOkResponse({
      description: 'The resolved matrix',
      type: [PermissionEntity],
    }),
  );

export const ApiUpsertPermission = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Override one permission (admin)',
      description:
        'Upserts the (role, module) row. An entry is written to audit_logs.',
    }),
    ApiIntParam('roleId', 'Role id, 1-7'),
    ApiOkResponse({ description: 'Override saved' }),
    ApiBadRequestResponse({ description: 'Invalid data or invalid module' }),
    ApiNotFoundResponse({ description: 'Role not found' }),
  );

export const ApiRemovePermission = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remove one override, back to the code default (admin)',
    }),
    ApiIntParam('roleId', 'Role id, 1-7'),
    ApiOkResponse({ description: 'Override removed (or already absent)' }),
    ApiNotFoundResponse({ description: 'Role not found' }),
  );
