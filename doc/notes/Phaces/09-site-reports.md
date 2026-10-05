# Step 09 — Site Reports  *(phase 14)*

> Built here, before margin and the portal, because stock consumption and the portal progress % both come from it.

## Goal

The daily site record: progress %, photos, a note, and the one action in the whole app that moves stock out.

## Decide first

**None.** Fully specified.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 5.

| Table | Purpose |
|---|---|
| `reports` | one row per project per day |

`UNIQUE (tenant_id, project_id, report_date)`. Re-posting the same day **edits** the existing report; it never creates a second one.

This one screen feeds three other parts of the app:

| Feeds | How |
|---|---|
| Client portal (step 12) | `progress_pct` of the newest report is what the client sees |
| Stock (step 05) | material usage declared here writes the `consumption` rows |
| Photos (step 03) | images attach through `media`, `entity_type = 'report'` |

### Progress % is read, never stored on the project

`projects` has **no** progress column.

```sql
SELECT progress_pct FROM reports
WHERE project_id = :p ORDER BY report_date DESC LIMIT 1;
```

Same rule as stock and margin: no running value is stored.

## Modules to create

```
src/reports/
├── decorators/reports.swagger.ts
├── dto/create-report.dto.ts, update-report.dto.ts, declare-materials.dto.ts,
│       find-reports-query.dto.ts
├── entities/report.entity.ts
├── handlers/create-report.handler.ts, find-reports.handler.ts, find-report.handler.ts,
│            update-report.handler.ts, declare-materials.handler.ts,
│            prefill-materials.handler.ts, latest-progress.handler.ts
├── repositories/report.repository.ts
└── reports.service.ts / .controller.ts / .module.ts
```

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/reports` | `reports:create` | upsert on `(project_id, report_date)` |
| `GET` | `/api/reports` | `reports:view` | `?project_id=&from=&to=` |
| `GET` | `/api/reports/:id` | `reports:view` | with photos |
| `PATCH` | `/api/reports/:id` | `reports:edit` | |
| `GET` | `/api/projects/:id/progress` | `projects:view` | the newest `progress_pct` |
| `GET` | `/api/reports/:id/material-prefill` | `stock:view` | `?service_id=&quantity=` → the recipe walk |
| `POST` | `/api/reports/:id/materials` | `stock:create` | **the only way stock leaves** |

`material-prefill` is a **read** — it calculates, saves nothing. The supervisor edits the numbers, then posts them to `/materials`.

### Who can post

| Role | Post a report |
|---|---|
| `admin`, `manager` | yes |
| `site_supervisor`, `team_leader` | yes — this is their main screen |
| `worker` | **no** — the worker logs hours only |
| `sales`, `accountant` | no |

## DTOs

### `create-report.dto.ts`
`project_id` `@IsInt` required. `report_date` optional ISO date, defaults to today. `progress_pct` `@IsInt @Min(0) @Max(100)` required. `weather` optional short string. `note` optional.

### `declare-materials.dto.ts`
`service_id` optional integer — which service was done, for the audit trail. `items` — array of `{ material_id: integer, quantity: string }`, each `quantity > 0` (**positive here**; the handler makes it negative in the ledger).

## Repository methods

```ts
create(data), findById(id), findMany(where, skip, take), update(id, data)
findByProjectAndDate(projectId, reportDate)       // the upsert check
findLatestByProject(projectId)                    // the progress % read
findProjectsWithNoReportSince(days)               // the missing-report alert, step 13
findProgressUnchangedSince(days)                  // the stalled-progress alert, step 13
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-report.handler` | upsert on `(tenant_id, project_id, report_date)`. `progress_pct` 0–100. Project must be `in_progress`. Role check — not a `worker` |
| `prefill-materials.handler` | calls step 05's `recipe.helper` through the stock **service**: `quantity × quantity_per_unit` per material. **Read only** |
| `declare-materials.handler` | **the stock door.** For each item, calls step 05's `record-consumption` through the stock service, in **one transaction**: a negative `consumption` row with `project_id`, `report_id` and the frozen `unit_price`, then the matching reservation's `remaining_quantity` drops. Role: `site_supervisor` / `team_leader` / `manager` / `admin` |
| `latest-progress.handler` | the newest report's `progress_pct`. Step 12's portal calls this |

### The material flow — why it is manual

```
1. Supervisor opens today's report on the project
2. "Declare material used"
3. Picks the service that was done (Painting, 20 m²)
4. The recipe PRE-FILLS the quantities        ← speed
5. Supervisor EDITS them to the real numbers  ← truth
6. Save → one `consumption` row per material
```

Consumption is **never automatic**. The recipe is theory; real usage on site is always different. Step 4 gives speed, step 5 gives truth.

The `worker` role never touches stock. A wrong quantity is corrected by a manager with an `adjustment` row (step 05), **never** by editing the original.

### Worked example

20 m² of Painting, recipe `0.15 L/m²` → pre-fills Paint `3 L`. The supervisor actually used 3.5 L and corrects it:

| material_id | project_id | report_id | type | quantity | unit_price |
|---|---|---|---|---|---|
| Paint | this project | this report | `consumption` | **−3.5** | €6.00 |
| Tape | this project | this report | `consumption` | **−1** | €3.00 |

`unit_price` is frozen from `materials.purchase_price` at save time.

## Tasks

- [ ] `reports` module, full shape
- [ ] Upsert on `(project_id, report_date)` — never two rows for one day
- [ ] Role check on posting (no `worker`, no `sales`, no `accountant`)
- [ ] `material-prefill` endpoint calling step 05's `recipe.helper`
- [ ] `declare-materials` → `record-consumption` through the stock **service**, one transaction
- [ ] `report_id` written on every consumption row
- [ ] Reservation `remaining_quantity` decremented in the same transaction
- [ ] `/api/projects/:id/progress` endpoint
- [ ] Photo upload through step 03's media, `entity_type = 'report'`, images only
- [ ] Cron: missing-report alert (project `in_progress`, no report for 3 days)
- [ ] Cron: progress-stalled alert (`progress_pct` unchanged for 7 days)
- [ ] `// TODO: step 13` at both cron alert points

## Acceptance

- [ ] Post a report → row created
- [ ] Post again the same day for the same project → the **same** row is updated, not a second one
- [ ] `progress_pct = 150` → rejected by the database
- [ ] A `worker` posting a report → 403
- [ ] A `site_supervisor` posting → allowed
- [ ] `material-prefill` for Painting 20 m² → Paint 3, Tape 1, Filler 0.4. **No row written**
- [ ] Declare 3.5 L of Paint → one `consumption` row, quantity **−3.5**, `report_id` set, `unit_price` frozen
- [ ] That project's Paint reservation `remaining_quantity` drops by 3.5; `reserved_quantity` unchanged
- [ ] A reservation reaching zero → `status = 'consumed'`
- [ ] `on_hand` in `material_stock_live` falls by 3.5
- [ ] Force a failure mid-declaration → **nothing** written, no half-applied stock
- [ ] `/api/projects/:id/progress` returns the newest report's value
- [ ] Upload a PDF as a report photo → rejected, images only
- [ ] `projects` still has no progress column
- [ ] Tenant A cannot see tenant B's reports
- [ ] Update `../WhereIStop/state.md`

## Notes to read

- [site-reports.md](../site-reports.md) — the table, the flow, who does what on site
- [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md) — `stock_movements` fields, the frozen price
- [technical/phase-14-site-reports.md](../technical/phase-14-site-reports.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 5
