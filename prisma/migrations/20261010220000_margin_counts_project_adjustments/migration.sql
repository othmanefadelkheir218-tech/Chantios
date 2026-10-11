-- A stock adjustment linked to a project now counts in that project's
-- material cost (doc/notes/margin-profitability.md, decided 2026-10-10).
CREATE OR REPLACE VIEW "project_margin_live" AS
SELECT
  p."id"                                            AS project_id,
  p."tenant_id"                                     AS tenant_id,
  COALESCE(q.budget_excl_vat, 0)                    AS budget_excl_vat,
  COALESCE(mc.material_cost, 0)                     AS material_cost,
  COALESCE(lc.labor_cost, 0)                        AS labor_cost,
  COALESCE(bc.bill_cost, 0)                         AS bill_cost,
  COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0)
                                                    AS total_cost,
  COALESCE(q.budget_excl_vat, 0)
    - (COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0))
                                                    AS margin_excl_vat,
  CASE WHEN COALESCE(q.budget_excl_vat, 0) > 0 THEN
    round(
      ( (COALESCE(q.budget_excl_vat, 0)
          - (COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0)))
        / q.budget_excl_vat ) * 100, 2)
  END                                               AS margin_pct
FROM "projects" p
LEFT JOIN (
  SELECT "project_id", SUM("amount_excl_vat") AS budget_excl_vat
  FROM "quotes" WHERE "status" = 'accepted'::"quote_status"
  GROUP BY "project_id"
) q ON q."project_id" = p."id"
LEFT JOIN (
  -- quantity is negative on consumption, so negate it. An adjustment linked
  -- to the project counts too: a positive one gives material back (fixes a
  -- wrong consumption), a negative one adds cost. Unlinked adjustments have
  -- project_id NULL and never reach a project.
  SELECT "project_id", SUM(-"quantity" * "unit_price") AS material_cost
  FROM "stock_movements"
  WHERE "type" IN ('consumption'::"stock_movement_type", 'adjustment'::"stock_movement_type")
    AND "project_id" IS NOT NULL
  GROUP BY "project_id"
) mc ON mc."project_id" = p."id"
LEFT JOIN (
  SELECT "project_id", SUM("hours" * "hourly_rate") AS labor_cost
  FROM "time_entries" GROUP BY "project_id"
) lc ON lc."project_id" = p."id"
LEFT JOIN (
  -- every bill on the project EXCEPT material (already counted by the ledger).
  -- Counted from the day it is entered, whatever its status.
  SELECT pi."project_id", SUM(pi."amount_excl_vat") AS bill_cost
  FROM "purchase_invoices" pi
  JOIN "cost_types" ct ON ct."id" = pi."cost_type_id"
  WHERE pi."project_id" IS NOT NULL AND ct."name" <> 'material'
  GROUP BY pi."project_id"
) bc ON bc."project_id" = p."id";
