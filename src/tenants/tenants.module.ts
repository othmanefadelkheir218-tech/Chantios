import { AdminUsersModule } from '../admin-users/admin-users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { OneTimeCodesModule } from '../one-time-codes/one-time-codes.module';
import { VatRatesModule } from '../vat-rates/vat-rates.module';
import { CheckVatNumberHandler } from './handlers/check-vat-number.handler';
import { PrepareTaxFieldsHandler } from './handlers/prepare-tax-fields.handler';
import { CreateTenantHandler } from './handlers/create-tenant.handler';
import { FindTenantHandler } from './handlers/find-tenant.handler';
import { FindTenantsHandler } from './handlers/find-tenants.handler';
import { RestoreTenantHandler } from './handlers/restore-tenant.handler';
import { RestoreTenantsHandler } from './handlers/restore-tenants.handler';
import { SendTenantVerificationEmailHandler } from './handlers/send-tenant-verification-email.handler';
import { SetTenantStatusHandler } from './handlers/set-tenant-status.handler';
import { SoftDeleteTenantHandler } from './handlers/soft-delete-tenant.handler';
import { SoftDeleteTenantsHandler } from './handlers/soft-delete-tenants.handler';
import { UpdateTenantProfileHandler } from './handlers/update-tenant-profile.handler';
import { UpdateTenantHandler } from './handlers/update-tenant.handler';
import { VerifyTenantEmailHandler } from './handlers/verify-tenant-email.handler';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [
    AdminUsersModule,
    SessionsModule,
    TokenModule,
    AuditModule,
    EmailModule,
    OneTimeCodesModule,
    // Step 27: the country must be an active country of the TVA table.
    VatRatesModule,
  ],
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantRepository,
    CreateTenantHandler,
    FindTenantsHandler,
    FindTenantHandler,
    UpdateTenantHandler,
    UpdateTenantProfileHandler,
    SetTenantStatusHandler,
    SoftDeleteTenantHandler,
    SoftDeleteTenantsHandler,
    RestoreTenantHandler,
    RestoreTenantsHandler,
    SendTenantVerificationEmailHandler,
    VerifyTenantEmailHandler,
    PrepareTaxFieldsHandler,
    CheckVatNumberHandler,
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
