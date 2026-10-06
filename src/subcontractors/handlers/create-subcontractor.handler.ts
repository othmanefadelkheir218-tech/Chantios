import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateSubcontractorDto } from '../dto/create-subcontractor.dto';
import { toSubcontractorEntity } from '../helpers/subcontractor.helper';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/** `POST /api/subcontractors` — phone format is checked in the DTO (and by the DB CHECK). `is_active = true`. */
@Injectable()
export class CreateSubcontractorHandler {
  constructor(
    @InjectPinoLogger(CreateSubcontractorHandler.name)
    private readonly logger: PinoLogger,
    private readonly subcontractors: SubcontractorRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateSubcontractorDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating subcontractor ${dto.company_name}`);

    const created = await this.subcontractors.create({
      ...toCamelKeys<Prisma.SubcontractorUncheckedCreateInput>(dto),
      tenantId: actor.tenantId,
      isActive: true,
    });
    const entity = toSubcontractorEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'subcontractor',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Subcontractor created: ${created.id}`);
    return entity;
  }
}
