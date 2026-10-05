import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindFeedbackQueryDto } from '../dto/find-feedback-query.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FindFeedbackHandler {
  constructor(
    @InjectPinoLogger(FindFeedbackHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
  ) {}

  async execute({
    page,
    limit,
    status,
    type,
    tenant_id,
  }: FindFeedbackQueryDto) {
    this.logger.debug(`Listing feedback (page ${page}, limit ${limit})`);

    const where: Prisma.FeedbackWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(tenant_id && { tenantId: tenant_id }),
    };
    const [data, total] = await this.feedback.findMany(
      where,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
