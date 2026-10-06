import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RenameMediaDto } from '../dto/rename-media.dto';
import { toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/** `PATCH /api/media/:id` — `file_name` only. `file_url` is never touched. */
@Injectable()
export class RenameMediaHandler {
  constructor(
    @InjectPinoLogger(RenameMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: RenameMediaDto, actor: AuthenticatedUser) {
    const current = await this.media.findById(id);
    if (!current) {
      this.logger.warn(`Cannot rename media: ${id} not found`);
      throw new NotFoundException('Media not found');
    }

    const updated = await this.media.rename(id, dto.file_name);
    const entity = toMediaEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'rename',
      entityType: 'media',
      entityId: id,
      oldValue: toMediaEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Media renamed: id ${id}`);
    return entity;
  }
}
