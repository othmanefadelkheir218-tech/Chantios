import { TokenModule } from '../auth/token.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_QUEUE } from './dto/track-event.dto';
import { FindAnalyticsHandler } from './handlers/find-analytics.handler';
import { RecordEventHandler } from './handlers/record-event.handler';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { TrackEventController } from './track-event.controller';

@Module({
  imports: [
    TokenModule,
    BullModule.registerQueue({ name: ANALYTICS_QUEUE }),
    // These three, alongside TokenModule above, are what `@TenantAuth()`'s
    // guards need to resolve their own dependencies (RolesService,
    // SubscriptionsService, TenantsService) — same imports as every other
    // tenant-side module (e.g. `clients`, `media`).
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [AnalyticsController, TrackEventController],
  providers: [
    AnalyticsService,
    AnalyticsRepository,
    AnalyticsProcessor,
    RecordEventHandler,
    FindAnalyticsHandler,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
