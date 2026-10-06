import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { toCategoryEntity } from '../helpers/category.helper';
import { CategoryRepository } from '../repositories/category.repository';

/**
 * `PATCH /api/categories/:id` — admin only, own rows only. `findOwnById`
 * returns `null` for a `NULL`-tenant shared default (structurally, via the
 * tenant-scoped client) or another tenant's row — both become a 404, which
 * is the "refused" response the step file's acceptance list asks for.
 */
@Injectable()
export class UpdateCategoryHandler {
  constructor(
    @InjectPinoLogger(UpdateCategoryHandler.name)
    private readonly logger: PinoLogger,
    private readonly categories: CategoryRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateCategoryDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating category ${id}`);

    const current = await this.categories.findOwnById(id);
    if (!current) {
      this.logger.warn(
        `Cannot update category: ${id} not found among tenant ${actor.tenantId}'s own rows`,
      );
      throw new NotFoundException('Category not found');
    }

    const updated = await this.categories.update(id, { name: dto.name });
    const entity = toCategoryEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'category',
      entityId: id,
      oldValue: toCategoryEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Category updated: ${id}`);
    return entity;
  }
}
