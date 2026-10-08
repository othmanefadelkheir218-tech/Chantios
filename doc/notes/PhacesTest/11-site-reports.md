# Phase 11 — Site Reports

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [site-reports.md](../site-reports.md), [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md).
> Old reference: [../test/13-site-reports.md](../test/13-site-reports.md).

## Goal

One report per project per day, progress read from the newest report, the material pre-fill (a read), and material declaration — the only door that consumes stock.

## Before you start

- `TEST Project Main` is `in_progress`, with 2 accepted quotes of `TEST Painting` (40 + 20 m²). Its reservations are: **Paint 9**, **Tape 3**, **Filler 1.2** (all `active`).
- Supervisor posts the reports (`site_supervisor`).

---

## 1. The report

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-01 | Supervisor: `POST /api/reports { project_id: Main, progress_pct: 30, weather: "Sunny", note: "Walls prepared" }` | `201`, `report_date` today, `created_by` set | todo |
| REP-02 | Again the same day `{ progress_pct: 45 }` | `201`, the **same `id`**, `45`, weather and note kept — one row | todo |
| REP-03 | `progress_pct` `150` / `-5`; DB insert `150` | `400`; `chk_progress_pct_range` | todo |
| REP-04 | Leader posts → `201`; worker → `403 …can only log hours`; sales, accountant → `403` | as stated | todo |
| REP-05 | Report on `TEST Project Refuse` (prospect) | `400 Site reports can only be posted on an in_progress project…` | todo |
| REP-06 | `report_date 2026-13-45`; `?from=2026-02-30` | `400` | todo |
| REP-07 | `PATCH /api/reports/:id { progress_pct: 50, note: "Second coat" }` | `200`, old value in `audit_logs` | todo |
| REP-08 | Worker `GET /api/reports` (none of their own), another report by id | empty; `404` | todo |

## 2. Progress is read, never stored

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-09 | Report dated 2 days ago with `90`, then `GET /api/projects/<Main>/progress` | `50` — the newest **by date**, not by insert | todo |
| REP-10 | `progress` on `TEST Project Side` (no report) | `{ progress_pct: 0, report_date: null }` | todo |
| REP-11 | `information_schema.columns` for `projects` like `%progress%` | `0` | todo |

## 3. Material pre-fill (a read)

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-12 | `GET /api/reports/:id/material-prefill?service_id=<Painting>&quantity=20` | Paint `3`, Tape `1`, Filler `0.4`; **no** movement written | todo |
| REP-13 | Unknown service; `quantity=0`; worker | `404`; `400`; `403` | todo |

## 4. Declare material — the stock door

| ID | Do | Expected | Result |
|---|---|---|---|
| STK-10 | `POST /api/reports/:id/materials { service_id: Painting, items: [Paint 3.5, Tape 3] }` | `201`, 2 `consumption` movements: `-3.500` Paint at `6.00` (frozen), `report_id` and `project_id` set | todo |
| STK-11 | Reservations | Paint remaining `9 → 5.5`, reserved still `9`, `active`; Tape remaining `0` → `consumed` | todo |
| STK-12 | `on_hand` from the view | Paint fell by exactly `3.5` | todo |
| STK-13 | Items Paint `1` + an unknown material | `404`, **nothing** written (no movement, reservation unchanged, no audit row) | todo |
| STK-14 | Zero / negative quantity; the same material twice; `items: []`; unknown report; worker | `400`, `400`, `400`, `404`, `403` | todo |
| STK-15 | Declare Paint `0.1` | ledger `-0.100` exactly | todo |
| STK-16 | Declare Filler `50` (only 1.2 reserved) | allowed; remaining clamps at `0`, ledger `-50`; `available` may go negative — a soft `reservation_unmet` alert, never a block | todo |
| STK-17 | Fix STK-16 with an adjustment (`+45`, note `TEST over-declared`) | `201` — the only way to correct the ledger | todo |

## 5. Photos

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-14 | Upload a PDF to `entity_type=report`; then a JPG | `400`; `201`. `GET /api/reports/:id` shows it in `photos` | todo |
| REP-15 | **[CHECK IMAGEKIT]** | the JPG is in `tenant-<A>/report/<report id>/` | todo |

## 6. The report crons

| ID | Do | Expected | Result |
|---|---|---|---|
| ALR-01 | `TEST Project Side`: backdate its `in_progress` history row by 10 days, no report; `yarn job:report-alerts` | counted in `missing` | todo |
| ALR-02 | A project with reports 10 days ago and yesterday, both `40` | counted in `stalled` | todo |

## 7. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-SR-01 | B owner: `GET /api/reports` → `total 0`; A's report → `404`; post on A's project → `404`; materials on A's report → `404`; A's progress → `404` | as stated | todo |

After this phase, re-run **section 3 of phase 04** (`scope = own`).
