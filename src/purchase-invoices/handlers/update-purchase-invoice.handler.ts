import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MarginsService } from '../../margins/margins.service';
import { CostTypesService } from '../../cost-types/cost-types.service';
import { ProjectsService } from '../../projects/projects.service';
import { SubcontractorsService } from '../../subcontractors/subcontractors.service';
import { assertNonNegativeAmount } from '../../subcontractors/helpers/contract.helper';
import { UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';
import {
  assertMaterialBillHasNoProject,
  computeBillAmounts,
  toPurchaseInvoiceEntity,
} from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/**
 * `PATCH /api/purchase-invoices/:id` — the two rules are re-checked against
 * the values that would RESULT (not just the ones sent), and the VAT figures
 * are recomputed whenever the amount or the rate changes.
 */
@Injectable()
export class UpdatePurchaseInvoiceHandler {
  constructor(
    @InjectPinoLogger(UpdatePurchaseInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: PurchaseInvoiceRepository,
    private readonly costTypes: CostTypesService,
    private readonly subcontractors: SubcontractorsService,
    private readonly projects: ProjectsService,
    private readonly audit: AuditService,
    private readonly margins: MarginsService,
  ) {}

  async execute(
    id: number,
    dto: UpdatePurchaseInvoiceDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Updating purchase invoice ${id}`);

    const current = await this.invoices.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update purchase invoice: ${id} not found`);
      throw new NotFoundException('Purchase invoice not found');
    }

    if (dto.amount_excl_vat !== undefined) {
      assertNonNegativeAmount(dto.amount_excl_vat);
    }

    const costTypeId = dto.cost_type_id ?? current.costTypeId;
    const projectId =
      dto.project_id !== undefined ? dto.project_id : current.projectId;

    const costType = await this.costTypes.findVisibleById(
      costTypeId,
      actor.tenantId,
    );
    if (!costType || !costType.isActive) {
      this.logger.warn(
        `Cannot update purchase invoice ${id}: cost type ${costTypeId} not found or inactive`,
      );
      throw new BadRequestException('Cost type not found or inactive');
    }
    assertMaterialBillHasNoProject(costType.name, projectId);

    if (current.type === 'subcontractor') {
      if (projectId == null) {
        throw new BadRequestException(
          'project_id is required for a subcontractor bill',
        );
      }
      const contract = await this.subcontractors.findContractByIdRaw(
        current.subcontractorContractId!,
      );
      if (contract && contract.projectId !== projectId) {
        throw new BadRequestException(
          "project_id must be the contract's project",
        );
      }
    }
    if (projectId != null && projectId !== current.projectId) {
      // Throws NotFoundException if the project does not belong to this tenant.
      await this.projects.findOne(projectId);
    }

    const data: Prisma.PurchaseInvoiceUncheckedUpdateInput = {
      ...(dto.cost_type_id !== undefined && { costTypeId: dto.cost_type_id }),
      ...(dto.project_id !== undefined && { projectId: dto.project_id }),
      ...(dto.external_number !== undefined && {
        externalNumber: dto.external_number,
      }),
      ...(dto.issue_date && { issueDate: new Date(dto.issue_date) }),
      ...(dto.due_date && { dueDate: new Date(dto.due_date) }),
      ...(dto.payment_reference !== undefined && {
        paymentReference: dto.payment_reference,
      }),
    };

    if (dto.amount_excl_vat !== undefined || dto.vat_rate !== undefined) {
      const vatRate = dto.vat_rate ?? current.vatRate;
      const amounts = computeBillAmounts(
        dto.amount_excl_vat ?? current.amountExclVat,
        vatRate,
      );
      Object.assign(data, {
        amountExclVat: amounts.amountExclVat,
        vatRate,
        vatAmount: amounts.vatAmount,
        amountInclVat: amounts.amountInclVat,
      });
    }

    const updated = await this.invoices.update(id, data);
    const entity = toPurchaseInvoiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'purchase_invoice',
      entityId: id,
      oldValue: toPurchaseInvoiceEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Purchase invoice updated: ${id}`);
    // The amount or the project may have changed: check the new project, and the old one if it moved.
    await this.margins.checkProjectThresholds(updated.projectId, actor);
    if (current.projectId !== updated.projectId) {
      await this.margins.checkProjectThresholds(current.projectId, actor);
    }
    return entity;
  }
}
