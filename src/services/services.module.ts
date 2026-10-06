import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { CategoriesModule } from '../categories/categories.module';
import { MaterialsModule } from '../materials/materials.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ArchiveServiceHandler } from './handlers/archive-service.handler';
import { CreateServiceHandler } from './handlers/create-service.handler';
import { FindServiceHandler } from './handlers/find-service.handler';
import { FindServicesHandler } from './handlers/find-services.handler';
import { GetRecipeHandler } from './handlers/get-recipe.handler';
import { SetRecipeHandler } from './handlers/set-recipe.handler';
import { UpdateServiceHandler } from './handlers/update-service.handler';
import { ServiceRepository } from './repositories/service.repository';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    // `create-service.handler` / `update-service.handler` validate
    // `category_id` through `CategoriesService` (never its repository).
    CategoriesModule,
    // `set-recipe.handler` validates each recipe `material_id` through
    // `MaterialsService` (never its repository).
    MaterialsModule,
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServiceRepository,
    CreateServiceHandler,
    FindServicesHandler,
    FindServiceHandler,
    UpdateServiceHandler,
    ArchiveServiceHandler,
    SetRecipeHandler,
    GetRecipeHandler,
  ],
  // `stock` imports this to walk the recipe (`create-reservations.handler`)
  // through `ServicesService`, never this module's repository.
  exports: [ServicesService],
})
export class ServicesModule {}
