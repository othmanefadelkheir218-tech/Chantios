import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BillingService } from '../src/billing/billing.service';

/**
 * Step 27 (C6) — one time, after the TVA table is filled: puts the TVA on
 * every existing card subscription in Stripe (from its next invoice).
 * Companies with no TVA (no country / country not in the table) are listed,
 * not changed: fix their country, then run it again.
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const result = await app.get(BillingService).syncAllTax();
  console.log(`Synced:             ${result.synced.length} [${result.synced.join(', ')}]`);
  console.log(`No TVA (fix first): ${result.missing.length} [${result.missing.join(', ')}]`);
  console.log(`Stripe failed:      ${result.failed.length} [${result.failed.join(', ')}]`);
  console.log(`No Stripe customer: ${result.no_stripe_customer.length}`);
  await app.close();
  process.exit(result.failed.length > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error('TVA sync failed', err);
  process.exit(1);
});
