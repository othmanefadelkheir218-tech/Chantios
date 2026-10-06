import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PurgeExpiredMediaJob } from '../src/media/jobs/purge-expired-media.job';

/** Runs the daily media trash purge once, now — for manual testing. */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const result = await app.get(PurgeExpiredMediaJob).run();
  console.log(result);
  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Media purge failed', err);
  process.exit(1);
});
