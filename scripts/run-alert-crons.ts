import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EndOfDayReminderCron } from '../src/crons/end-of-day-reminder.cron';
import { MissingTimesheetCron } from '../src/crons/missing-timesheet.cron';
import { PurchaseDueCron } from '../src/crons/purchase-due.cron';
import { RetentionCron } from '../src/crons/retention.cron';
import { StalledProjectCron } from '../src/crons/stalled-project.cron';
import { TaskStartingCron } from '../src/crons/task-starting.cron';
import { UsageSpikeCron } from '../src/crons/usage-spike.cron';
import { LateInvoicesJob } from '../src/invoices/jobs/late-invoices.job';
import { ReportAlertsJob } from '../src/reports/jobs/report-alerts.job';

/**
 * Runs ONE alert cron once, now — for manual testing:
 *   yarn job:alerts <name> [ISO moment]
 * The optional moment fakes "now" for the crons that read the wall clock
 * (end-of-day-reminder, missing-timesheet, retention), e.g.
 *   yarn job:alerts end-of-day-reminder 2026-01-15T17:05:00Z
 */
async function main(): Promise<void> {
  const [name, iso] = process.argv.slice(2);
  const now = iso ? new Date(iso) : undefined;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const runners: Record<string, () => Promise<unknown>> = {
    'end-of-day-reminder': () => app.get(EndOfDayReminderCron).run(now),
    'missing-timesheet': () => app.get(MissingTimesheetCron).run(now),
    'stalled-project': () => app.get(StalledProjectCron).run(),
    'task-starting': () => app.get(TaskStartingCron).run(),
    'purchase-due': () => app.get(PurchaseDueCron).run(),
    retention: () => app.get(RetentionCron).run(now),
    'usage-spike': () => app.get(UsageSpikeCron).run(),
    'late-invoices': () => app.get(LateInvoicesJob).run(),
    'report-alerts': () => app.get(ReportAlertsJob).run(),
  };
  const run = runners[name];
  if (!run) {
    console.error(
      `Unknown cron "${name}". One of: ${Object.keys(runners).join(', ')}`,
    );
    await app.close();
    process.exit(1);
  }
  console.log(await run());
  // give the notification queue a moment to take the jobs before the process ends
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Alert cron failed', err);
  process.exit(1);
});
