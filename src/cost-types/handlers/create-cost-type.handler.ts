import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CreateCostTypeDto } from '../dto/create-cost-type.dto';
import { toCostTypeEntity } from '../helpers/cost-type.helper';
import { CostTypeRepository } from '../repositories/cost-type.repository';

/**
 * `POST /api/cost-types` — admin only. Always this tenant's own row. The name
 * must not repeat a default or an own row: the margin groups by `cost_type_id`
 * and the `material` trigger reads the name, so a look-alike would confuse both.
 */
@Injectable()
export class CreateCostTypeHandler {
  constructor(
    @InjectPinoLogger(CreateCostTypeHandler.name)
    private readonly logger: PinoLogger,
    private readonly costTypes: CostTypeRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateCostTypeDto, actor: AuthenticatedUser) {
    const name = dto.name.trim();
    this.logger.info(`Creating cost type ${name} for tenant ${actor.tenantId}`);

    const existing = await this.costTypes.findByName(name, actor.tenantId);
    if (existing) {
      this.logger.warn(`Cannot create cost type: "${name}" already exists`);
      throw new ConflictException('A cost type with this name already exists');
    }

    const created = await this.costTypes.create({
      name,
      tenantId: actor.tenantId,
    });
    const entity = toCostTypeEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'cost_type',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Cost type created: ${created.id}`);
    return entity;
  }
}
