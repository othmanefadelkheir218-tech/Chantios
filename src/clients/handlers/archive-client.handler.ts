import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toClientEntity } from '../helpers/clients.helper';
import { ClientRepository } from '../repositories/client.repository';

/**
 * `DELETE /api/clients/:id` — sets `is_active = false`. Never a hard
 * delete: invoices and projects point at this row.
 */
@Injectable()
export class ArchiveClientHandler {
  constructor(
    @InjectPinoLogger(ArchiveClientHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving client ${id}`);

    const current = await this.clients.findById(id);
    if (!current) {
      this.logger.warn(`Cannot archive client: ${id} not found`);
      throw new NotFoundException('Client not found');
    }

    const updated = await this.clients.setActive(id, false);
    const entity = toClientEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'client',
      entityId: id,
      oldValue: toClientEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Client archived: ${id}`);
    return entity;
  }
}
