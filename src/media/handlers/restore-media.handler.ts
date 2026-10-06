import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `PATCH /api/media/restore` — bulk, clears `deleted_at`. A no-op on a
 * row that is already live (not in the matched set below).
 */
@Injectable()
export class RestoreMediaHandler {
  constructor(
    @InjectPinoLogger(RestoreMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(ids: number[], actor: AuthenticatedUser) {
    const rows = await this.media.findManyByIds(ids);
    const trashedIds = rows
      .filter((row) => row.deletedAt !== null)
      .map((row) => row.id);

    this.logger.info(`Restoring ${trashedIds.length} media row(s)`);
    const restored = await this.media.restore(trashedIds);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'restore_many',
      entityType: 'media',
      entityId: null,
      newValue: { ids: trashedIds },
      ipAddress: null,
    });
    return { restored: restored.map(toMediaEntity) };
  }
}
