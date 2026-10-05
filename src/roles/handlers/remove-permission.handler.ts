import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RoleRepository } from '../repositories/role.repository';

/** `DELETE /api/roles/:roleId/permissions/:module` — back to the code default. */
@Injectable()
export class RemovePermissionHandler {
  constructor(
    @InjectPinoLogger(RemovePermissionHandler.name)
    private readonly logger: PinoLogger,
    private readonly roles: RoleRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    roleId: number,
    module: PermissionModule,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Removing ${module} override for role ${roleId}`);

    const role = await this.roles.findRoleById(roleId);
    if (!role) {
      this.logger.warn(`Cannot remove permission: role ${roleId} not found`);
      throw new NotFoundException('Role not found');
    }

    const previous = await this.roles.findOverride(roleId, module);
    await this.roles.removeOverride(roleId, module);

    if (previous) {
      await this.audit.write({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'remove_permission',
        entityType: 'role_permission',
        entityId: previous.id,
        oldValue: previous,
        ipAddress: null,
      });
    }
    this.logger.info(`Permission override removed: role ${roleId}, ${module}`);
    return { removed: true };
  }
}
