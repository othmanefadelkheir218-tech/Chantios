# Tests — Margin & Closure Snapshot

> Routes: `/api/margins`, `/api/projects/:id/margin`, `/api/projects/:id/margin/breakdown`, `/api/projects/:id/budget-history`, `/api/projects/:id/snapshot`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [margin-profitability.md](../margin-profitability.md), [technical/phase-08-margin-snapshot.md](../technical/phase-08-margin-snapshot.md), the step file [Phaces/10-margin.md](../Phaces/10-margin.md).

## Before you start

- **Guards:** every route carries `@TenantAuth()` + `@Module('margins')`. `margins` = `admin`, `manager`, `accountant`. A `supervisor` (and `worker`, `leader`, `sales`) gets `403`.
- **There is NO route that writes a margin.** The view is read-only. The snapshot is written by the project's status change (`PATCH /api/projects/:id/status`).
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. Also `manager@`, `supervisor@`, `worker@`, `accountant@dupont.test` and `admin@verhelst.test`. Login is rate-limited (5 per minute) — space the logins.
- **No new migration this step** — `project_margin_live`, `project_closure_snapshots`, `project_closure_snapshot_costs`, `project_margin_alerts` and the partial unique index (one live snapshot per project) all already existed from step 01's migration.
- **Prerequisites** (steps 04–09): a client; a quote you can send and accept (a free-text line is enough: `quantity 1`, `unit_price_excl_vat 10000.00`); a supplier; a material with stock; a worker assigned to a task on the project.
- Every record you create should start with `TEST`.
- Watching the alerts: the actual send is step 13's. Until then, each alert that **fires** writes its `project_margin_alerts` row and logs one line `Margin alert WARNING: project <id> …` / `CRITICAL`. Check the row count in the DB and count those log lines.

---

## 1. The live margin — three doors, never four

`margin_excl_vat = budget − material_cost − labor_cost − bill_cost`, `margin_pct = margin / budget × 100`.

### MAR-01 — No accepted quote → no error

`GET /api/projects/:id/margin` on a project with no accepted quote → `200`, `budget_excl_vat: "0"`, `margin_pct: null`. Confirmed live.

### MAR-02 — The budget is the sum of accepted quotes

Accept a `10000.00` quote → `budget_excl_vat: 10000`, `margin_pct: 100`. Accept a second `1500.00` quote on the same project → `11500`, with no update code. Confirmed live.

### MAR-03 — `budget-history`

`GET /api/projects/:id/budget-history` → the accepted quotes by `accepted_at`, each with `budget_after` (the running budget: `10000`, then `11500`) and the total `budget_excl_vat`. The budget has no column and no history table: the accepted quotes **are** the history. Lives in `quotes` (a leaf-module rule), same URL. Confirmed live.

### MAR-04 — Material cost = the frozen price

Declare 40 units at a `10.00` purchase price through a site report (step 09) → `material_cost: 400`. Then change `purchase_price` to `99.00` → still `400`. Confirmed live.

### MAR-05 — Labour cost = the frozen rate

Worker at `20.00` logs `20` h → `labor_cost: 400`. Then change `users.hourly_rate` to `45.00` → still `400`. Confirmed live.

### MAR-06 — A bill counts from the day it is entered

A `2500.00` subcontractor bill, status `to_pay` → `bill_cost: 2500` **immediately**. `POST /api/purchase-invoices/:id/paid` → the margin is **unchanged**. A `material` bill with `project_id: null` (also with an explicit JSON `null`) → **not** in `bill_cost`. Confirmed live.

### MAR-07 — The numbers add up

`11500 − 400 − 400 − 2500` → `total_cost: 3300`, `margin_excl_vat: 8200`, `margin_pct: 71.3`. Confirmed live.

---

## 2. The breakdown — one line per cost type

### MAR-08 — `GET /api/projects/:id/margin/breakdown`

→ `items` `material 400`, `labor 400`, `subcontractor 2500`, and `total_cost: 3300` (equal to the view's `total_cost`). The material bill without a project is not a line. Confirmed live.

### MAR-09 — A tenant cost type needs no code change

An admin adds a cost type `insurance…` (`POST /api/cost-types`), then a supplier bill with that cost type on the project → a **new** line appears in the breakdown (4 lines). Grouping is by `cost_type_id`, never by fixed columns. Confirmed live.

---

## 3. The 80 % / 95 % alerts — each fires once

Project with a `10000.00` accepted quote, then supplier bills (`cost_type` = insurance, `project_id` set):

| Step | Total cost | Expected |
|---|---|---|
| bill `7900` | 79 % | nothing — 0 rows |
| bill `100` | 80 % | **one warning**, 1 row, 1 log line |
| bill `300` | 83 % | **nothing sent** — still 1 row, still 1 log line |
| bill `1200` | 95 % | **one critical**, 2 rows |
| bill `10` | 95 %+ | nothing new |
| accept a second `5000` quote | 63 % of 15000 | **both rows deleted** |
| bill `2500` | 80 % of 15000 | the warning fires **again**, 1 row |

All confirmed live. The check runs after every time entry (create, edit, delete), every declared material, every purchase invoice (create, edit) and every accepted quote — and never fails the save that triggered it. A project that is not `in_progress`, or has no budget, sends nothing. Each send point is marked `// TODO: step 13`.

---

## 4. The closure snapshot — `completed`

### SNP-01 — A running project has none

`GET /api/projects/:id/snapshot` → `404` `This project has no closure snapshot`. Confirmed live.

### SNP-02 — Close the project

`PATCH /api/projects/:id/status {"status":"completed"}` → `200`. `GET …/snapshot` → `budget_excl_vat`, `total_cost`, `margin_excl_vat`, `margin_pct` equal to the live numbers at that moment, `voided_at: null`, and **one cost row per cost type** (here `material 990`, `insurance 2000`); the cost rows add up to `total_cost`. In the database the status change, its `project_status_history` row and the snapshot are written **in one transaction**. Confirmed live.

### SNP-03 — The snapshot never moves

After closing: change a material price and add a **late bill** → the live view goes up (`+700`), the snapshot is **exactly the same** (same `id`, same `total_cost`). Confirmed live.

### SNP-04 — Reopen voids, never deletes

A `manager` `PATCH …/status {"status":"in_progress"}` → `403`, snapshot untouched. As `admin` → `200`: the snapshot gets `voided_at` and `voided_by`, the row **still exists**, and `GET …/snapshot` → `404` (no live one). Confirmed live.

### SNP-05 — Close again

→ a **second** snapshot (2 rows in all), exactly **one** with `voided_at IS NULL`, and the new one includes the late bill while the old one stays frozen. `completed → cancelled` is not in the matrix → `400`. Confirmed live.

---

## 5. The closure snapshot — `cancelled`

Decided 2026-10-06: a cancelled job still cost the company money.

### SNP-06 — Cancel → a snapshot too

A project with a `4000.00` quote and a `3000.00` bill: `PATCH …/status {"status":"cancelled","reason":"client withdrew"}` → `200`. `GET …/snapshot` → `total_cost: 3000`, `margin_excl_vat: 1000`, one cost row. The status, history row and snapshot are written in one transaction, then the stock reservations are released (step 05). Confirmed live.

### SNP-07 — Frozen, final

A bill that arrives after the cancel → the live margin becomes `3500`, the snapshot stays `3000`. `cancelled → in_progress` → `400` (final — no reopen), so a cancelled snapshot is **never voided**. Confirmed live.

---

## 6. The list, roles, isolation

### MAR-10 — `GET /api/margins`

One row per **active** project (`prospect` + `in_progress`) — closed ones are not listed, but `?status=completed` / `?status=cancelled` lists them. The project with no quote is listed with `margin_pct: null`. Sorted worst margin first, paginated. Confirmed live.

### MAR-11 — Who sees it

`manager` and `accountant` → `200`. `supervisor` → `403` on **every** route. `worker` → `403`. Confirmed live. `POST /api/margins` and `PATCH /api/projects/:id/margin` → `404` (no such route).

### MAR-12 — Tenant isolation

`admin@verhelst.test`: `…/margin`, `…/margin/breakdown`, `…/snapshot`, `…/budget-history` of tenant A → `404`; `GET /api/margins` → `total: 0`. In the database, `select count(*) from project_margin_live where tenant_id = 2 and project_id = <A's>` → `0`. `projects` still has no budget or progress column. All confirmed live. The e2e loop in `test/tenant-isolation.e2e-spec.ts` covers the snapshot and alert tables automatically.
