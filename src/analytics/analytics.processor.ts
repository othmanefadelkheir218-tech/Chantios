import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ANALYTICS_QUEUE, TrackEventInput } from './dto/track-event.dto';
import { RecordEventHandler } from './handlers/record-event.handler';

/** Takes events off the queue and hands each one to the handler. */
@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  constructor(private readonly recordEvent: RecordEventHandler) {
    super();
  }

  async process(job: Job<TrackEventInput>): Promise<void> {
    await this.recordEvent.execute(job.data);
  }
}
