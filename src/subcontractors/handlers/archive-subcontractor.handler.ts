import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toSubcontractorEntity } from '../helpers/subcontractor.helper';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/**
 * `DELETE /api/subcontractors/:id` — sets `is_active = false`. Never a hard
 * delete: contracts and their bills point at this row.
 */
@Injectable()
export class ArchiveSubcontractorHandler {
  constructor(
    @InjectPinoLogger(ArchiveSubcontractorHandler.name)
    private readonly logger: PinoLogger,
    private readonly subcontractors: SubcontractorRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving subcontractor ${id}`);

    const current = await this.subcontractors.findById(id);
    if (!current) {
      this.logger.warn(`Cannot archive subcontractor: ${id} not found`);
      throw new NotFoundException('Subcontractor not found');
    }

    const updated = await this.subcontractors.setActive(id, false);
    const entity = toSubcontractorEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'subcontractor',
      entityId: id,
      oldValue: toSubcontractorEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Subcontractor archived: ${id}`);
    return entity;
  }
}
