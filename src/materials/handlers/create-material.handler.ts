import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CreateMaterialDto } from '../dto/create-material.dto';
import {
  assertNonNegative,
  toMaterialEntity,
} from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/** `POST /api/materials`. No quantity field here — `materials` never stores one. */
@Injectable()
export class CreateMaterialHandler {
  constructor(
    @InjectPinoLogger(CreateMaterialHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateMaterialDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating material ${dto.description}`);
    assertNonNegative(dto.purchase_price, 'purchase_price');
    assertNonNegative(dto.minimum_stock, 'minimum_stock');

    const created = await this.materials.create({
      description: dto.description,
      unit: dto.unit,
      purchasePrice: dto.purchase_price,
      minimumStock: dto.minimum_stock,
      tenantId: actor.tenantId,
    });
    const entity = toMaterialEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'material',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Material created: ${created.id}`);
    return entity;
  }
}
