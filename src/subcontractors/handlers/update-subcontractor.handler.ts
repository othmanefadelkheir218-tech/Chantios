import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { UpdateSubcontractorDto } from '../dto/update-subcontractor.dto';
import { toSubcontractorEntity } from '../helpers/subcontractor.helper';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/** `PATCH /api/subcontractors/:id` — editable. */
@Injectable()
export class UpdateSubcontractorHandler {
  constructor(
    @InjectPinoLogger(UpdateSubcontractorHandler.name)
    private readonly logger: PinoLogger,
    private readonly subcontractors: SubcontractorRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: UpdateSubcontractorDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Updating subcontractor ${id}`);

    const current = await this.subcontractors.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update subcontractor: ${id} not found`);
      throw new NotFoundException('Subcontractor not found');
    }

    const updated = await this.subcontractors.update(
      id,
      toCamelKeys<Prisma.SubcontractorUpdateInput>(dto),
    );
    const entity = toSubcontractorEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'subcontractor',
      entityId: id,
      oldValue: toSubcontractorEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Subcontractor updated: ${id}`);
    return entity;
  }
}
