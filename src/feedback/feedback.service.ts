import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FindFeedbackQueryDto } from './dto/find-feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { CreateFeedbackHandler } from './handlers/create-feedback.handler';
import { FindFeedbackHandler } from './handlers/find-feedback.handler';
import { FindMyFeedbackHandler } from './handlers/find-my-feedback.handler';
import { UpdateFeedbackStatusHandler } from './handlers/update-feedback-status.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly findFeedback: FindFeedbackHandler,
    private readonly updateFeedbackStatus: UpdateFeedbackStatusHandler,
    private readonly createFeedback: CreateFeedbackHandler,
    private readonly findMyFeedback: FindMyFeedbackHandler,
  ) {}

  // ---- Platform side (step 01) ----

  findAll(query: FindFeedbackQueryDto) {
    return this.findFeedback.execute(query);
  }

  updateStatus(id: number, dto: UpdateFeedbackStatusDto) {
    return this.updateFeedbackStatus.execute(id, dto);
  }

  // ---- Tenant side (step 16) ----

  create(dto: CreateFeedbackDto, actor: AuthenticatedUser) {
    return this.createFeedback.execute(dto, actor);
  }

  findMine(query: PaginationQueryDto) {
    return this.findMyFeedback.execute(query);
  }
}
