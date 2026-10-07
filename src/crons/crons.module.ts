import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansModule } from '../plans/plans.module';
import { PurchaseInvoicesModule } from '../purchase-invoices/purchase-invoices.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { UsersModule } from '../users/users.module';
import { BillingRenewalCron } from './billing-renewal.cron';
import { EndOfDayReminderCron } from './end-of-day-reminder.cron';
import { MissingTimesheetCron } from './missing-timesheet.cron';
import { PurchaseDueCron } from './purchase-due.cron';
import { RetentionCron } from './retention.cron';
import { StalledProjectCron } from './stalled-project.cron';
import { TaskStartingCron } from './task-starting.cron';
import { TenantRunner } from './tenant-runner.service';

/**
 * The schedulers that raise alerts across every company. They hold no
 * business rule of their own: each one asks a module's SERVICE for the rows
 * and hands them to `NotificationsService.dispatch`.
 *
 * Already running in their own module (not moved, to keep one copy of each):
 * late invoices (`invoices/jobs`), missing report + progress stalled
 * (`reports/jobs`), portal link expiry (`portal/jobs`), token cleanup
 * (`auth/jobs`), media purge (`media/jobs`).
 */
@Module({
  imports: [
    NotificationsModule,
    TenantsModule,
    UsersModule,
    PurchaseInvoicesModule,
    TimeEntriesModule,
    TasksModule,
    SubscriptionsModule,
    PlansModule,
    AnalyticsModule,
    BillingModule,
  ],
  providers: [
    TenantRunner,
    PurchaseDueCron,
    StalledProjectCron,
    TaskStartingCron,
    EndOfDayReminderCron,
    MissingTimesheetCron,
    RetentionCron,
    BillingRenewalCron,
  ],
})
export class CronsModule {}
