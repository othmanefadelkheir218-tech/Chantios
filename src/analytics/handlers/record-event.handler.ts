import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TrackEventInput } from '../dto/track-event.dto';
import { AnalyticsRepository } from '../repositories/analytics.repository';

@Injectable()
export class RecordEventHandler {
  constructor(
    @InjectPinoLogger(RecordEventHandler.name)
    private readonly logger: PinoLogger,
    private readonly analytics: AnalyticsRepository,
  ) {}

  /** Runs in the queue worker, never in the request that produced the event. */
  async execute(event: TrackEventInput): Promise<void> {
    this.logger.debug(`Recording event ${event.eventName}`);
    await this.analytics.create({
      tenantId: event.tenantId,
      userId: event.userId ?? null,
      eventName: event.eventName,
      payload: event.payload as Prisma.InputJsonValue | undefined,
    });
  }
}
