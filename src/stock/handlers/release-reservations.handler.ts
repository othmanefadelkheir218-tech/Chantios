import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { StockReservationRepository } from '../repositories/stock-reservation.repository';

/**
 * Every `active` reservation of a project → `status = 'released'`,
 * `remaining_quantity = 0`. Called by `projects`' `cancel-project.handler`
 * through `StockService` (never this repository), the one piece of
 * cross-module wiring step 05 owns. Already-consumed movements are
 * untouched — this never reverses `stock_movements`.
 */
@Injectable()
export class ReleaseReservationsHandler {
  constructor(
    @InjectPinoLogger(ReleaseReservationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reservations: StockReservationRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(projectId: number, actor: AuthenticatedUser) {
    this.logger.info(`Releasing unused reservations for project ${projectId}`);

    const released = await this.reservations.releaseByProject(projectId);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'release_reservations',
      entityType: 'project',
      entityId: projectId,
      newValue: { released },
      ipAddress: null,
    });
    this.logger.info(
      `${released} reservation(s) released for project ${projectId}`,
    );
    return { projectId, released };
  }
}
