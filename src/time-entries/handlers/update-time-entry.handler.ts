import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TasksService } from '../../tasks/tasks.service';
import { UpdateTimeEntryDto } from '../dto/update-time-entry.dto';
import { checkDailyTotal } from '../helpers/daily-hours.helper';
import {
  assertHoursRange,
  assertTaskInProject,
  toTimeEntryEntity,
  toUtcDay,
  withDailyInfo,
} from '../helpers/time-entry.helper';
import { TimeEntryRepository } from '../repositories/time-entry.repository';

/**
 * `PATCH /api/time-entries/:id` — the correction rules.
 *  - an employee with scope `own` may edit only THEIR entry, only on the day
 *    it was entered, and only if nobody else touched it (read from the audit
 *    trail). After that it is read-only to them;
 *  - a manager / admin (scope `all`) may edit any entry, any time;
 *  - the old value goes to `audit_logs`;
 *  - the daily-hours rule runs again, EXCLUDING the row being edited;
 *  - `hourly_rate` stays frozen — a correction never re-prices past hours.
 */
@Injectable()
export class UpdateTimeEntryHandler {
  constructor(
    @InjectPinoLogger(UpdateTimeEntryHandler.name)
    private readonly logger: PinoLogger,
    private readonly entries: TimeEntryRepository,
    private readonly tasks: TasksService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: UpdateTimeEntryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(`Updating time entry ${id}`);

    const current = await this.entries.findById(id);
    // A role with scope `own` never learns that someone else's entry exists.
    if (!current || (scope === 'own' && current.userId !== actor.userId)) {
      this.logger.warn(`Cannot update time entry: ${id} not found`);
      throw new NotFoundException('Time entry not found');
    }

    if (scope === 'own') {
      if (toUtcDay(current.createdAt) !== toUtcDay(new Date())) {
        this.logger.warn(`Time entry ${id} is past its edit day`);
        throw new ForbiddenException(
          'This entry is read-only: you can only edit it on the day you entered it',
        );
      }
      const touched = await this.audit.wasTouchedByOthers(
        actor.tenantId,
        'time_entry',
        id,
        actor.userId,
      );
      if (touched) {
        this.logger.warn(`Time entry ${id} was touched by someone else`);
        throw new ForbiddenException(
          'This entry was changed by someone else and is now read-only to you',
        );
      }
    }

    const hours = dto.hours ?? current.hours.toString();
    assertHoursRange(hours);

    if (dto.task_id) {
      assertTaskInProject(
        await this.tasks.findByIdRaw(dto.task_id),
        current.projectId,
      );
    }

    const workDay = toUtcDay(current.workDate);
    const otherHours = await this.entries.sumHoursForUserOnDate(
      current.userId,
      current.workDate,
      id, // the row being edited is not counted against itself
    );
    const { total, abnormal } = checkDailyTotal(otherHours, hours, workDay);

    const data: Prisma.TimeEntryUncheckedUpdateInput = {
      hours,
      ...(dto.task_id !== undefined && { taskId: dto.task_id }),
      ...(dto.comment !== undefined && { comment: dto.comment }),
    };
    const updated = await this.entries.update(id, data);
    const entity = toTimeEntryEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'time_entry',
      entityId: id,
      oldValue: toTimeEntryEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    if (abnormal) {
      this.logger.warn(
        `Abnormal hours: user ${current.userId} is at ${total.toFixed(2)}h on ${workDay}`,
      );
      // TODO: step 13 — abnormal-hours alert to the manager
    }
    this.logger.info(`Time entry updated: ${id}`);
    return withDailyInfo(entity, total, abnormal);
  }
}
