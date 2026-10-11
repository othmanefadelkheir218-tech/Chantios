import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { MediaModule } from '../media/media.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CompanyProfileService } from './company-profile.service';
import { GetCompanyProfileHandler } from './handlers/get-company-profile.handler';
import { TenantProfileController } from './tenant-profile.controller';

/**
 * Step 18 — `GET` / `PATCH /api/tenant`. No repository: tenant data through
 * `TenantsService`, the logo URL through `MediaService`. Token, Roles and
 * Subscriptions are what `@TenantAuth()`'s guards need.
 */
@Module({
  imports: [
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    MediaModule,
  ],
  controllers: [TenantProfileController],
  providers: [CompanyProfileService, GetCompanyProfileHandler],
})
export class CompanyProfileModule {}
