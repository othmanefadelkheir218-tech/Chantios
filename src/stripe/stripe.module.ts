import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { STRIPE_WEBHOOKS_QUEUE } from './dto/webhook.dto';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';
import { HandleInvoiceUpcomingHandler } from './handlers/handle-invoice-upcoming.handler';
import { HandlePaymentFailedHandler } from './handlers/handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from './handlers/handle-payment-succeeded.handler';
import { HandleSubscriptionDeletedHandler } from './handlers/handle-subscription-deleted.handler';
import { ProcessWebhookHandler } from './handlers/process-webhook.handler';
import { PushOverageInvoiceItemHandler } from './handlers/push-overage-invoice-item.handler';
import { RecordWebhookEventHandler } from './handlers/record-webhook-event.handler';
import { StripeWebhookProcessor } from './processors/stripe-webhook.processor';
import { StripeEventRepository } from './repositories/stripe-event.repository';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

/**
 * `forwardRef` on `SubscriptionsModule`: the webhook handlers need
 * `SubscriptionsService` (to move a subscription to `active`/`past_due`/
 * `cancelled`), but `SubscriptionsModule` imports `PlansModule`, which
 * imports THIS module (for the plan-catalog Stripe calls, step 01) — a real
 * 3-module cycle. The async in-process event bus (`common/events`, used for
 * the `tenants` <-> `notifications` cycle in step 13) does not fit here: it
 * is fire-and-forget by design, and `ProcessWebhookHandler` needs the
 * handler's thrown error back, synchronously, to decide `markError` + retry.
 *
 * `forwardRef` on `NotificationsModule` too: it closes a SECOND, longer cycle
 * that isn't obvious from this file alone — `NotificationsModule` ->
 * `UsersModule` -> `SubscriptionsModule` -> `PlansModule` -> back to this
 * module. Node resolves every file's imports before Nest ever scans
 * anything, so whichever of these modules is required FIRST (in practice:
 * `AuthModule`, which imports `NotificationsModule` before `SubscriptionsModule`/
 * `PlansModule`) ends up requiring this file while `NotificationsModule` is
 * still mid-load — a plain (non-forwardRef) reference to it here would
 * freeze as `undefined` in this module's metadata. `forwardRef` defers the
 * read until Nest's own scanning phase, by which point every file has
 * finished loading.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: STRIPE_WEBHOOKS_QUEUE }),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => NotificationsModule),
    TenantsModule,
  ],
  controllers: [StripeController],
  providers: [
    StripeService,
    StripeEventRepository,
    CreatePlanPriceHandler,
    ArchivePlanPriceHandler,
    PushOverageInvoiceItemHandler,
    RecordWebhookEventHandler,
    ProcessWebhookHandler,
    HandlePaymentSucceededHandler,
    HandlePaymentFailedHandler,
    HandleSubscriptionDeletedHandler,
    HandleInvoiceUpcomingHandler,
    StripeWebhookProcessor,
  ],
  exports: [StripeService],
})
export class StripeModule {}
