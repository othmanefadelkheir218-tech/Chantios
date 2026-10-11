import type { Type } from '@nestjs/common';
import { CleanupExpiredTokensJob } from '../../auth/jobs/cleanup-expired-tokens.job';
import { BillingRenewalCron } from '../../crons/billing-renewal.cron';
import { EndOfDayReminderCron } from '../../crons/end-of-day-reminder.cron';
import { MissingTimesheetCron } from '../../crons/missing-timesheet.cron';
import { PurchaseDueCron } from '../../crons/purchase-due.cron';
import { RetentionCron } from '../../crons/retention.cron';
import { StalledProjectCron } from '../../crons/stalled-project.cron';
import { TaskStartingCron } from '../../crons/task-starting.cron';
import { TrialEndCron } from '../../crons/trial-end.cron';
import { UsageSpikeCron } from '../../crons/usage-spike.cron';
import { LateInvoicesJob } from '../../invoices/jobs/late-invoices.job';
import { PurgeExpiredMediaJob } from '../../media/jobs/purge-expired-media.job';
import { ExpireTokensJob } from '../../portal/jobs/expire-tokens.job';
import { ReportAlertsJob } from '../../reports/jobs/report-alerts.job';

/** Every nightly job has the same entry point: `run()`. */
export interface RunnableJob {
  run(): Promise<unknown>;
}

/**
 * The jobs the dev tools may start now, by name. Each is the REAL scheduled
 * class, so a run here does exactly what the night run does — same checks
 * against the real clock.
 */
export const DEV_JOBS: Record<string, Type<RunnableJob>> = {
  'billing-renewal': BillingRenewalCron,
  'trial-end': TrialEndCron,
  'late-invoices': LateInvoicesJob,
  'portal-expire': ExpireTokensJob,
  'report-alerts': ReportAlertsJob,
  'purchase-due': PurchaseDueCron,
  'stalled-project': StalledProjectCron,
  'task-starting': TaskStartingCron,
  'missing-timesheet': MissingTimesheetCron,
  'end-of-day-reminder': EndOfDayReminderCron,
  'usage-spike': UsageSpikeCron,
  retention: RetentionCron,
  'media-purge': PurgeExpiredMediaJob,
  'token-cleanup': CleanupExpiredTokensJob,
};

export const DEV_JOB_NAMES = Object.keys(DEV_JOBS);
