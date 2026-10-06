import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindTasksQueryDto } from '../dto/find-tasks-query.dto';
import { buildTaskFilter, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `GET /api/tasks` (the Gantt feed) and `GET /api/tasks/:id`. `scope = 'own'`
 * (the `worker` default) limits both to the tasks the caller is assigned to —
 * a task that is not theirs is a plain `404`.
 */
@Injectable()
export class FindTasksHandler {
  constructor(
    @InjectPinoLogger(FindTasksHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
  ) {}

  async execute(
    query: FindTasksQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    const { page, limit } = query;
    this.logger.debug(`Listing tasks (page ${page}, limit ${limit})`);

    const [data, total] = await this.tasks.findMany(
      buildTaskFilter({
        projectId: query.project_id,
        status: query.status,
        from: query.from,
        to: query.to,
        assigneeId: scope === 'own' ? actor.userId : undefined,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toTaskEntity), total, page, limit);
  }

  async findOne(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    const task = await this.tasks.findById(id);
    const visible =
      task &&
      (scope !== 'own' ||
        task.assignees.some((a) => a.userId === actor.userId));
    if (!task || !visible) {
      this.logger.warn(`Task ${id} not found for user ${actor.userId}`);
      throw new NotFoundException('Task not found');
    }
    return toTaskEntity(task);
  }
}
