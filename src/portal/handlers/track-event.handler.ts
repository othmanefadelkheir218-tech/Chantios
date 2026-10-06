import { Injectable } from '@nestjs/common';
import { PortalEventType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { PortalTrackingRepository } from '../repositories/portal-tracking.repository';

/**
 * One `portal_tracking` row per `view` / `download` — what lets staff say
 * "the client opened it 3 times and downloaded the quote once". It must never
 * break the client's request: a tracking failure is logged, not thrown.
 */
@Injectable()
export class TrackEventHandler {
  constructor(
    @InjectPinoLogger(TrackEventHandler.name)
    private readonly logger: PinoLogger,
    private readonly tracking: PortalTrackingRepository,
  ) {}

  async execute(
    portal: PortalContextData,
    eventType: PortalEventType,
  ): Promise<void> {
    try {
      await this.tracking.create({
        tenantId: portal.tenantId,
        portalTokenId: portal.tokenId,
        eventType,
        ipAddress: portal.ip,
      });
    } catch (err: unknown) {
      this.logger.error(
        { err },
        `Could not track a ${eventType} of portal link ${portal.tokenId}`,
      );
    }
  }
}
