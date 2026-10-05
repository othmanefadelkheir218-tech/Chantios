import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { RolesService } from '../../roles/roles.service';
import { toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { RoleName, resolvePermission } from '../helpers/permission.helper';

/** `GET /api/auth/me` — user + role + this tenant's resolved permissions for that role. */
@Injectable()
export class GetMeHandler {
  constructor(
    private readonly users: UsersService,
    private readonly roles: RolesService,
  ) {}

  async execute(actor: AuthenticatedUser) {
    const user = await this.users.findByIdRaw(actor.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const role = await this.roles.findRoleById(actor.roleId);
    const overrides = await this.roles.findOverridesForRole(actor.roleId);

    const permissions = Object.values(PermissionModule).map((module) => ({
      module,
      ...resolvePermission(role?.name as RoleName, module, overrides),
    }));

    return { user: toUserEntity(user), role, permissions };
  }
}
