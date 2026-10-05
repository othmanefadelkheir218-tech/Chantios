import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RolesService } from '../../roles/roles.service';
import { PERMISSION_MODULE_KEY } from '../decorators/module.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { RoleName, resolvePermission } from '../helpers/permission.helper';

const METHOD_TO_ACTION: Record<
  string,
  'canView' | 'canCreate' | 'canEdit' | 'canDelete'
> = {
  GET: 'canView',
  POST: 'canCreate',
  PATCH: 'canEdit',
  PUT: 'canEdit',
  DELETE: 'canDelete',
};

/**
 * Pipeline step 4: role + module (doc/notes/roles-permissions.md). A route
 * marked `@Roles(...)` is checked against the user's role name directly; a
 * route marked `@Module(...)` is resolved through the default matrix plus
 * this tenant's `role_permissions` overrides. Neither decorator present ->
 * any authenticated user may pass (the route only needed `AuthGuard`). Sets
 * `req.permissionScope` ('all' | 'own') for the handler to apply. Must run
 * after `TenantGuard`. NOT attached to any route yet.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as unknown as { user: AuthenticatedUser }).user;

    const allowedRoles = this.reflector.getAllAndOverride<
      RoleName[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    const permissionModule = this.reflector.getAllAndOverride<
      Parameters<typeof resolvePermission>[1] | undefined
    >(PERMISSION_MODULE_KEY, [context.getHandler(), context.getClass()]);

    const role = await this.roles.findRoleById(user.roleId);
    if (!role) {
      throw new ForbiddenException('Unknown role');
    }
    const roleName = role.name as RoleName;

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(roleName)) {
        throw new ForbiddenException('Insufficient role');
      }
      return true;
    }

    if (!permissionModule) {
      return true;
    }

    const overrides = await this.roles.findOverridesForRole(user.roleId);
    const resolved = resolvePermission(roleName, permissionModule, overrides);
    const action = METHOD_TO_ACTION[req.method] ?? 'canView';

    if (!resolved[action]) {
      throw new ForbiddenException(
        `No ${action} access to ${permissionModule}`,
      );
    }

    (req as unknown as { permissionScope: string }).permissionScope =
      resolved.scope;
    return true;
  }
}
