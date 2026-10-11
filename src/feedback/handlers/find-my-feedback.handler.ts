import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FeedbackRepository } from '../repositories/feedback.repository';

/**
 * `GET /api/feedback/mine` — what the caller submitted, nothing else. The
 * tenant filter stays structural (the extension); the author filter is the
 * rule decided 2026-10-09: feedback is private to the person who wrote it.
 */
@Injectable()
export class FindMyFeedbackHandler {
  constructor(
    @InjectPinoLogger(FindMyFeedbackHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
  ) {}

  async execute({ page, limit }: PaginationQueryDto, actor: AuthenticatedUser) {
    this.logger.debug(
      `Listing feedback of user ${actor.userId} (page ${page}, limit ${limit})`,
    );
    const [data, total] = await this.feedback.findMine(
      { submittedBy: actor.userId },
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
