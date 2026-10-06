import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateCostTypeDto } from '../dto/update-cost-type.dto';
import { toCostTypeEntity } from '../helpers/cost-type.helper';
import { CostTypeRepository } from '../repositories/cost-type.repository';

/**
 * `PATCH /api/cost-types/:id` — admin only, own rows only. `findOwnById`
 * returns `null` for a `NULL`-tenant default (structurally, via the
 * tenant-scoped client) or another tenant's row — both become a 404.
 */
@Injectable()
export class UpdateCostTypeHandler {
  constructor(
    @InjectPinoLogger(UpdateCostTypeHandler.name)
    private readonly logger: PinoLogger,
    private readonly costTypes: CostTypeRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateCostTypeDto, actor: AuthenticatedUser) {
    const name = dto.name.trim();
    this.logger.info(`Updating cost type ${id}`);

    const current = await this.costTypes.findOwnById(id);
    if (!current) {
      this.logger.warn(
        `Cannot update cost type: ${id} not found among tenant ${actor.tenantId}'s own rows`,
      );
      throw new NotFoundException('Cost type not found');
    }

    const duplicate = await this.costTypes.findByName(name, actor.tenantId);
    if (duplicate && duplicate.id !== id) {
      this.logger.warn(
        `Cannot rename cost type ${id}: "${name}" already exists`,
      );
      throw new ConflictException('A cost type with this name already exists');
    }

    const updated = await this.costTypes.update(id, { name });
    const entity = toCostTypeEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'cost_type',
      entityId: id,
      oldValue: toCostTypeEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Cost type updated: ${id}`);
    return entity;
  }
}
