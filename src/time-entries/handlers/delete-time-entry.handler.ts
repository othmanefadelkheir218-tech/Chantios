import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MarginsService } from '../../margins/margins.service';
import { toTimeEntryEntity } from '../helpers/time-entry.helper';
import { TimeEntryRepository } from '../repositories/time-entry.repository';

/**
 * `DELETE /api/time-entries/:id` — manager / admin only (scope `all`). An
 * employee never deletes an hour entry, even their own. The old value goes
 * to `audit_logs`.
 */
@Injectable()
export class DeleteTimeEntryHandler {
  constructor(
    @InjectPinoLogger(DeleteTimeEntryHandler.name)
    private readonly logger: PinoLogger,
    private readonly entries: TimeEntryRepository,
    private readonly audit: AuditService,
    private readonly margins: MarginsService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    this.logger.info(`Deleting time entry ${id}`);

    if (scope === 'own') {
      this.logger.warn(`User ${actor.userId} may not delete time entries`);
      throw new ForbiddenException(
        'Only a manager or an admin can delete a time entry',
      );
    }

    const current = await this.entries.findById(id);
    if (!current) {
      this.logger.warn(`Cannot delete time entry: ${id} not found`);
      throw new NotFoundException('Time entry not found');
    }

    await this.entries.delete(id);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'delete',
      entityType: 'time_entry',
      entityId: id,
      oldValue: toTimeEntryEntity(current),
      ipAddress: null,
    });
    this.logger.info(`Time entry deleted: ${id}`);
    // the cost fell: a level may no longer be reached, so it can fire again later
    await this.margins.checkProjectThresholds(current.projectId, actor);
    return { deleted: true, id };
  }
}
