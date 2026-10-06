import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CategoriesService } from '../../categories/categories.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { toServiceEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

/** `POST /api/services` — `category_id` must be visible to this tenant (shared default or own). */
@Injectable()
export class CreateServiceHandler {
  constructor(
    @InjectPinoLogger(CreateServiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
    private readonly categories: CategoriesService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateServiceDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating service ${dto.description}`);

    const category = await this.categories.findVisibleById(
      dto.category_id,
      actor.tenantId,
    );
    if (!category) {
      this.logger.warn(
        `Cannot create service: category ${dto.category_id} not visible`,
      );
      throw new NotFoundException('Category not found');
    }

    const created = await this.services.create({
      categoryId: dto.category_id,
      description: dto.description,
      unit: dto.unit,
      priceExclVat: dto.price_excl_vat,
      defaultVatRate: dto.default_vat_rate ?? null,
      tenantId: actor.tenantId,
    });
    const entity = toServiceEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'service',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Service created: ${created.id}`);
    return entity;
  }
}
