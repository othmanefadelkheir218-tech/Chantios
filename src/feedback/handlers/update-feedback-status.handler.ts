import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UpdateFeedbackStatusDto } from '../dto/update-feedback-status.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class UpdateFeedbackStatusHandler {
  constructor(
    @InjectPinoLogger(UpdateFeedbackStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
  ) {}

  async execute(id: number, { status }: UpdateFeedbackStatusDto) {
    this.logger.info(`Setting feedback ${id} to ${status}`);

    if (!(await this.feedback.findById(id))) {
      this.logger.warn(`Cannot update feedback: ${id} not found`);
      throw new NotFoundException('Feedback not found');
    }
    const updated = await this.feedback.updateStatus(id, status);
    this.logger.info(`Feedback ${id} is now ${status}`);
    return updated;
  }
}
