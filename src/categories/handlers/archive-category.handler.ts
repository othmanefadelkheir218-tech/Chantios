import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCategoryEntity } from '../helpers/category.helper';
import { CategoryRepository } from '../repositories/category.repository';

/**
 * `DELETE /api/categories/:id` — sets `is_active = false`. Admin only, own
 * rows only — same `findOwnById` guard as the update handler.
 */
@Injectable()
export class ArchiveCategoryHandler {
  constructor(
    @InjectPinoLogger(ArchiveCategoryHandler.name)
    private readonly logger: PinoLogger,
    private readonly categories: CategoryRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving category ${id}`);

    const current = await this.categories.findOwnById(id);
    if (!current) {
      this.logger.warn(
        `Cannot archive category: ${id} not found among tenant ${actor.tenantId}'s own rows`,
      );
      throw new NotFoundException('Category not found');
    }

    const updated = await this.categories.setActive(id, false);
    const entity = toCategoryEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'category',
      entityId: id,
      oldValue: toCategoryEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Category archived: ${id}`);
    return entity;
  }
}
