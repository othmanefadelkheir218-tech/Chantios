import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ArchiveCategoryHandler } from './handlers/archive-category.handler';
import { CreateCategoryHandler } from './handlers/create-category.handler';
import { FindCategoriesHandler } from './handlers/find-categories.handler';
import { UpdateCategoryHandler } from './handlers/update-category.handler';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class CategoriesService {
  constructor(
    private readonly createCategory: CreateCategoryHandler,
    private readonly findCategories: FindCategoriesHandler,
    private readonly updateCategory: UpdateCategoryHandler,
    private readonly archiveCategory: ArchiveCategoryHandler,
  ) {}

  create(dto: CreateCategoryDto, actor: AuthenticatedUser) {
    return this.createCategory.execute(dto, actor);
  }

  findAll(tenantId: number) {
    return this.findCategories.execute(tenantId);
  }

  update(id: number, dto: UpdateCategoryDto, actor: AuthenticatedUser) {
    return this.updateCategory.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveCategory.execute(id, actor);
  }

  // ---- Internal API for other modules (`services`) ----

  /** Validates a `category_id`: a shared default or this tenant's own row. */
  findVisibleById(id: number, tenantId: number) {
    return this.findCategories.findVisibleById(id, tenantId);
  }
}
