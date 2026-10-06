import { BadRequestException } from '@nestjs/common';
import { ContractStatus, Prisma, SubcontractorContract } from '@prisma/client';

/** What may leave the module. Internal only — never shown to the client. */
export function toContractEntity(contract: SubcontractorContract) {
  return {
    id: contract.id,
    tenantId: contract.tenantId,
    subcontractorId: contract.subcontractorId,
    projectId: contract.projectId,
    description: contract.description,
    amountExclVat: contract.amountExclVat,
    status: contract.status,
    startDate: contract.startDate,
    endDate: contract.endDate,
    createdBy: contract.createdBy,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

/** Contract state machine: only `in_progress` can move, and only to a final state. */
export const CONTRACT_STATUS_TRANSITIONS: Record<
  ContractStatus,
  ContractStatus[]
> = {
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionContract(
  from: ContractStatus,
  to: ContractStatus,
): boolean {
  return CONTRACT_STATUS_TRANSITIONS[from].includes(to);
}

/** `amount_excl_vat >= 0` — mirrors the `chk_contract_amount` DB constraint. */
export function assertNonNegativeAmount(amount: string): void {
  if (new Prisma.Decimal(amount).isNegative()) {
    throw new BadRequestException('amount_excl_vat must not be negative');
  }
}

/** Builds the Prisma filter for the contract list. */
export function buildContractFilter(
  projectId?: number,
  status?: ContractStatus,
  subcontractorId?: number,
): Prisma.SubcontractorContractWhereInput {
  return {
    ...(projectId !== undefined && { projectId }),
    ...(status && { status }),
    ...(subcontractorId !== undefined && { subcontractorId }),
  };
}
