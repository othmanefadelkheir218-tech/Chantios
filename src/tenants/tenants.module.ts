import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CreateTenantHandler } from './handlers/create-tenant.handler';
import { FindTenantHandler } from './handlers/find-tenant.handler';
import { FindTenantsHandler } from './handlers/find-tenants.handler';
import { SetTenantStatusHandler } from './handlers/set-tenant-status.handler';
import { UpdateTenantHandler } from './handlers/update-tenant.handler';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuditModule],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantRepository,
    CreateTenantHandler,
    FindTenantsHandler,
    FindTenantHandler,
    UpdateTenantHandler,
    SetTenantStatusHandler,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
