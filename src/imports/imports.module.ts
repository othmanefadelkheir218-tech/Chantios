import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { MaterialsModule } from '../materials/materials.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { StockModule } from '../stock/stock.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { IMPORTS_QUEUE } from './dto/import-job.dto';
import { CreateImportHandler } from './handlers/create-import.handler';
import { FindImportsHandler } from './handlers/find-imports.handler';
import { RunImportHandler } from './handlers/run-import.handler';
import { RunMaterialsImportHandler } from './handlers/run-materials-import.handler';
import { RunStockImportHandler } from './handlers/run-stock-import.handler';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportProcessor } from './processors/import.processor';
import { ImportBatchRepository } from './repositories/import-batch.repository';

/**
 * Bulk import of materials and stock (doc/notes/Phaces/19-bulk-import.md).
 * Owns `import_batches` only: materials are written through
 * `MaterialsService`, movements through `StockService` — never their
 * repositories.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: IMPORTS_QUEUE }),
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    MaterialsModule,
    StockModule,
    NotificationsModule,
  ],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    ImportBatchRepository,
    CreateImportHandler,
    FindImportsHandler,
    RunImportHandler,
    RunMaterialsImportHandler,
    RunStockImportHandler,
    ImportProcessor,
  ],
})
export class ImportsModule {}
