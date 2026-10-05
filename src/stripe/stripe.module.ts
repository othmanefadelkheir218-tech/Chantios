import { Module } from '@nestjs/common';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  controllers: [StripeController],
  providers: [StripeService, CreatePlanPriceHandler, ArchivePlanPriceHandler],
  exports: [StripeService],
})
export class StripeModule {}
