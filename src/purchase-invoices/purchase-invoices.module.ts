import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { CostTypesModule } from '../cost-types/cost-types.module';
import { DocumentsModule } from '../documents/documents.module';
import { MarginsModule } from '../margins/margins.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubcontractorsModule } from '../subcontractors/subcontractors.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CreatePurchaseInvoiceHandler } from './handlers/create-purchase-invoice.handler';
import { DueSoonHandler } from './handlers/due-soon.handler';
import { FindPurchaseInvoiceHandler } from './handlers/find-purchase-invoice.handler';
import { FindPurchaseInvoicesHandler } from './handlers/find-purchase-invoices.handler';
import { MarkPaidHandler } from './handlers/mark-paid.handler';
import { UpdatePurchaseInvoiceHandler } from './handlers/update-purchase-invoice.handler';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { PurchaseInvoiceRepository } from './repositories/purchase-invoice.repository';

@Module({
  imports: [
    AuditModule,
    DocumentsModule, // `PUR-` numbering through the shared counter
    CostTypesModule,
    SubcontractorsModule,
    SuppliersModule,
    ProjectsModule,
    MarginsModule, // the 80 % / 95 % check after every bill
    TenantsModule, // default VAT rate (also needed by the guards)
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
  ],
  controllers: [PurchaseInvoicesController],
  providers: [
    PurchaseInvoicesService,
    PurchaseInvoiceRepository,
    CreatePurchaseInvoiceHandler,
    FindPurchaseInvoicesHandler,
    FindPurchaseInvoiceHandler,
    UpdatePurchaseInvoiceHandler,
    MarkPaidHandler,
    DueSoonHandler,
  ],
  // Step 10 (margin) reads the bills grouped by cost type through this service.
  exports: [PurchaseInvoicesService],
})
export class PurchaseInvoicesModule {}
