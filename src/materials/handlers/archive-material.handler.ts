import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toMaterialEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/** `DELETE /api/materials/:id` — sets `is_active = false`. Never a hard delete. */
@Injectable()
export class ArchiveMaterialHandler {
  constructor(
    @InjectPinoLogger(ArchiveMaterialHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving material ${id}`);

    const current = await this.materials.findById(id);
    if (!current) {
      this.logger.warn(`Cannot archive material: ${id} not found`);
      throw new NotFoundException('Material not found');
    }

    const updated = await this.materials.setActive(id, false);
    const entity = toMaterialEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'material',
      entityId: id,
      oldValue: toMaterialEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Material archived: ${id}`);
    return entity;
  }
}
