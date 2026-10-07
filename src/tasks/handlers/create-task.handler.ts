import { BadRequestException, Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { assertDateOrder } from '../../common/helpers/date-range.helper';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectsService } from '../../projects/projects.service';
import { UsersService } from '../../users/users.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { assertValidAssignees } from '../helpers/assignees.helper';
import { taskAlertContext } from '../helpers/task-alert.helper';
import { assertFullScope, toTaskEntity } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `POST /api/tasks` — one `tasks` row + one `task_assignees` row per user, in
 * one transaction. `end_date` not before `start_date`; assignees must be
 * active users of this tenant; the project must exist and not be `cancelled`.
 * Starts `planned`.
 */
@Injectable()
export class CreateTaskHandler {
  constructor(
    @InjectPinoLogger(CreateTaskHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectsService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(
    dto: CreateTaskDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(
      `Creating task "${dto.title}" on project ${dto.project_id}`,
    );
    assertFullScope(scope);
    assertDateOrder(dto.start_date, dto.end_date);

    // Throws NotFoundException if the project does not belong to this tenant.
    const project = await this.projects.findOne(dto.project_id);
    if (project.status === 'cancelled') {
      this.logger.warn(
        `Cannot create task: project ${dto.project_id} is cancelled`,
      );
      throw new BadRequestException(
        'Cannot create a task on a cancelled project',
      );
    }

    const assigneeIds = dto.assignee_ids ?? [];
    await assertValidAssignees(
      assigneeIds,
      async (userId) =>
        (await this.users.findActiveInTenant(userId, actor.tenantId)) !== null,
    );

    const created = await this.tenantPrisma.db.$transaction((tx) =>
      this.tasks.create(
        {
          tenantId: actor.tenantId,
          projectId: dto.project_id,
          title: dto.title,
          type: dto.type,
          startDate: new Date(dto.start_date),
          endDate: new Date(dto.end_date),
          status: 'planned',
          createdBy: actor.userId,
        },
        assigneeIds,
        tx,
      ),
    );
    const entity = toTaskEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'task',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    if (assigneeIds.length > 0) {
      await this.notifications.dispatch(
        'task_assigned',
        taskAlertContext(
          actor.tenantId,
          created,
          project.name,
          assigneeIds,
          {},
          actor.userId,
        ),
      );
    }
    this.logger.info(
      `Task created: ${created.id} with ${assigneeIds.length} assignee(s)`,
    );
    return entity;
  }
}
