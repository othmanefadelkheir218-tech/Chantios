import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ReportAlertsJob } from '../src/reports/jobs/report-alerts.job';

/** Runs the daily site-report alert check (missing report, stalled progress) once, now — for manual testing. */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const result = await app.get(ReportAlertsJob).run();
  console.log(result);
  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Report alert check failed', err);
  process.exit(1);
});
