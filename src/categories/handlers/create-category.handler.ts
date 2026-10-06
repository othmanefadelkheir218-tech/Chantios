import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { toCategoryEntity } from '../helpers/category.helper';
import { CategoryRepository } from '../repositories/category.repository';

/**
 * `POST /api/categories` — admin only. Always this tenant's own row (the
 * tenant extension injects `tenant_id`); only the deploy seed ever writes a
 * `NULL`-tenant shared default.
 */
@Injectable()
export class CreateCategoryHandler {
  constructor(
    @InjectPinoLogger(CreateCategoryHandler.name)
    private readonly logger: PinoLogger,
    private readonly categories: CategoryRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateCategoryDto, actor: AuthenticatedUser) {
    this.logger.info(
      `Creating category ${dto.name} for tenant ${actor.tenantId}`,
    );

    const created = await this.categories.create({
      name: dto.name,
      tenantId: actor.tenantId,
    });
    const entity = toCategoryEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'category',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Category created: ${created.id}`);
    return entity;
  }
}
