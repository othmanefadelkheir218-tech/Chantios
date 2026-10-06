import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SetTaskStatusDto } from '../dto/set-task-status.dto';
import {
  assertCanLeavePlanned,
  assertFullScope,
  toTaskEntity,
} from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/** `PATCH /api/tasks/:id/status` — leaving `planned` requires at least one assignee. */
@Injectable()
export class SetTaskStatusHandler {
  constructor(
    @InjectPinoLogger(SetTaskStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: SetTaskStatusDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(`Setting task ${id} status to ${dto.status}`);
    assertFullScope(scope);

    const current = await this.tasks.findById(id);
    if (!current) {
      this.logger.warn(`Cannot change task status: ${id} not found`);
      throw new NotFoundException('Task not found');
    }
    if (current.status === dto.status) {
      throw new BadRequestException(`The task is already ${dto.status}`);
    }

    assertCanLeavePlanned(dto.status, current.assignees.length);

    await this.tasks.setStatus(id, dto.status);
    const updated = await this.tasks.findById(id);
    const entity = toTaskEntity(updated!);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'status_change',
      entityType: 'task',
      entityId: id,
      oldValue: { status: current.status },
      newValue: { status: dto.status },
      ipAddress: null,
    });
    this.logger.info(`Task ${id} is now ${dto.status}`);
    return entity;
  }
}
