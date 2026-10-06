import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { assertFullScope, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `DELETE /api/tasks/:id` — a task is schedule data, not a financial record,
 * so this is a real delete: its assignee rows cascade and the time entries
 * logged against it keep their row (`task_id` becomes `NULL`).
 */
@Injectable()
export class DeleteTaskHandler {
  constructor(
    @InjectPinoLogger(DeleteTaskHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    this.logger.info(`Deleting task ${id}`);
    assertFullScope(scope);

    const current = await this.tasks.findById(id);
    if (!current) {
      this.logger.warn(`Cannot delete task: ${id} not found`);
      throw new NotFoundException('Task not found');
    }

    await this.tasks.delete(id);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'delete',
      entityType: 'task',
      entityId: id,
      oldValue: toTaskEntity(current),
      ipAddress: null,
    });
    this.logger.info(`Task deleted: ${id}`);
    return { deleted: true, id };
  }
}
