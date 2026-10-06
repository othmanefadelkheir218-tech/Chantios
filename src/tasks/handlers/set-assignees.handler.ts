import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { UsersService } from '../../users/users.service';
import { SetAssigneesDto } from '../dto/set-assignees.dto';
import { assertValidAssignees } from '../helpers/assignees.helper';
import { assertFullScope, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `PUT /api/tasks/:id/assignees` — replaces the whole set in one transaction.
 * At least one (DTO). No duplicates; every user active in this tenant.
 */
@Injectable()
export class SetAssigneesHandler {
  constructor(
    @InjectPinoLogger(SetAssigneesHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly tasks: TaskRepository,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: SetAssigneesDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(`Replacing assignees of task ${id}`);
    assertFullScope(scope);

    const current = await this.tasks.findById(id);
    if (!current) {
      this.logger.warn(`Cannot set assignees: task ${id} not found`);
      throw new NotFoundException('Task not found');
    }

    await assertValidAssignees(
      dto.user_ids,
      async (userId) =>
        (await this.users.findActiveInTenant(userId, actor.tenantId)) !== null,
    );

    await this.tenantPrisma.db.$transaction((tx) =>
      this.tasks.replaceAssignees(id, actor.tenantId, dto.user_ids, tx),
    );
    const updated = await this.tasks.findById(id);
    const entity = toTaskEntity(updated!);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_assignees',
      entityType: 'task',
      entityId: id,
      oldValue: { assigneeIds: current.assignees.map((a) => a.userId) },
      newValue: { assigneeIds: entity.assigneeIds },
      ipAddress: null,
    });
    this.logger.info(`Task ${id} now has ${dto.user_ids.length} assignee(s)`);
    return entity;
  }
}
