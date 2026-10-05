# Phase 08 — Margin & Closure Snapshot

> Depends on Phase 04 (stock cost), Phase 06 (subcontractor cost), Phase 07 (employee cost).

## Tables

- `project_margin_live` — SQL view, always fresh (no stored data)
- `project_closure_snapshots` — written once when project → `completed`
- `project_closure_snapshot_costs` — line items of the snapshot
- `cost_types` — seeded, 3 rows with `tenant_id = NULL`: `material` / `subcontractor` / `labor`. A tenant admin can add its own
- `project_margin_alerts` — remembers which alert level already fired per project

## Key relations

```
projects ──── project_closure_snapshots ──── project_closure_snapshot_costs ──── cost_types
```

## Key rules

### Live margin view
```sql
budget_excl_vat = SUM(quotes.amount_excl_vat) WHERE status = 'accepted'
material_cost   = SUM(stock_movements.quantity × unit_price) WHERE type = 'consumption'
labor_cost      = SUM(time_entries.hours × hourly_rate)
bill_cost       = SUM(purchase_invoices.amount_excl_vat)
                  WHERE project_id = :p
                    AND cost_types.name <> 'material'   -- belt and braces
                  -- a material bill also has no project_id, so it cannot land here anyway.
                  -- Counted whatever the status: a cost you owe is a cost.

margin_excl_vat = budget_excl_vat - material_cost - labor_cost - bill_cost
margin_pct      = (margin_excl_vat / budget_excl_vat) × 100
```

### Three doors, never four

Each cost enters through exactly one door: materials through the stock ledger, hours through `time_entries`, and every bill through `purchase_invoices` grouped by `cost_type_id`.

A material bill never counts here — the tiles are already counted when they leave the stock. That is why `cost_type = 'material'` forces `project_id = NULL`, so the double count is impossible by construction, not by a `WHERE` clause someone can forget.

The breakdown screen groups `bill_cost` by `cost_type_id`, so a cost type a tenant adds later shows its own line with no code change.

The budget is part of the view too — `projects` has no budget column. A second accepted quote raises it with no update code. Guard against divide-by-zero when a project has no accepted quote yet.

All components calculated fresh every query — nothing cached.

### Alert thresholds (soft)
| Threshold | Alert |
|---|---|
| `margin_pct` ≤ 20% (costs at 80%) | Warning alert |
| `margin_pct` ≤ 5% (costs at 95%) | Critical alert |

Alerts fire to tenant admin + manager.

### Each level fires once — the dedup rule

Margin is recomputed after every time entry, consumption and purchase invoice. Without a guard, a project at 81% would email on every save.

`project_margin_alerts` holds one row per `(project_id, level)` with `fired_at`. Before sending, check the row; if it exists, send nothing.

| Situation | Result |
|---|---|
| Crosses 80% the first time | Warning sent, row written |
| Saves again at 83% | Nothing sent |
| Later crosses 95% | Critical sent, second row written |
| Extra accepted quote raises the budget, cost drops back under 80% | Both rows deleted — levels can fire again |

### Closure snapshot — locked forever
- Project moves to `completed` → one row written to `project_closure_snapshots`
- Row stores the final numbers at that exact moment
- Never updated after creation — it's a financial record
- An admin reopening the project sets `voided_at` on it. The row **stays**; a fresh one is written at the next close. A partial unique index (`WHERE voided_at IS NULL`) keeps exactly one live snapshot per project

### Why both live view + snapshot?
| | Live view | Snapshot |
|---|---|---|
| Purpose | Dashboard, alerts | Archive, reports |
| When | Always | Once, on closure |
| Changes? | Yes (every query fresh) | Never |

## What to build

- `project_margin_live` SQL view (raw SQL in migration)
- Margin alert trigger (check after every time entry, stock consumption, or purchase invoice saved) — with the `project_margin_alerts` dedup check
- Alert reset: delete the rows when cost drops back below a threshold
- Closure handler (project → `completed` → write snapshot)
- Snapshot reader (for closed project reports)
- Seed file: `cost_types` (3 rows, `tenant_id = NULL`)

## Dependencies

- Phase 04 (stock_movements for material cost)
- Phase 06 (purchase_invoices for subcontractor cost)
- Phase 07 (time_entries for employee cost)

## See also
- [[margin-profitability]]
- [[catalogue-stock-tables-and-cost-storage]]
- [[alerts]]
