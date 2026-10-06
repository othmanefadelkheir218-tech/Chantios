import { Prisma, ProjectStatus } from '@prisma/client';

/** One row of `project_margin_live`, joined with the project's name and status. */
export interface MarginRow {
  projectId: number;
  name: string;
  status: ProjectStatus;
  budgetExclVat: Prisma.Decimal;
  materialCost: Prisma.Decimal;
  laborCost: Prisma.Decimal;
  billCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  marginExclVat: Prisma.Decimal;
  /** `NULL` when the project has no accepted quote — never an error. */
  marginPct: Prisma.Decimal | null;
}

/** One line of the cost breakdown — one per cost type, a type a tenant adds later included. */
export interface BreakdownRow {
  costTypeId: number;
  name: string;
  amount: Prisma.Decimal;
}

/** What may leave the module: one project's live margin. */
export function toMarginEntity(row: MarginRow) {
  return {
    projectId: row.projectId,
    name: row.name,
    status: row.status,
    budgetExclVat: row.budgetExclVat,
    materialCost: row.materialCost,
    laborCost: row.laborCost,
    billCost: row.billCost,
    totalCost: row.totalCost,
    marginExclVat: row.marginExclVat,
    marginPct: row.marginPct,
  };
}

export function toBreakdownEntity(rows: BreakdownRow[]) {
  const total = rows.reduce(
    (sum, row) => sum.plus(row.amount),
    new Prisma.Decimal(0),
  );
  return {
    items: rows.map((row) => ({
      costTypeId: row.costTypeId,
      name: row.name,
      amount: row.amount,
    })),
    totalCost: total,
  };
}

export type SnapshotWithCosts = Prisma.ProjectClosureSnapshotGetPayload<{
  include: { costs: { include: { costType: true } } };
}>;

/** What may leave the module: a frozen closure snapshot with its cost rows. */
export function toSnapshotEntity(snapshot: SnapshotWithCosts) {
  return {
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    projectId: snapshot.projectId,
    budgetExclVat: snapshot.budgetExclVat,
    totalCost: snapshot.totalCost,
    marginExclVat: snapshot.marginExclVat,
    marginPct: snapshot.marginPct,
    closedBy: snapshot.closedBy,
    closedAt: snapshot.closedAt,
    voidedAt: snapshot.voidedAt,
    voidedBy: snapshot.voidedBy,
    costs: snapshot.costs.map((cost) => ({
      costTypeId: cost.costTypeId,
      name: cost.costType.name,
      amount: cost.amount,
    })),
  };
}
