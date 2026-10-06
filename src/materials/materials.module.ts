import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ArchiveMaterialHandler } from './handlers/archive-material.handler';
import { CreateMaterialHandler } from './handlers/create-material.handler';
import { FindLowStockHandler } from './handlers/find-low-stock.handler';
import { FindMaterialHandler } from './handlers/find-material.handler';
import { FindMaterialsHandler } from './handlers/find-materials.handler';
import { StockLevelHandler } from './handlers/stock-level.handler';
import { UpdateMaterialHandler } from './handlers/update-material.handler';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialRepository } from './repositories/material.repository';

@Module({
  imports: [
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [MaterialsController],
  providers: [
    MaterialsService,
    MaterialRepository,
    CreateMaterialHandler,
    FindMaterialsHandler,
    FindMaterialHandler,
    UpdateMaterialHandler,
    ArchiveMaterialHandler,
    StockLevelHandler,
    FindLowStockHandler,
  ],
  // `services` (recipe material validation) and `stock` (movements, coverage
  // checks) import this to reach `MaterialsService` — never this module's
  // repository.
  exports: [MaterialsService],
})
export class MaterialsModule {}
