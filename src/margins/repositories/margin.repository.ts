import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BreakdownRow, MarginRow } from '../helpers/margin.helper';

/** Projects shown on `/margins` when no `status` is asked for. */
const ACTIVE_STATUSES: ProjectStatus[] = ['prospect', 'in_progress'];

/**
 * The only place where the margins module reads the live margin.
 * `project_margin_live` is a Postgres VIEW, not a Prisma model — Prisma does
 * not manage views (doc/Schema Proposal.md § 10). Every read goes through
 * `$queryRaw` on the raw, unscoped `PrismaService` with `tenant_id` passed
 * explicitly: the tenant extension only wraps model operations, never raw SQL.
 * Read-only — there is no route and no method that writes a margin.
 */
@Injectable()
export class MarginRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private currentTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new Error(
        'MarginRepository raw query ran with no tenant in context',
      );
    }
    return tenantId;
  }

  /** `/margins` — one row per project, worst margin first. */
  async findAll(
    status: ProjectStatus | undefined,
    skip: number,
    take: number,
  ): Promise<[MarginRow[], number]> {
    const tenantId = this.currentTenantId();
    const statuses = status ? [status] : ACTIVE_STATUSES;
    const statusFilter = Prisma.sql`p.status::text IN (${Prisma.join(statuses)})`;

    const rows = await this.prisma.$queryRaw<MarginRow[]>`
      SELECT m.project_id AS "projectId", p.name, p.status,
             m.budget_excl_vat AS "budgetExclVat", m.material_cost AS "materialCost",
             m.labor_cost AS "laborCost", m.bill_cost AS "billCost",
             m.total_cost AS "totalCost", m.margin_excl_vat AS "marginExclVat",
             m.margin_pct AS "marginPct"
      FROM project_margin_live m
      JOIN projects p ON p.id = m.project_id
      WHERE m.tenant_id = ${tenantId} AND ${statusFilter}
      ORDER BY m.margin_pct ASC NULLS LAST, m.project_id ASC
      LIMIT ${take} OFFSET ${skip}
    `;
    const counted = await this.prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) AS total
      FROM project_margin_live m
      JOIN projects p ON p.id = m.project_id
      WHERE m.tenant_id = ${tenantId} AND ${statusFilter}
    `;
    return [rows, Number(counted[0].total)];
  }

  /** One project's live margin, or `null` if the project is not this tenant's. */
  async findByProject(projectId: number): Promise<MarginRow | null> {
    const tenantId = this.currentTenantId();
    const rows = await this.prisma.$queryRaw<MarginRow[]>`
      SELECT m.project_id AS "projectId", p.name, p.status,
             m.budget_excl_vat AS "budgetExclVat", m.material_cost AS "materialCost",
             m.labor_cost AS "laborCost", m.bill_cost AS "billCost",
             m.total_cost AS "totalCost", m.margin_excl_vat AS "marginExclVat",
             m.margin_pct AS "marginPct"
      FROM project_margin_live m
      JOIN projects p ON p.id = m.project_id
      WHERE m.tenant_id = ${tenantId} AND m.project_id = ${projectId}
    `;
    return rows[0] ?? null;
  }

  /**
   * The cost of one project grouped by `cost_type_id` — the same three doors
   * as the view, as one line per cost type:
   *   - material → the seeded `material` type, from the stock ledger;
   *   - labour   → the seeded `labor` type, from the frozen time-entry rates;
   *   - bills    → each bill's own `cost_type_id`, EXCEPT `material` (already
   *     counted when it left the stock).
   * A cost type a tenant adds later (`insurance`) gets its own line with no
   * code change. The lines add up to the view's `total_cost`.
   */
  findBreakdownByProject(projectId: number): Promise<BreakdownRow[]> {
    const tenantId = this.currentTenantId();
    return this.prisma.$queryRaw<BreakdownRow[]>`
      SELECT ct.id AS "costTypeId", ct.name, SUM(x.amount) AS amount
      FROM (
        SELECT (SELECT id FROM cost_types WHERE name = 'material' AND tenant_id IS NULL) AS cost_type_id,
               SUM(-sm.quantity * sm.unit_price) AS amount
        FROM stock_movements sm
        WHERE sm.tenant_id = ${tenantId} AND sm.project_id = ${projectId} AND sm.type = 'consumption'
        UNION ALL
        SELECT (SELECT id FROM cost_types WHERE name = 'labor' AND tenant_id IS NULL),
               SUM(te.hours * te.hourly_rate)
        FROM time_entries te
        WHERE te.tenant_id = ${tenantId} AND te.project_id = ${projectId}
        UNION ALL
        SELECT pi.cost_type_id, SUM(pi.amount_excl_vat)
        FROM purchase_invoices pi
        JOIN cost_types bct ON bct.id = pi.cost_type_id
        WHERE pi.tenant_id = ${tenantId} AND pi.project_id = ${projectId} AND bct.name <> 'material'
        GROUP BY pi.cost_type_id
      ) x
      JOIN cost_types ct ON ct.id = x.cost_type_id
      WHERE x.amount IS NOT NULL AND x.amount <> 0
      GROUP BY ct.id, ct.name
      ORDER BY ct.name
    `;
  }
}
