import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpireTokensJob } from '../src/portal/jobs/expire-tokens.job';

/** Runs the daily portal link expiry once, now — for manual testing. */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const result = await app.get(ExpireTokensJob).run();
  console.log(result);
  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Portal link expiry failed', err);
  process.exit(1);
});
