import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MarginsService } from '../../margins/margins.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ServicesService } from '../../services/services.service';
import { assertPositiveQuantity } from '../../stock/helpers/stock.helper';
import { StockService } from '../../stock/stock.service';
import { DeclareMaterialsDto } from '../dto/declare-materials.dto';
import { assertCanPost } from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/**
 * `POST /api/reports/:id/materials` — **the stock door, the only way stock
 * leaves.** For each item it calls the stock SERVICE's `declareConsumption`
 * inside ONE transaction: a negative `consumption` row carrying
 * `project_id`, `report_id` and the frozen `unit_price`, then the matching
 * reservation's `remaining_quantity` drops. Any failure rolls back every item
 * — no half-applied stock.
 *
 * Consumption is never automatic: the recipe is the pre-fill (speed), the
 * supervisor's numbers are the truth. A wrong quantity is corrected by an
 * `adjustment` (step 05), never by editing the original row. Declaring twice
 * on a report adds more rows — the ledger is append-only.
 */
@Injectable()
export class DeclareMaterialsHandler {
  constructor(
    @InjectPinoLogger(DeclareMaterialsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly reports: ReportRepository,
    private readonly stock: StockService,
    private readonly services: ServicesService,
    private readonly audit: AuditService,
    private readonly margins: MarginsService,
  ) {}

  async execute(
    reportId: number,
    dto: DeclareMaterialsDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(
      `Declaring ${dto.items.length} material(s) on report ${reportId}`,
    );
    assertCanPost(scope);

    const report = await this.reports.findById(reportId);
    if (!report) {
      this.logger.warn(
        `Cannot declare materials: report ${reportId} not found`,
      );
      throw new NotFoundException('Report not found');
    }

    const ids = dto.items.map((item) => item.material_id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'A material can only appear once per declaration',
      );
    }
    for (const item of dto.items) {
      assertPositiveQuantity(item.quantity);
    }
    if (dto.service_id !== undefined) {
      // Throws NotFoundException if the service does not belong to this tenant.
      await this.services.findOne(dto.service_id);
    }

    const movements = await this.tenantPrisma.db.$transaction(async (tx) => {
      const rows = [];
      for (const item of dto.items) {
        rows.push(
          await this.stock.declareConsumption(
            {
              materialId: item.material_id,
              projectId: report.projectId,
              reportId: report.id,
              quantity: item.quantity,
            },
            actor,
            tx,
          ),
        );
      }
      return rows;
    });

    // After commit, once: a rolled-back declaration leaves no audit row.
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'declare_materials',
      entityType: 'report',
      entityId: reportId,
      newValue: {
        serviceId: dto.service_id ?? null,
        items: movements.map((m) => ({
          movementId: m.id,
          materialId: m.materialId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      },
      ipAddress: null,
    });
    this.logger.info(
      `${movements.length} consumption row(s) written for report ${reportId}`,
    );
    // Stock just left: low stock / reservation unmet, once per material.
    for (const item of dto.items) {
      await this.stock.checkMaterialCoverage(item.material_id, actor.tenantId);
    }
    // The material cost just rose: fire each alert level once, or reset one.
    await this.margins.checkProjectThresholds(report.projectId, actor);
    return { reportId, serviceId: dto.service_id ?? null, movements };
  }
}
