import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MarginsService } from '../../margins/margins.service';
import { ProjectsService } from '../../projects/projects.service';
import { TasksService } from '../../tasks/tasks.service';
import { UsersService } from '../../users/users.service';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';
import { checkDailyTotal } from '../helpers/daily-hours.helper';
import {
  assertCanLogFor,
  assertHoursRange,
  assertTaskInProject,
  toTimeEntryEntity,
  withDailyInfo,
} from '../helpers/time-entry.helper';
import { TimeEntryRepository } from '../repositories/time-entry.repository';
import { UpdateTimeEntryHandler } from './update-time-entry.handler';

/**
 * `POST /api/time-entries` (and `/api/mobile/time-entries`).
 *  - the daily-hours rule (all projects together: >12h alert, >24h rejected);
 *  - `hourly_rate` is FROZEN from `users.hourly_rate` now;
 *  - worker hour scope is PROJECT-level: a role with scope `own` may log only
 *    for itself, on a project where it is an assignee on at least one task.
 *    `task_id` is optional and never narrows that check;
 *  - `UNIQUE (user_id, project_id, work_date)`: a second entry for the same
 *    day and project is an UPDATE of that row, not an insert.
 */
@Injectable()
export class CreateTimeEntryHandler {
  constructor(
    @InjectPinoLogger(CreateTimeEntryHandler.name)
    private readonly logger: PinoLogger,
    private readonly entries: TimeEntryRepository,
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
    private readonly users: UsersService,
    private readonly updateEntry: UpdateTimeEntryHandler,
    private readonly audit: AuditService,
    private readonly margins: MarginsService,
  ) {}

  async execute(
    dto: CreateTimeEntryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    const isOwnScope = scope === 'own';
    const targetUserId = dto.user_id ?? actor.userId;
    this.logger.info(
      `Logging ${dto.hours}h for user ${targetUserId} on project ${dto.project_id}, ${dto.work_date}`,
    );

    assertCanLogFor(targetUserId, actor.userId, isOwnScope);
    assertHoursRange(dto.hours);

    const user = await this.users.findActiveInTenant(
      targetUserId,
      actor.tenantId,
    );
    if (!user) {
      this.logger.warn(
        `Cannot log hours: user ${targetUserId} not active here`,
      );
      throw new BadRequestException('User not found or inactive');
    }

    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(dto.project_id);

    if (isOwnScope) {
      const assigned = await this.tasks.isAssignedToProject(
        targetUserId,
        dto.project_id,
      );
      if (!assigned) {
        this.logger.warn(
          `Refused: user ${targetUserId} has no task on project ${dto.project_id}`,
        );
        throw new ForbiddenException(
          'You can only log hours on a project where you are assigned to a task',
        );
      }
    }

    if (dto.task_id) {
      assertTaskInProject(
        await this.tasks.findByIdRaw(dto.task_id),
        dto.project_id,
      );
    }

    const workDate = new Date(dto.work_date);
    const existing = await this.entries.findByUserProjectDate(
      targetUserId,
      dto.project_id,
      workDate,
    );
    if (existing) {
      this.logger.info(
        `An entry already exists for that day (${existing.id}) — updating it`,
      );
      return this.updateEntry.execute(
        existing.id,
        { hours: dto.hours, task_id: dto.task_id, comment: dto.comment },
        actor,
        scope,
      );
    }

    const otherHours = await this.entries.sumHoursForUserOnDate(
      targetUserId,
      workDate,
    );
    const { total, abnormal } = checkDailyTotal(
      otherHours,
      dto.hours,
      dto.work_date,
    );

    const created = await this.entries.create({
      tenantId: actor.tenantId,
      projectId: dto.project_id,
      userId: targetUserId,
      taskId: dto.task_id ?? null,
      workDate,
      hours: dto.hours,
      hourlyRate: user.hourlyRate, // FROZEN — later salary changes never reach this row
      comment: dto.comment ?? null,
      createdBy: actor.userId,
    });
    const entity = toTimeEntryEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'time_entry',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    if (abnormal) {
      this.logger.warn(
        `Abnormal hours: user ${targetUserId} is at ${total.toFixed(2)}h on ${dto.work_date}`,
      );
      // TODO: step 13 — abnormal-hours alert to the manager
    }
    this.logger.info(`Time entry created: ${created.id}`);
    await this.margins.checkProjectThresholds(created.projectId, actor);
    return withDailyInfo(entity, total, abnormal);
  }
}
