import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ArchiveSupplierHandler } from './handlers/archive-supplier.handler';
import { CreateSupplierHandler } from './handlers/create-supplier.handler';
import { FindSuppliersHandler } from './handlers/find-suppliers.handler';
import { UpdateSupplierHandler } from './handlers/update-supplier.handler';
import { SupplierRepository } from './repositories/supplier.repository';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [
    AuditModule,
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    SupplierRepository,
    CreateSupplierHandler,
    FindSuppliersHandler,
    UpdateSupplierHandler,
    ArchiveSupplierHandler,
  ],
  // `purchase-invoices` validates `supplier_id` through `SuppliersService`.
  exports: [SuppliersService],
})
export class SuppliersModule {}
