import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { FindReservationsQueryDto } from './dto/find-reservations-query.dto';
import { CheckCoverageHandler } from './handlers/check-coverage.handler';
import { ConsumeReservationHandler } from './handlers/consume-reservation.handler';
import { CreateReservationsHandler } from './handlers/create-reservations.handler';
import { FindMovementsHandler } from './handlers/find-movements.handler';
import { FindReservationsHandler } from './handlers/find-reservations.handler';
import { RecordAdjustmentHandler } from './handlers/record-adjustment.handler';
import { RecordConsumptionHandler } from './handlers/record-consumption.handler';
import { RecordPurchaseHandler } from './handlers/record-purchase.handler';
import { ReleaseReservationsHandler } from './handlers/release-reservations.handler';
import { RecipeLine } from './helpers/recipe.helper';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class StockService {
  constructor(
    private readonly recordPurchase: RecordPurchaseHandler,
    private readonly recordAdjustment: RecordAdjustmentHandler,
    private readonly recordConsumption: RecordConsumptionHandler,
    private readonly findMovements: FindMovementsHandler,
    private readonly findReservations: FindReservationsHandler,
    private readonly createReservations: CreateReservationsHandler,
    private readonly consumeReservation: ConsumeReservationHandler,
    private readonly releaseReservations: ReleaseReservationsHandler,
    private readonly checkCoverage: CheckCoverageHandler,
  ) {}

  purchase(dto: CreateMovementDto, actor: AuthenticatedUser) {
    return this.recordPurchase.execute(dto, actor);
  }

  adjust(dto: AdjustStockDto, actor: AuthenticatedUser) {
    return this.recordAdjustment.execute(dto, actor);
  }

  findAllMovements(query: FindMovementsQueryDto) {
    return this.findMovements.execute(query);
  }

  findAllReservations(query: FindReservationsQueryDto) {
    return this.findReservations.execute(query);
  }

  // ---- Internal API for other modules ----

  /** Step 06 (quote acceptance): reserve stock for an accepted quote's lines. */
  reserveForProject(
    projectId: number,
    lines: RecipeLine[],
    actor: AuthenticatedUser,
  ) {
    return this.createReservations.execute(projectId, lines, actor);
  }

  /** Step 09 (site report): declares material actually used on site. */
  declareConsumption(
    input: {
      materialId: number;
      projectId: number;
      reportId: number;
      quantity: string;
      unitPrice?: string;
    },
    actor: AuthenticatedUser,
  ) {
    return this.recordConsumption.execute(input, actor);
  }

  /** `projects`' `cancel-project.handler` calls this on cancellation. */
  releaseByProject(projectId: number, actor: AuthenticatedUser) {
    return this.releaseReservations.execute(projectId, actor);
  }

  /** The (currently soft-only) coverage check, exposed for other callers. */
  checkMaterialCoverage(materialId: number) {
    return this.checkCoverage.execute(materialId);
  }

  /** Lowers `remaining_quantity` directly — for a caller that already has the amount. */
  consumeReservationFor(
    projectId: number,
    materialId: number,
    quantity: string,
    actor: AuthenticatedUser,
  ) {
    return this.consumeReservation.execute(
      projectId,
      materialId,
      quantity,
      actor,
    );
  }
}
