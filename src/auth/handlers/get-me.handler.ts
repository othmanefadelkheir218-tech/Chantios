import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { RolesService } from '../../roles/roles.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { RoleName, resolvePermission } from '../helpers/permission.helper';

/**
 * `GET /api/auth/me` — user + role + this tenant's resolved permissions for
 * that role, `impersonation` (null for a normal login), and `subscription`:
 * the status + dates the frontend needs for the "trial ended" banner and the
 * "company blocked" page (step 20). Works for a blocked company too.
 */
@Injectable()
export class GetMeHandler {
  constructor(
    @InjectPinoLogger(GetMeHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly adminUsers: AdminUsersService,
    private readonly subscriptions: SubscriptionsService,
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

    const impersonation = await this.buildImpersonation(actor);
    const subscription = await this.buildSubscription(actor.tenantId);
    return {
      user: toUserEntity(user),
      role,
      permissions,
      impersonation,
      subscription,
    };
  }

  private async buildSubscription(tenantId: number) {
    const row = await this.subscriptions.findByTenant(tenantId);
    if (!row) return null;
    return {
      status: row.status,
      periodEnd: row.periodEnd,
      graceEndsAt: row.graceEndsAt,
    };
  }

  /** The frontend shows the "exit impersonation" banner from this key only. */
  private async buildImpersonation(actor: AuthenticatedUser) {
    if (actor.impersonatedBy === undefined) return null;

    const admin = await this.adminUsers.findByIdRaw(actor.impersonatedBy);
    if (!admin) {
      this.logger.warn(
        `Impersonating admin ${actor.impersonatedBy} not found for user ${actor.userId}`,
      );
    }
    return {
      adminUserId: actor.impersonatedBy,
      adminName: admin?.name ?? null,
      expiresAt: actor.accessExpiresAt ?? null,
    };
  }
}
