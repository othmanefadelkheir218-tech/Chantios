import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FindAnalyticsQueryDto } from './dto/find-analytics-query.dto';
import { ANALYTICS_QUEUE, TrackEventInput } from './dto/track-event.dto';
import { FindAnalyticsHandler } from './handlers/find-analytics.handler';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectPinoLogger(AnalyticsService.name)
    private readonly logger: PinoLogger,
    @InjectQueue(ANALYTICS_QUEUE) private readonly queue: Queue,
    private readonly findAnalytics: FindAnalyticsHandler,
    private readonly analytics: AnalyticsRepository,
  ) {}

  /**
   * Fire-and-forget: puts the event on the queue and returns at once.
   * It never throws and never makes the caller wait — an analytics problem
   * must not break the real action that produced the event.
   */
  track(event: TrackEventInput): void {
    this.queue
      .add('track', event, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      })
      .catch((error: unknown) =>
        this.logger.warn(
          `Analytics event ${event.eventName} dropped: ${String(error)}`,
        ),
      );
  }

  /** Retention cron: deletes this company's events older than `before`. */
  purgeBefore(tenantId: number, before: Date): Promise<number> {
    return this.analytics.deleteOlderThan(tenantId, before);
  }

  findAll(query: FindAnalyticsQueryDto) {
    return this.findAnalytics.execute(query);
  }
}
