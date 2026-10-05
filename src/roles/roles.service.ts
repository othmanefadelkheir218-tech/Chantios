import { Injectable } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UpsertPermissionDto } from './dto/upsert-permission.dto';
import { FindPermissionsHandler } from './handlers/find-permissions.handler';
import { FindRolesHandler } from './handlers/find-roles.handler';
import { RemovePermissionHandler } from './handlers/remove-permission.handler';
import { UpsertPermissionHandler } from './handlers/upsert-permission.handler';
import { RoleRepository } from './repositories/role.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class RolesService {
  constructor(
    private readonly roles: RoleRepository,
    private readonly findRoles: FindRolesHandler,
    private readonly findPermissions: FindPermissionsHandler,
    private readonly upsertPermission: UpsertPermissionHandler,
    private readonly removePermission: RemovePermissionHandler,
  ) {}

  findAll() {
    return this.findRoles.execute();
  }

  /** A plain lookup, no business logic to put in a handler — used by `PermissionGuard`. */
  findRoleById(id: number) {
    return this.roles.findRoleById(id);
  }

  /** This tenant's overrides for one role — used by `PermissionGuard`. */
  findOverridesForRole(roleId: number) {
    return this.roles.findOverridesForRole(roleId);
  }

  findPermissionsMatrix() {
    return this.findPermissions.execute();
  }

  upsertPermissionOverride(
    roleId: number,
    module: PermissionModule,
    dto: UpsertPermissionDto,
    actor: AuthenticatedUser,
  ) {
    return this.upsertPermission.execute(roleId, module, dto, actor);
  }

  removePermissionOverride(
    roleId: number,
    module: PermissionModule,
    actor: AuthenticatedUser,
  ) {
    return this.removePermission.execute(roleId, module, actor);
  }
}
