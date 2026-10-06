import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  PurchaseInvoice,
  PurchaseInvoiceStatus,
  PurchaseInvoiceType,
} from '@prisma/client';
import { MATERIAL_COST_TYPE_NAME } from '../../cost-types/helpers/cost-type.helper';
import { computeDocumentTotals } from '../../documents/helpers/document-totals.helper';

/** What may leave the module. Internal only — never shown to the client portal. */
export function toPurchaseInvoiceEntity(invoice: PurchaseInvoice) {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    type: invoice.type,
    costTypeId: invoice.costTypeId,
    subcontractorContractId: invoice.subcontractorContractId,
    supplierId: invoice.supplierId,
    projectId: invoice.projectId,
    number: invoice.number,
    externalNumber: invoice.externalNumber,
    amountExclVat: invoice.amountExclVat,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    amountInclVat: invoice.amountInclVat,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paymentReference: invoice.paymentReference,
    paidAt: invoice.paidAt,
    createdBy: invoice.createdBy,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

/**
 * Rule 1 — exactly one source (mirrors the `chk_purchase_one_source` DB
 * check, plus "a subcontractor bill needs a project"). Returns the message
 * of the first broken rule, or `null`. The DTO validator and the handler
 * both call this: one implementation, two layers (a clear message early,
 * the constraint makes it impossible).
 */
export function getSourcePairingError(
  type: PurchaseInvoiceType | undefined,
  contractId: number | null | undefined,
  supplierId: number | null | undefined,
  projectId: number | null | undefined,
): string | null {
  if (type === 'subcontractor') {
    if (contractId == null) {
      return 'subcontractor_contract_id is required for a subcontractor bill';
    }
    if (supplierId != null) {
      return 'a subcontractor bill cannot have a supplier_id';
    }
    if (projectId == null) {
      return 'project_id is required for a subcontractor bill';
    }
  }
  if (type === 'supplier') {
    if (supplierId == null) {
      return 'supplier_id is required for a supplier bill';
    }
    if (contractId != null) {
      return 'a supplier bill cannot have a subcontractor_contract_id';
    }
  }
  return null;
}

export function assertSourcePairing(
  type: PurchaseInvoiceType,
  contractId: number | null | undefined,
  supplierId: number | null | undefined,
  projectId: number | null | undefined,
): void {
  const error = getSourcePairingError(type, contractId, supplierId, projectId);
  if (error) throw new BadRequestException(error);
}

/**
 * Rule 2 — a `material` bill never carries a project: material cost already
 * enters the margin through the stock ledger, so a project here would count
 * the same tiles twice. The `trg_material_bill_no_project` trigger is the
 * guard that makes it impossible; this gives the clear message first.
 */
export function assertMaterialBillHasNoProject(
  costTypeName: string,
  projectId: number | null | undefined,
): void {
  if (costTypeName === MATERIAL_COST_TYPE_NAME && projectId != null) {
    throw new BadRequestException(
      'A material bill cannot carry a project: material cost is counted when it is consumed from the stock',
    );
  }
}

/**
 * `vat_amount` and `amount_incl_vat` — through the same per-rate helper the
 * quotes and invoices use, so VAT is rounded one way everywhere.
 */
export function computeBillAmounts(
  amountExclVat: Prisma.Decimal.Value,
  vatRate: Prisma.Decimal.Value,
) {
  const totals = computeDocumentTotals([
    { totalExclVat: amountExclVat, vatRate },
  ]);
  return {
    amountExclVat: totals.amountExclVat,
    vatAmount: totals.vatAmount,
    amountInclVat: totals.amountInclVat,
  };
}

/** Builds the Prisma filter for the purchase-invoice list. */
export function buildPurchaseInvoiceFilter(filters: {
  type?: PurchaseInvoiceType;
  status?: PurchaseInvoiceStatus;
  projectId?: number;
  costTypeId?: number;
}): Prisma.PurchaseInvoiceWhereInput {
  return {
    ...(filters.type && { type: filters.type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.projectId !== undefined && { projectId: filters.projectId }),
    ...(filters.costTypeId !== undefined && { costTypeId: filters.costTypeId }),
  };
}
