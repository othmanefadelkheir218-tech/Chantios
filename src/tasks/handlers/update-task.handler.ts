import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { assertDateOrder } from '../../common/helpers/date-range.helper';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { assertFullScope, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/** `PATCH /api/tasks/:id` — the dates are checked against the values that would result, not just the ones sent. */
@Injectable()
export class UpdateTaskHandler {
  constructor(
    @InjectPinoLogger(UpdateTaskHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: UpdateTaskDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(`Updating task ${id}`);
    assertFullScope(scope);

    const current = await this.tasks.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update task: ${id} not found`);
      throw new NotFoundException('Task not found');
    }

    assertDateOrder(
      dto.start_date ?? current.startDate,
      dto.end_date ?? current.endDate,
    );

    const data: Prisma.TaskUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.start_date && { startDate: new Date(dto.start_date) }),
      ...(dto.end_date && { endDate: new Date(dto.end_date) }),
    };
    await this.tasks.update(id, data);
    const updated = await this.tasks.findById(id);
    const entity = toTaskEntity(updated!);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'task',
      entityId: id,
      oldValue: toTaskEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Task updated: ${id}`);
    return entity;
  }
}
