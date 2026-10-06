import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CategoriesService } from '../../categories/categories.service';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { toServiceEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

@Injectable()
export class UpdateServiceHandler {
  constructor(
    @InjectPinoLogger(UpdateServiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
    private readonly categories: CategoriesService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateServiceDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating service ${id}`);

    const current = await this.services.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update service: ${id} not found`);
      throw new NotFoundException('Service not found');
    }
    if (dto.category_id !== undefined) {
      const category = await this.categories.findVisibleById(
        dto.category_id,
        actor.tenantId,
      );
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updated = await this.services.update(id, {
      ...(dto.category_id !== undefined && { categoryId: dto.category_id }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.price_excl_vat !== undefined && {
        priceExclVat: dto.price_excl_vat,
      }),
      ...(dto.default_vat_rate !== undefined && {
        defaultVatRate: dto.default_vat_rate,
      }),
    });
    const entity = toServiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'service',
      entityId: id,
      oldValue: toServiceEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Service updated: ${id}`);
    return entity;
  }
}
