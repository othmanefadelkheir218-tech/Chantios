import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { FindAnalyticsQueryDto } from './dto/find-analytics-query.dto';
import {
  ANALYTICS_QUEUE,
  TrackEventDto,
  TrackEventInput,
} from './dto/track-event.dto';
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

  /**
   * `POST /api/analytics/track` (step 16) — any authenticated tenant user.
   * A straight translation of the validated body into a `TrackEventInput`,
   * no business decision to make (same spirit as `track()` itself having no
   * handler of its own): reuses the SAME fire-and-forget emitter above, so
   * there is exactly one queueing implementation, not two.
   */
  trackEvent(dto: TrackEventDto, actor: AuthenticatedUser): void {
    this.track({
      tenantId: actor.tenantId,
      userId: actor.userId,
      eventName: dto.event_name,
      payload: dto.payload,
    });
  }

  findAll(query: FindAnalyticsQueryDto) {
    return this.findAnalytics.execute(query);
  }
}
