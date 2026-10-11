import { Module } from '@nestjs/common';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DevToolsController } from './dev-tools.controller';
import { DevToolsService } from './dev-tools.service';
import { DevToolsGuard } from './guards/dev-tools.guard';
import { RunJobHandler } from './handlers/run-job.handler';
import { SimulatePaymentHandler } from './handlers/simulate-payment.handler';

/**
 * Step 20 — super-admin test helpers. No repository: it only calls other
 * modules' services (and, through `ModuleRef`, the scheduled jobs and the
 * Stripe webhook handlers, which run the real logic). Off unless
 * `DEV_TOOLS=true` outside production.
 */
@Module({
  imports: [
    TokenModule,
    AdminUsersModule,
    AuditModule,
    SubscriptionsModule,
    PlansModule,
  ],
  controllers: [DevToolsController],
  providers: [
    DevToolsService,
    DevToolsGuard,
    RunJobHandler,
    SimulatePaymentHandler,
  ],
})
export class DevToolsModule {}
