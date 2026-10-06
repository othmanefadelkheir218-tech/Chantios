import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toServiceEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

/** `DELETE /api/services/:id` — sets `is_active = false`. */
@Injectable()
export class ArchiveServiceHandler {
  constructor(
    @InjectPinoLogger(ArchiveServiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving service ${id}`);

    const current = await this.services.findById(id);
    if (!current) {
      this.logger.warn(`Cannot archive service: ${id} not found`);
      throw new NotFoundException('Service not found');
    }

    const updated = await this.services.setActive(id, false);
    const entity = toServiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'service',
      entityId: id,
      oldValue: toServiceEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Service archived: ${id}`);
    return entity;
  }
}
