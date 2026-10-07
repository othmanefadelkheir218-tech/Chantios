import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackHandler } from './handlers/create-feedback.handler';
import { FindFeedbackHandler } from './handlers/find-feedback.handler';
import { FindMyFeedbackHandler } from './handlers/find-my-feedback.handler';
import { UpdateFeedbackStatusHandler } from './handlers/update-feedback-status.handler';
import { FeedbackRepository } from './repositories/feedback.repository';
import { TenantFeedbackController } from './tenant-feedback.controller';

@Module({
  imports: [
    TokenModule,
    AuditModule,
    // These three, alongside TokenModule above, are what `@TenantAuth()`'s
    // guards need to resolve their own dependencies (RolesService,
    // SubscriptionsService, TenantsService) — same imports as every other
    // tenant-side module (e.g. `clients`, `media`).
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [FeedbackController, TenantFeedbackController],
  providers: [
    FeedbackService,
    FeedbackRepository,
    FindFeedbackHandler,
    UpdateFeedbackStatusHandler,
    CreateFeedbackHandler,
    FindMyFeedbackHandler,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
