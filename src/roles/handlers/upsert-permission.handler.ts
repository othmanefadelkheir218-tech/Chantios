import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpsertPermissionDto } from '../dto/upsert-permission.dto';
import { RoleRepository } from '../repositories/role.repository';

/** `PUT /api/roles/:roleId/permissions/:module` — admin only. */
@Injectable()
export class UpsertPermissionHandler {
  constructor(
    @InjectPinoLogger(UpsertPermissionHandler.name)
    private readonly logger: PinoLogger,
    private readonly roles: RoleRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    roleId: number,
    module: PermissionModule,
    dto: UpsertPermissionDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Overriding ${module} permission for role ${roleId}`);

    const role = await this.roles.findRoleById(roleId);
    if (!role) {
      this.logger.warn(`Cannot override permission: role ${roleId} not found`);
      throw new NotFoundException('Role not found');
    }

    const previous = await this.roles.findOverride(roleId, module);
    const override = await this.roles.upsertOverride(roleId, module, {
      canView: dto.can_view,
      canCreate: dto.can_create,
      canEdit: dto.can_edit,
      canDelete: dto.can_delete,
      scope: dto.scope,
    });

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'upsert_permission',
      entityType: 'role_permission',
      entityId: override.id,
      oldValue: previous,
      newValue: override,
      ipAddress: null,
    });
    this.logger.info(`Permission override saved: role ${roleId}, ${module}`);
    return override;
  }
}
