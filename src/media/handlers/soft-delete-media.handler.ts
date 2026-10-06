import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { splitLocked, toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `DELETE /api/media` — bulk, trash (sets `deleted_at`). ImageKit is left
 * untouched. A row where `is_locked = true` is skipped, not refused — the
 * rest of the batch proceeds (doc/notes/media-files.md).
 */
@Injectable()
export class SoftDeleteMediaHandler {
  constructor(
    @InjectPinoLogger(SoftDeleteMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(ids: number[], actor: AuthenticatedUser) {
    const rows = await this.media.findManyByIds(ids);
    const { eligible, skipped } = splitLocked(rows);
    const eligibleIds = eligible.map((row) => row.id);

    this.logger.info(
      `Soft-deleting ${eligibleIds.length} media row(s) (${skipped.length} locked skipped)`,
    );
    const deleted = await this.media.softDelete(eligibleIds);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'soft_delete_many',
      entityType: 'media',
      entityId: null,
      newValue: { ids: eligibleIds, skipped },
      ipAddress: null,
    });
    return {
      deleted: deleted.map(toMediaEntity),
      skipped,
    };
  }
}
