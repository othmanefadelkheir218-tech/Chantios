import { AdminUsersModule } from '../admin-users/admin-users.module';
import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { ClientsModule } from '../clients/clients.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansModule } from '../plans/plans.module';
import { RolesModule } from '../roles/roles.module';
import { StripeModule } from '../stripe/stripe.module';
import { SubcontractorsModule } from '../subcontractors/subcontractors.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { VatRatesModule } from '../vat-rates/vat-rates.module';
import { TenantVatHandler } from './handlers/tenant-vat.handler';
import { SyncTenantTaxHandler } from './handlers/sync-tenant-tax.handler';
import { BILLING_TAX_SYNC_QUEUE } from './dto/tax-sync-job.dto';
import { TaxEventsListener } from './listeners/tax-events.listener';
import { TaxSyncProcessor } from './processors/tax-sync.processor';
import { AdminBillingController } from './admin-billing.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BILLING_RENEWAL_QUEUE } from './dto/renewal-job.dto';
import { ApplyPendingPlanIfDueHandler } from './handlers/apply-pending-plan-if-due.handler';
import { CountUsageHandler } from './handlers/count-usage.handler';
import { FindBillingHistoryHandler } from './handlers/find-billing-history.handler';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { MySubscriptionHandler } from './handlers/my-subscription.handler';
import { OpenPortalHandler } from './handlers/open-portal.handler';
import { RequestDowngradeHandler } from './handlers/request-downgrade.handler';
import { RunRenewalHandler } from './handlers/run-renewal.handler';
import { CancelCardSubscriptionHandler } from './handlers/cancel-card-subscription.handler';
import { StartCheckoutHandler } from './handlers/start-checkout.handler';
import { BlockExpiredGraceHandler } from './handlers/block-expired-grace.handler';
import { TrialReminderHandler } from './handlers/trial-reminder.handler';
import { UsageCounterHelper } from './helpers/usage-counter.helper';
import { RenewalProcessor } from './processors/renewal.processor';

/**
 * Tenant-facing subscription/usage/invoices + the renewal engine (step 14).
 * Never touches `tenant_subscriptions`/`plan_features`/`clients`/`users`/...
 * directly — only through `SubscriptionsService`/`PlansService`/`UsersService`/
 * `ClientsService`/`SubcontractorsService`/`MediaService`, per the cross-module rule.
 */
@Module({
  imports: [
    // These, alongside SubscriptionsModule below, are what `@TenantAuth()`'s
    // guards need to resolve their own dependencies (TokenHelper, RolesService,
    // TenantsService) — same imports as every other tenant-side module (e.g.
    // `clients`, `media`).
    TokenModule,
    RolesModule,
    TenantsModule,
    BullModule.registerQueue({ name: BILLING_RENEWAL_QUEUE }),
    BullModule.registerQueue({ name: BILLING_TAX_SYNC_QUEUE }),
    SubscriptionsModule,
    PlansModule,
    UsersModule,
    AdminUsersModule,
    ClientsModule,
    SubcontractorsModule,
    MediaModule,
    StripeModule,
    VatRatesModule,
    // The trial alerts (step 20). `forwardRef`: the same long cycle
    // `StripeModule` documents (Notifications -> ... -> this module).
    forwardRef(() => NotificationsModule),
  ],
  controllers: [BillingController, AdminBillingController],
  providers: [
    BillingService,
    UsageCounterHelper,
    CountUsageHandler,
    FindUsageHandler,
    FindBillingHistoryHandler,
    MySubscriptionHandler,
    RequestDowngradeHandler,
    ApplyPendingPlanIfDueHandler,
    RunRenewalHandler,
    TrialReminderHandler,
    BlockExpiredGraceHandler,
    StartCheckoutHandler,
    OpenPortalHandler,
    CancelCardSubscriptionHandler,
    TenantVatHandler,
    // Step 27 — TVA on the subscription, re-synced on Stripe in the background.
    SyncTenantTaxHandler,
    TaxEventsListener,
    TaxSyncProcessor,
    RenewalProcessor,
  ],
  // `UsageCounterHelper` is also used directly by `CronsModule` (step 16's
  // usage-spike cron) — the SAME live-usage computation the billing read and
  // the renewal snapshot already use, so all three can never disagree.
  exports: [BillingService, UsageCounterHelper],
})
export class BillingModule {}
