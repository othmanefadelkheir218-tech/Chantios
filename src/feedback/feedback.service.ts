import { Injectable } from '@nestjs/common';
import { FeedbackStatus } from '@prisma/client';
import type { RequestActor } from '../common/decorators/actor.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FindFeedbackQueryDto } from './dto/find-feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { CreateFeedbackHandler } from './handlers/create-feedback.handler';
import { FindFeedbackHandler } from './handlers/find-feedback.handler';
import { FindMyFeedbackHandler } from './handlers/find-my-feedback.handler';
import { UpdateFeedbackStatusHandler } from './handlers/update-feedback-status.handler';
import { FeedbackRepository } from './repositories/feedback.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class FeedbackService {
  constructor(
    private readonly findFeedback: FindFeedbackHandler,
    private readonly updateFeedbackStatus: UpdateFeedbackStatusHandler,
    private readonly createFeedback: CreateFeedbackHandler,
    private readonly findMyFeedback: FindMyFeedbackHandler,
    private readonly feedback: FeedbackRepository,
  ) {}

  // ---- Platform side (step 01) ----

  findAll(query: FindFeedbackQueryDto) {
    return this.findFeedback.execute(query);
  }

  updateStatus(id: number, dto: UpdateFeedbackStatusDto, actor: RequestActor) {
    return this.updateFeedbackStatus.execute(id, dto, actor);
  }

  // ---- Tenant side (step 16) ----

  create(dto: CreateFeedbackDto, actor: AuthenticatedUser) {
    return this.createFeedback.execute(dto, actor);
  }

  findMine(query: PaginationQueryDto, actor: AuthenticatedUser) {
    return this.findMyFeedback.execute(query, actor);
  }

  // ---- Platform stats ----

  countByStatus(status: FeedbackStatus) {
    return this.feedback.countByStatus(status);
  }
}
