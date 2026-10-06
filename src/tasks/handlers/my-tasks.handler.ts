import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindTasksQueryDto } from '../dto/find-tasks-query.dto';
import { buildTaskFilter, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `GET /api/mobile/my-tasks` — the worker screen: tasks the caller is
 * assigned to, whatever their role. Same filters as the Gantt feed.
 */
@Injectable()
export class MyTasksHandler {
  constructor(
    @InjectPinoLogger(MyTasksHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
  ) {}

  async execute(query: FindTasksQueryDto, actor: AuthenticatedUser) {
    const { page, limit } = query;
    this.logger.debug(`Listing tasks of user ${actor.userId}`);

    const [data, total] = await this.tasks.findMany(
      buildTaskFilter({
        projectId: query.project_id,
        status: query.status,
        from: query.from,
        to: query.to,
        assigneeId: actor.userId,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toTaskEntity), total, page, limit);
  }
}
