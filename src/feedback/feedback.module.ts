import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FindFeedbackHandler } from './handlers/find-feedback.handler';
import { UpdateFeedbackStatusHandler } from './handlers/update-feedback-status.handler';
import { FeedbackRepository } from './repositories/feedback.repository';

@Module({
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    FeedbackRepository,
    FindFeedbackHandler,
    UpdateFeedbackStatusHandler,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
