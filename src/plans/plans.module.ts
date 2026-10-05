import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { StripeModule } from '../stripe/stripe.module';
import { CreatePlanVersionHandler } from './handlers/create-plan-version.handler';
import { CreatePlanHandler } from './handlers/create-plan.handler';
import { DeactivatePlanHandler } from './handlers/deactivate-plan.handler';
import { FindPlanHandler } from './handlers/find-plan.handler';
import { FindPlansHandler } from './handlers/find-plans.handler';
import { SetDefaultPlanHandler } from './handlers/set-default-plan.handler';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlanRepository } from './repositories/plan.repository';

@Module({
  imports: [AuditModule, StripeModule],
  controllers: [PlansController],
  providers: [
    PlansService,
    PlanRepository,
    CreatePlanHandler,
    FindPlansHandler,
    FindPlanHandler,
    DeactivatePlanHandler,
    SetDefaultPlanHandler,
    CreatePlanVersionHandler,
  ],
  exports: [PlansService],
})
export class PlansModule {}
