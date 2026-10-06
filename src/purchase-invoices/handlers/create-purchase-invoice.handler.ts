import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CostTypesService } from '../../cost-types/cost-types.service';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { SubcontractorsService } from '../../subcontractors/subcontractors.service';
import { assertNonNegativeAmount } from '../../subcontractors/helpers/contract.helper';
import { SuppliersService } from '../../suppliers/suppliers.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import {
  assertMaterialBillHasNoProject,
  assertSourcePairing,
  computeBillAmounts,
  toPurchaseInvoiceEntity,
} from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/**
 * `POST /api/purchase-invoices` — both kinds, one endpoint. Enforces the two
 * rules: (1) exactly one source, (2) a `material` bill carries no project
 * (a subcontractor bill must carry one). Takes `PUR-` from the shared counter
 * in the same transaction as the insert, and computes `vat_amount` /
 * `amount_incl_vat` (never sent by the caller).
 */
@Injectable()
export class CreatePurchaseInvoiceHandler {
  constructor(
    @InjectPinoLogger(CreatePurchaseInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly invoices: PurchaseInvoiceRepository,
    private readonly documents: DocumentsService,
    private readonly costTypes: CostTypesService,
    private readonly subcontractors: SubcontractorsService,
    private readonly suppliers: SuppliersService,
    private readonly projects: ProjectsService,
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreatePurchaseInvoiceDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating ${dto.type} purchase invoice`);

    assertNonNegativeAmount(dto.amount_excl_vat);
    assertSourcePairing(
      dto.type,
      dto.subcontractor_contract_id,
      dto.supplier_id,
      dto.project_id,
    );

    const costType = await this.costTypes.findVisibleById(
      dto.cost_type_id,
      actor.tenantId,
    );
    if (!costType || !costType.isActive) {
      this.logger.warn(
        `Cannot create purchase invoice: cost type ${dto.cost_type_id} not found or inactive`,
      );
      throw new BadRequestException('Cost type not found or inactive');
    }
    assertMaterialBillHasNoProject(costType.name, dto.project_id);

    if (dto.type === 'subcontractor') {
      const contract = await this.subcontractors.findContractByIdRaw(
        dto.subcontractor_contract_id!,
      );
      if (!contract) {
        this.logger.warn(
          `Cannot create purchase invoice: contract ${dto.subcontractor_contract_id} not found`,
        );
        throw new BadRequestException('Contract not found');
      }
      if (contract.projectId !== dto.project_id) {
        this.logger.warn(
          `Cannot create purchase invoice: contract ${contract.id} belongs to project ${contract.projectId}, not ${dto.project_id}`,
        );
        throw new BadRequestException(
          "project_id must be the contract's project",
        );
      }
    } else {
      const supplier = await this.suppliers.findByIdRaw(dto.supplier_id!);
      if (!supplier || !supplier.isActive) {
        this.logger.warn(
          `Cannot create purchase invoice: supplier ${dto.supplier_id} not found or archived`,
        );
        throw new BadRequestException('Supplier not found or archived');
      }
    }

    if (dto.project_id !== undefined) {
      // Throws NotFoundException if the project does not belong to this tenant.
      await this.projects.findOne(dto.project_id);
    }

    const vatRate =
      dto.vat_rate ??
      (await this.tenants.findOne(actor.tenantId)).defaultVatRate;
    const amounts = computeBillAmounts(dto.amount_excl_vat, vatRate);

    const created = await this.tenantPrisma.db.$transaction(async (tx) => {
      const number = await this.documents.allocateNumber(
        'purchase_invoice',
        tx,
      );
      return this.invoices.create(
        {
          tenantId: actor.tenantId,
          type: dto.type,
          costTypeId: dto.cost_type_id,
          subcontractorContractId: dto.subcontractor_contract_id ?? null,
          supplierId: dto.supplier_id ?? null,
          projectId: dto.project_id ?? null,
          externalNumber: dto.external_number ?? null,
          amountExclVat: amounts.amountExclVat,
          vatRate,
          vatAmount: amounts.vatAmount,
          amountInclVat: amounts.amountInclVat,
          issueDate: new Date(dto.issue_date),
          ...(dto.due_date && { dueDate: new Date(dto.due_date) }),
          status: 'to_pay',
          paymentReference: dto.payment_reference ?? null,
          createdBy: actor.userId,
        },
        number,
        tx,
      );
    });
    const entity = toPurchaseInvoiceEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'purchase_invoice',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Purchase invoice created: ${created.id} (${created.number})`,
    );
    return entity;
  }
}
