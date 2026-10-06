# Tests — Site Reports

> Routes: `/api/reports`, `/api/reports/:id/material-prefill`, `/api/reports/:id/materials`, `/api/projects/:id/progress`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [site-reports.md](../site-reports.md), [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md), the step file [Phaces/09-site-reports.md](../Phaces/09-site-reports.md).

## Before you start

- **Guards:** every report route — including the two material routes — carries `@TenantAuth()` + `@Module('reports')`. `admin`, `manager`, `supervisor`, `leader` = full on `reports`. `worker` = scope **own**. `sales` and `accountant` = none (`403`). `GET /api/projects/:id/progress` uses `@Module('projects')`.
- **Why the material routes use `reports`, not `stock`:** `supervisor` holds only `view` on `stock` and `leader` holds `none`, yet declaring material is their main screen. A `stock` guard would lock them out. The `worker` is refused inside the handler (scope `own`).
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"supervisor@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. Also `admin@`, `leader@`, `worker@`, `sales@`, `accountant@dupont.test` and `admin@verhelst.test`. Login is rate-limited (5 per minute) — space the logins.
- **No new migration this step** — `reports`, `chk_progress_pct_range` and `stock_movements.report_id` already existed from step 01's migration.
- **Prerequisites** (steps 04–06): a client; 3 materials with stock bought (Paint, Tape, Filler); a service `Painting` (`m2`) with the recipe Paint `0.15`, Tape `0.05`, Filler `0.02` per unit; a project with an **accepted quote** carrying a Painting line of **40 m²** → the project is `in_progress` and the reservations are Paint `6`, Tape `2`, Filler `0.8`.
- Every record you create should start with `TEST`.

---

## 1. The report — upsert, validation, roles

### REP-01 — Post a report; post again the same day → the SAME row

`POST /api/reports` `{"project_id":<id>,"progress_pct":30,"weather":"Sunny","note":"Walls prepared"}` as `supervisor` → `201`, `report_date` = today, `created_by` set. One row in the DB. Post again `{"project_id":<id>,"progress_pct":45}` → `201` with the **same `id`**, `progress_pct: 45`, `weather` and `note` kept. Still one row for that project and day. Confirmed live.

### REP-02 — `progress_pct` out of range

`150` → `400` (API). `-5` → `400`. Straight in Postgres:

```
insert into reports(tenant_id,project_id,report_date,progress_pct) values (1,<id>,'2030-01-01',150);
```

→ `ERROR: … violates check constraint "chk_progress_pct_range"`. Confirmed live.

### REP-03 — Who may post

| Who | Result |
|---|---|
| `supervisor`, `leader` | `201` |
| `worker` | `403` `…can only log hours` |
| `sales`, `accountant` | `403` (no `reports` access) |

Confirmed live. A `worker` also gets `403` on `PATCH /api/reports/:id`, on `material-prefill` and on `/materials`.

### REP-04 — Only on a running project

A project that is not `in_progress` → `400` `Site reports can only be posted on an in_progress project (this one is prospect)`. Confirmed live.

### REP-05 — An impossible date is a `400`, never a `500`

`"report_date":"2026-13-45"` and `"2026-02-30"` → `400` `report_date must be a valid date like 2026-11-03`. `GET /api/reports?from=2026-13-45` → `400`. The same fix covers step 08: `work_date` and `?from=` / `?to=` on `/api/time-entries`. One shared rule — `IsDateOnly` in `src/common/validators/`. Confirmed live.

### REP-06 — Read, edit, filter

`PATCH /api/reports/:id` `{"progress_pct":50,"note":"Second coat"}` → `200` (old value in `audit_logs`). `GET /api/reports?project_id=&from=&to=` filters. `worker` `GET /api/reports` → only their own (none), and `GET /api/reports/:id` of someone else's → `404`. Confirmed live.

---

## 2. Progress is read, never stored

### REP-07 — `/api/projects/:id/progress` = the NEWEST report

Post a report for today with `50`, then one for **two days ago** with `90`. `GET /api/projects/:id/progress` → `progress_pct: 50` — the newest **by date**, not by insertion. Confirmed live.

### REP-08 — No report yet

→ `{ progress_pct: 0, report_date: null }`. `worker` → `403` (no `projects` access). Confirmed live.

### REP-09 — `projects` has no progress column

```
select count(*) from information_schema.columns where table_name='projects' and column_name ilike '%progress%';
```

→ `0`. Confirmed live.

---

## 3. Material pre-fill — a READ

### REP-10 — Painting 20 m² → Paint 3, Tape 1, Filler 0.4

`GET /api/reports/:id/material-prefill?service_id=<Painting>&quantity=20` → `items` Paint `3`, Tape `1`, Filler `0.4`. **No row is written** (count the `consumption` rows before and after). Unknown service → `404`. `quantity=0` → `400`. `worker` → `403`. Confirmed live.

---

## 4. Declare material — the stock door

### STK-01 — Declare Paint 3.5 + Tape 2

`POST /api/reports/:id/materials` `{"service_id":<Painting>,"items":[{"material_id":<Paint>,"quantity":"3.5"},{"material_id":<Tape>,"quantity":"2"}]}` as `supervisor` → `201`, 2 movements.

| Check | Result |
|---|---|
| Paint ledger row | `quantity -3.500`, `report_id` set, `project_id` set, `unit_price 6.00` (frozen), `type consumption` |
| Paint reservation | `remaining_quantity` 6 → **2.5**, `reserved_quantity` **unchanged at 6**, still `active` |
| Tape reservation | reached 0 → `status = 'consumed'` |
| `material_stock_live.on_hand` | fell by exactly 3.5 |
| `purchase_price` changed later | the old row keeps `6.00` |

All confirmed live.

### STK-02 — All or nothing

`items` = Paint `1` then an unknown `material_id` → `404`. **Nothing is written**: no movement, the Paint reservation unchanged, and no `declare_materials` audit row for the rolled-back declaration. The whole declaration is one transaction. Confirmed live.

### STK-03 — Refused before anything is written

A negative or zero `quantity` → `400`. The same `material_id` twice → `400`. `items: []` → `400`. Unknown report → `404`. `worker` → `403`. Confirmed live.

### STK-04 — Exact quantities, and real use beats the estimate

`"quantity":"0.1"` → the ledger holds exactly `-0.100` (the negation uses `Prisma.Decimal`, not a float). Declaring `50` when only `2.5` was reserved is allowed (the recipe is theory): `remaining_quantity` clamps at `0`, the ledger row is the full `-50`. There is no route that edits or deletes a movement (`DELETE /api/stock/movements/:id` → `404`); a mistake is corrected with an `adjustment` (step 05). Confirmed live.

---

## 5. Photos

### MED-01 — Images only

`POST /api/media` (multipart) `entity_type=report`, `entity_id=<report id>`: a PDF → `400`; a JPG → `201`. `GET /api/reports/:id` then carries `photos` with that file. Delete the test file with `DELETE /api/media/permanent`. Confirmed live.

---

## 6. The daily alert crons

`yarn job:report-alerts` runs the check once, now (it prints `{ missing, stalled }`). Real cron time: 06:00. Step 13 turns each row into an alert (`// TODO: step 13`).

### ALR-01 — Missing report

Make a project `in_progress` and backdate its history: `update project_status_history set changed_at = now() - interval '10 days' where project_id = <id> and to_status = 'in_progress';` With no report for 3+ days → counted in `missing`. A project with a report in the last 3 days is not. Confirmed live (`missing: 1`).

### ALR-02 — Progress stalled

A project `in_progress` below 100 % with reports 10 days ago and yesterday, both `40` → counted in `stalled`. A project whose % moved in the window is not. Confirmed live (`stalled: 1`).

---

## 7. Tenant isolation

`admin@verhelst.test`: `GET /api/reports` → `total: 0`; `GET /api/reports/:id` of tenant A → `404`; `POST /api/reports` on A's project → `404`; `POST /api/reports/:id/materials` on A's report → `404`; `GET /api/projects/:id/progress` → `404`; `material-prefill` from A's report → `404`. All confirmed live. The e2e loop in `test/tenant-isolation.e2e-spec.ts` covers the `reports` table automatically.
