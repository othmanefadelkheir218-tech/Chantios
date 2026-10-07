import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FeedbackRepository } from '../repositories/feedback.repository';

/** `GET /api/feedback/mine` — this tenant's own submissions, structurally (the extension). */
@Injectable()
export class FindMyFeedbackHandler {
  constructor(
    @InjectPinoLogger(FindMyFeedbackHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
  ) {}

  async execute({ page, limit }: PaginationQueryDto) {
    this.logger.debug(
      `Listing this tenant's feedback (page ${page}, limit ${limit})`,
    );
    const [data, total] = await this.feedback.findMine(
      {},
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
