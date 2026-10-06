import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CostTypesController } from './cost-types.controller';
import { CostTypesService } from './cost-types.service';
import { CreateCostTypeHandler } from './handlers/create-cost-type.handler';
import { FindCostTypesHandler } from './handlers/find-cost-types.handler';
import { UpdateCostTypeHandler } from './handlers/update-cost-type.handler';
import { CostTypeRepository } from './repositories/cost-type.repository';

@Module({
  imports: [
    AuditModule,
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [CostTypesController],
  providers: [
    CostTypesService,
    CostTypeRepository,
    CreateCostTypeHandler,
    FindCostTypesHandler,
    UpdateCostTypeHandler,
  ],
  // `purchase-invoices` validates `cost_type_id` through `CostTypesService`.
  exports: [CostTypesService],
})
export class CostTypesModule {}
