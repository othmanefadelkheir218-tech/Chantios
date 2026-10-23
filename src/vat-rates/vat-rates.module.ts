import { Module } from '@nestjs/common';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { CheckCountryHandler } from './handlers/check-country.handler';
import { CreateVatRateHandler } from './handlers/create-vat-rate.handler';
import { ResolveTenantVatHandler } from './handlers/resolve-tenant-vat.handler';
import { UpdateVatRateHandler } from './handlers/update-vat-rate.handler';
import { VatRateRepository } from './repositories/vat-rate.repository';
import { VatRatesPublicController } from './vat-rates-public.controller';
import { VatRatesAdminService } from './vat-rates-admin.service';
import { VatRatesController } from './vat-rates.controller';
import { VatRatesService } from './vat-rates.service';

/**
 * Step 27 — the TVA on the subscription (doc/notes/Phaces/27-subscription-tva.md).
 *
 * No import of `StripeModule` or `SubscriptionsModule`: `TenantsModule` and
 * `AuthModule` import this module (country check), and both of those reach
 * `TenantsModule` again — a file-load cycle that leaves an import `undefined`.
 * The two admin write handlers get `StripeService` / `SubscriptionsService`
 * through `ModuleRef` at run time instead (same as `HandleInvoicePaidHandler`).
 */
@Module({
  imports: [TokenModule, AuditModule, AdminUsersModule],
  controllers: [VatRatesController, VatRatesPublicController],
  providers: [
    VatRatesService,
    VatRatesAdminService,
    VatRateRepository,
    CreateVatRateHandler,
    UpdateVatRateHandler,
    ResolveTenantVatHandler,
    CheckCountryHandler,
  ],
  exports: [VatRatesService],
})
export class VatRatesModule {}
