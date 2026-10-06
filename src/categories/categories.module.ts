import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ArchiveCategoryHandler } from './handlers/archive-category.handler';
import { CreateCategoryHandler } from './handlers/create-category.handler';
import { FindCategoriesHandler } from './handlers/find-categories.handler';
import { UpdateCategoryHandler } from './handlers/update-category.handler';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [
    AuditModule,
    // These four are what `@TenantAuth()`'s guards need to resolve their own
    // dependencies — same imports as every other tenant-side module.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoryRepository,
    CreateCategoryHandler,
    FindCategoriesHandler,
    UpdateCategoryHandler,
    ArchiveCategoryHandler,
  ],
  // `services` imports this to validate `category_id` through
  // `CategoriesService` (never this module's repository).
  exports: [CategoriesService],
})
export class CategoriesModule {}
