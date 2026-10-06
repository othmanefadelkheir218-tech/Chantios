import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toCategoryEntity } from '../helpers/category.helper';
import { CategoryRepository } from '../repositories/category.repository';

/** `GET /api/categories` — shared defaults plus this tenant's own rows. */
@Injectable()
export class FindCategoriesHandler {
  constructor(
    @InjectPinoLogger(FindCategoriesHandler.name)
    private readonly logger: PinoLogger,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(tenantId: number) {
    this.logger.debug(`Listing categories visible to tenant ${tenantId}`);
    const rows = await this.categories.findVisible(tenantId);
    return rows.map(toCategoryEntity);
  }

  /** Internal API for other modules (`services`) to validate a `category_id`. */
  async findVisibleById(id: number, tenantId: number) {
    return this.categories.findVisibleById(id, tenantId);
  }
}
