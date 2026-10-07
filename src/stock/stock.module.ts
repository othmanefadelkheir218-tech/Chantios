import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { MaterialsModule } from '../materials/materials.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { ServicesModule } from '../services/services.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CheckCoverageHandler } from './handlers/check-coverage.handler';
import { ConsumeReservationHandler } from './handlers/consume-reservation.handler';
import { CreateReservationsHandler } from './handlers/create-reservations.handler';
import { FindMovementsHandler } from './handlers/find-movements.handler';
import { FindReservationsHandler } from './handlers/find-reservations.handler';
import { RecordAdjustmentHandler } from './handlers/record-adjustment.handler';
import { RecordConsumptionHandler } from './handlers/record-consumption.handler';
import { RecordPurchaseHandler } from './handlers/record-purchase.handler';
import { ReleaseReservationsHandler } from './handlers/release-reservations.handler';
import { WalkRecipeHandler } from './handlers/walk-recipe.handler';
import { StockMovementRepository } from './repositories/stock-movement.repository';
import { StockReservationRepository } from './repositories/stock-reservation.repository';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    // `record-purchase` / `record-adjustment` / `record-consumption` look up
    // the material (price, existence) through `MaterialsService`;
    // `check-coverage` reads the live stock level the same way — never this
    // module reaching into `materials`' repository.
    MaterialsModule,
    NotificationsModule, // low_stock / reservation_unmet from `check-coverage`
    // `create-reservations.handler` walks the recipe through
    // `ServicesService` (never its repository).
    ServicesModule,
  ],
  controllers: [StockController],
  providers: [
    StockService,
    StockMovementRepository,
    StockReservationRepository,
    RecordPurchaseHandler,
    RecordAdjustmentHandler,
    RecordConsumptionHandler,
    FindMovementsHandler,
    FindReservationsHandler,
    CreateReservationsHandler,
    ConsumeReservationHandler,
    ReleaseReservationsHandler,
    CheckCoverageHandler,
    WalkRecipeHandler,
  ],
  // `projects` imports this to call `releaseByProject` on cancellation
  // (through `StockService`, never this module's repositories) — the one
  // piece of cross-module wiring step 05 owns. Step 06/09 will import it too.
  exports: [StockService],
})
export class StockModule {}
