import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CleanupExpiredTokensJob } from '../src/auth/jobs/cleanup-expired-tokens.job';

/** Runs the daily token cleanup once, now — for manual testing. */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const result = await app.get(CleanupExpiredTokensJob).run();
  console.log(result);
  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Cleanup failed', err);
  process.exit(1);
});
