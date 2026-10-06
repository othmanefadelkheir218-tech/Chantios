import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ContractsController } from './contracts.controller';
import { ArchiveSubcontractorHandler } from './handlers/archive-subcontractor.handler';
import { CreateContractHandler } from './handlers/create-contract.handler';
import { CreateSubcontractorHandler } from './handlers/create-subcontractor.handler';
import { FindContractsHandler } from './handlers/find-contracts.handler';
import { FindSubcontractorsHandler } from './handlers/find-subcontractors.handler';
import { SetContractStatusHandler } from './handlers/set-contract-status.handler';
import { UpdateContractHandler } from './handlers/update-contract.handler';
import { UpdateSubcontractorHandler } from './handlers/update-subcontractor.handler';
import { ContractRepository } from './repositories/contract.repository';
import { SubcontractorRepository } from './repositories/subcontractor.repository';
import { SubcontractorsController } from './subcontractors.controller';
import { SubcontractorsService } from './subcontractors.service';

@Module({
  imports: [
    AuditModule,
    // Validates the contract's `project_id` through `ProjectsService`.
    ProjectsModule,
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [SubcontractorsController, ContractsController],
  providers: [
    SubcontractorsService,
    SubcontractorRepository,
    ContractRepository,
    CreateSubcontractorHandler,
    FindSubcontractorsHandler,
    UpdateSubcontractorHandler,
    ArchiveSubcontractorHandler,
    CreateContractHandler,
    FindContractsHandler,
    UpdateContractHandler,
    SetContractStatusHandler,
  ],
  // `purchase-invoices` reads a contract through `SubcontractorsService`.
  exports: [SubcontractorsService],
})
export class SubcontractorsModule {}
