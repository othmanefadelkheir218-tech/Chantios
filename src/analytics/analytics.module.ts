import { TokenModule } from '../auth/token.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsService } from './analytics.service';
import { ANALYTICS_QUEUE } from './dto/track-event.dto';
import { FindAnalyticsHandler } from './handlers/find-analytics.handler';
import { RecordEventHandler } from './handlers/record-event.handler';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Module({
  imports: [TokenModule, BullModule.registerQueue({ name: ANALYTICS_QUEUE })],
  controllers: [AnalyticsController],
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
