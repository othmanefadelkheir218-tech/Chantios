# Step 10 — Margin & Closure Snapshot  *(phase 08)*

> Needs step 05 (material cost), step 07 (bills) and step 08 (labour cost) in place first.

## Goal

The live margin view, the alert thresholds that fire once each, and the snapshot frozen when a project closes.

## Decide first

**Decided 2026-10-06 — a snapshot is written on `completed` AND on `cancelled`.** A cancelled job still cost the company money, so its numbers are frozen too. `cancelled` is final, so its snapshot is never voided. Written into [technical/phase-08-margin-snapshot.md](../technical/phase-08-margin-snapshot.md). Nothing blocking.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 8.

| Table | Purpose |
|---|---|
| `project_margin_live` | **a view** — always fresh, stores nothing |
| `project_closure_snapshots` | written once on close. `voided_at` on reopen |
| `project_closure_snapshot_costs` | the breakdown as **rows**, not columns |
| `project_margin_alerts` | PK `(project_id, level)` — the dedup |

### Three doors, never four

```
margin_excl_vat = budget_excl_vat − material_cost − labor_cost − bill_cost
margin_pct      = (margin_excl_vat / budget_excl_vat) × 100
```

| Term | Source | Door |
|---|---|---|
| `budget_excl_vat` | `SUM(quotes.amount_excl_vat)` where `status = 'accepted'` | step 06 |
| `material_cost` | `stock_movements`: `SUM(−quantity × unit_price)` where `type = 'consumption'` | step 05, the ledger |
| `labor_cost` | `time_entries`: `SUM(hours × hourly_rate)` — the **frozen** rate | step 08 |
| `bill_cost` | `purchase_invoices.amount_excl_vat` on this project, grouped by `cost_type_id`, **excluding `material`** | step 07 |

**A material bill never counts here.** The tiles are already counted when they leave the stock. That is why `cost_type = 'material'` forces `project_id = NULL` — the double count is impossible by construction, not by a `WHERE` someone can forget. The `ct.name <> 'material'` filter in the view is belt and braces.

A bill counts **from the day it is entered**, whatever its `status`. A cost you owe is a cost; paying it later changes nothing.

### The budget is not a column

`projects` stores no budget. Extra work mid-project is a **second** quote, not an edit of the first — so the budget grows by itself with no update code and no stale number.

Budget history needs no table either: the list of accepted quotes with their `accepted_at` **is** the history.

**Guard against divide-by-zero.** A project with no accepted quote has `budget_excl_vat = 0`; `margin_pct` must come back `NULL`, not an error.

## Modules to create

```
src/margins/
├── decorators/margins.swagger.ts
├── dto/find-margins-query.dto.ts
├── entities/project-margin.entity.ts, closure-snapshot.entity.ts
├── handlers/find-margins.handler.ts, find-project-margin.handler.ts,
│            margin-breakdown.handler.ts, check-thresholds.handler.ts,
│            write-snapshot.handler.ts, void-snapshot.handler.ts,
│            find-snapshot.handler.ts
├── helpers/margin-threshold.helper.ts      ← the 80% / 95% logic, once
├── repositories/margin.repository.ts       (the view, $queryRaw)
│               closure-snapshot.repository.ts, margin-alert.repository.ts
└── margins.service.ts / .controller.ts / .module.ts
```

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/margins` | `margins:view` | one row per active project — the `/margins` page |
| `GET` | `/api/projects/:id/margin` | `margins:view` | live, from the view |
| `GET` | `/api/projects/:id/margin/breakdown` | `margins:view` | grouped by `cost_type_id` |
| `GET` | `/api/projects/:id/budget-history` | `margins:view` | the accepted quotes, by `accepted_at` |
| `GET` | `/api/projects/:id/snapshot` | `margins:view` | the live snapshot, if closed |

There is **no** route that writes a margin. The view is read-only and the snapshot is written by the closure handler, called from step 04's status change.

## Repository methods

```ts
// margin.repository.ts  — all $queryRaw on the view, tenant_id passed explicitly
findAll(where, skip, take): Promise<[ProjectMargin[], number]>
findByProject(projectId): Promise<ProjectMargin | null>
findBreakdownByProject(projectId): Promise<{ cost_type_id, name, amount }[]>

// closure-snapshot.repository.ts
create(data, costRows, tx): Promise<ClosureSnapshot>     // one transaction
findLiveByProject(projectId)                              // voided_at IS NULL
findAllByProject(projectId)                               // history, voided included
void(id, userId, tx): Promise<void>

// margin-alert.repository.ts
exists(projectId, level): Promise<boolean>
create(projectId, level, tx), deleteAllForProject(projectId, tx)
```

Every margin read is `$queryRaw` on a view, so **`tenant_id` must be passed by hand** — the Prisma extension cannot see inside raw SQL. All three views carry it.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `find-margins.handler` | the dashboard list. `margin_pct` `NULL` when there is no accepted quote |
| `margin-breakdown.handler` | groups `bill_cost` by `cost_type_id`, so a cost type a tenant adds later gets its own line **with no code change** |
| `check-thresholds.handler` | the dedup below. Called after every time entry, consumption and purchase invoice |
| `write-snapshot.handler` | on close: reads the view, writes `project_closure_snapshots` + one `project_closure_snapshot_costs` row per cost type, **one transaction**. Never updated afterwards |
| `void-snapshot.handler` | on an admin reopen: sets `voided_at` and `voided_by`. **Never deletes** — a snapshot is a financial record. The partial unique index keeps one live row per project |

### The thresholds, and why each fires once

| Level | When | To |
|---|---|---|
| ⚠️ Warning | real cost reaches **80%** of budget | admin + manager |
| 🔴 Critical | real cost reaches **95%** of budget | admin + manager |

Margin is recomputed after every time entry, every consumption and every purchase invoice. Without a guard, a project sitting at 81% would email on **every single save**.

`project_margin_alerts` holds one row per `(project_id, level)`. Before sending, check the row; if it exists, send nothing.

| Situation | Result |
|---|---|
| Crosses 80% the first time | warning sent, row written |
| Saves again at 83% | **nothing sent** |
| Later crosses 95% | critical sent, second row written |
| An extra accepted quote raises the budget and cost drops back under 80% | **both rows deleted** — the levels can fire again |

That last line matters: an extra accepted quote raises the budget, so a project can genuinely become healthy again.

### Live view **and** snapshot — why both

| | Live view | Snapshot |
|---|---|---|
| Purpose | dashboard, alerts | archive, reports |
| When | always, every query fresh | once, on closure |
| Changes? | yes | **never** |

## Tasks

- [x] `project_margin_live` view as raw SQL in a migration — full SQL in § 10 of the schema
- [x] Divide-by-zero guard: `margin_pct` is `NULL` with no accepted quote
- [x] `margins` module, full shape
- [x] All view reads through `$queryRaw` **with `tenant_id`**
- [x] `margin-threshold.helper.ts` — the 80 / 95 logic, one implementation
- [x] `check-thresholds` called from step 08 (time entry), step 09 (consumption), step 07 (bill)
- [x] `project_margin_alerts` dedup, and the reset that deletes rows when cost drops back
- [x] `write-snapshot` wired into step 04's `change-status` on `→ completed`
- [x] `void-snapshot` wired into the admin reopen `completed → in_progress`
- [x] `budget-history` endpoint from the accepted quotes
- [x] Remove the `// TODO: step 10` markers in step 04
- [x] `// TODO: step 13` at the two alert send points
- [x] Decide the cancelled-project snapshot question

## Acceptance

- [x] A project with no accepted quote → `budget = 0`, `margin_pct` is `NULL`, **no error**
- [x] Accept a €10,000 quote → `budget_excl_vat = 10000`
- [x] Accept a second €1,500 quote → budget becomes `11500`, with no update code
- [x] Consume €400 of material → `material_cost = 400`, using the **frozen** price
- [x] Log 20h at €20 → `labor_cost = 400`, using the **frozen** rate
- [x] A €2,500 subcontractor bill `to_pay` → `bill_cost = 2500` **immediately**, before payment
- [x] Mark that bill `paid` → margin **unchanged**
- [x] A `material` bill with `project_id = NULL` → **not** in `bill_cost`
- [x] Breakdown shows one line per `cost_type_id`
- [x] A tenant adds cost type `insurance` and a bill for it → a new line appears, **no code change**
- [x] Cost crosses 80% → one warning. Save again at 83% → **nothing sent**
- [x] Cost crosses 95% → one critical. A second row in `project_margin_alerts`
- [x] An extra quote drops cost under 80% → both rows deleted, levels can fire again
- [x] Close the project → snapshot written, with one cost row per type, in one transaction
- [x] Change a material price after closing → the snapshot **does not move**
- [x] Admin reopens → `voided_at` set, the row **still exists**
- [x] Close again → a second snapshot, only one with `voided_at IS NULL`
- [x] A `manager` sees margins; a `site_supervisor` gets 403
- [x] Tenant A cannot read tenant B's margins through the view
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [margin-profitability.md](../margin-profitability.md) — the formula, the thresholds, the full Dubois scenario
- [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md) — where each cost lives, the snapshot
- [technical/phase-08-margin-snapshot.md](../technical/phase-08-margin-snapshot.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 8, § 10 the view SQL
