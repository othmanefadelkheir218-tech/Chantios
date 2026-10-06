import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StockService } from '../../stock/stock.service';
import { MaterialPrefillQueryDto } from '../dto/material-prefill-query.dto';
import { assertCanPost } from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/**
 * `GET /api/reports/:id/material-prefill?service_id=&quantity=` — a READ. It
 * walks the service's recipe through the stock SERVICE (`quantity ×
 * quantity_per_unit` per material) and saves nothing. The supervisor edits
 * the numbers to the real ones, then posts them to `/materials`.
 */
@Injectable()
export class PrefillMaterialsHandler {
  constructor(
    @InjectPinoLogger(PrefillMaterialsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly stock: StockService,
  ) {}

  async execute(
    reportId: number,
    query: MaterialPrefillQueryDto,
    scope: PermissionScope,
  ) {
    this.logger.info(
      `Pre-filling materials for report ${reportId}: service ${query.service_id} x ${query.quantity}`,
    );
    assertCanPost(scope);

    const report = await this.reports.findById(reportId);
    if (!report) {
      this.logger.warn(`Cannot pre-fill: report ${reportId} not found`);
      throw new NotFoundException('Report not found');
    }
    if (Number(query.quantity) <= 0) {
      throw new BadRequestException('quantity must be positive');
    }

    const items = await this.stock.walkRecipeFor([
      { serviceId: query.service_id, quantity: query.quantity },
    ]);
    return {
      reportId,
      serviceId: query.service_id,
      items,
    };
  }
}
