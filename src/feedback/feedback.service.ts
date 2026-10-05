import { Injectable } from '@nestjs/common';
import { FindFeedbackQueryDto } from './dto/find-feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FindFeedbackHandler } from './handlers/find-feedback.handler';
import { UpdateFeedbackStatusHandler } from './handlers/update-feedback-status.handler';

/**
 * Orchestration only. Admin side for now: the tenant side
 * (`POST /api/feedback`) waits for step 02, which brings logged-in users.
 */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly findFeedback: FindFeedbackHandler,
    private readonly updateFeedbackStatus: UpdateFeedbackStatusHandler,
  ) {}

  findAll(query: FindFeedbackQueryDto) {
    return this.findFeedback.execute(query);
  }

  updateStatus(id: string, dto: UpdateFeedbackStatusDto) {
    return this.updateFeedbackStatus.execute(id, dto);
  }
}
