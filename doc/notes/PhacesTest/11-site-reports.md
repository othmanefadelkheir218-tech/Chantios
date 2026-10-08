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
| REP-01 | Supervisor: `POST /api/reports { project_id: Main, progress_pct: 30, weather: "Sunny", note: "Walls prepared" }` | `201`, `report_date` today, `created_by` set | PASS |
| REP-02 | Again the same day `{ progress_pct: 45 }` | `201`, the **same `id`**, `45`, weather and note kept — one row | PASS |
| REP-03 | `progress_pct` `150` / `-5`; DB insert `150` | `400`; `chk_progress_pct_range` | PASS |
| REP-04 | Leader posts → `201`; worker → `403 …can only log hours`; sales, accountant → `403` | as stated | PASS |
| REP-05 | Report on `TEST Project Refuse` (prospect) | `400 Site reports can only be posted on an in_progress project…` | PASS |
| REP-06 | `report_date 2026-13-45`; `?from=2026-02-30` | `400` | PASS |
| REP-07 | `PATCH /api/reports/:id { progress_pct: 50, note: "Second coat" }` | `200`, old value in `audit_logs` | PASS |
| REP-08 | Worker `GET /api/reports` (none of their own), another report by id | empty; `404` | PASS |

## 2. Progress is read, never stored

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-09 | Report dated 2 days ago with `90`, then `GET /api/projects/<Main>/progress` | `50` — the newest **by date**, not by insert | PASS |
| REP-10 | `progress` on `TEST Project Side` (no report) | `{ progress_pct: 0, report_date: null }` | PASS |
| REP-11 | `information_schema.columns` for `projects` like `%progress%` | `0` | PASS |

## 3. Material pre-fill (a read)

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-12 | `GET /api/reports/:id/material-prefill?service_id=<Painting>&quantity=20` | Paint `3`, Tape `1`, Filler `0.4`; **no** movement written | PASS |
| REP-13 | Unknown service; `quantity=0`; worker | `404`; `400`; `403` | PASS |

## 4. Declare material — the stock door

| ID | Do | Expected | Result |
|---|---|---|---|
| STK-10 | `POST /api/reports/:id/materials { service_id: Painting, items: [Paint 3.5, Tape 3] }` | `201`, 2 `consumption` movements: `-3.500` Paint at `6.00` (frozen), `report_id` and `project_id` set | PASS |
| STK-11 | Reservations | Paint remaining `9 → 5.5`, reserved still `9`, `active`; Tape remaining `0` → `consumed` | PASS |
| STK-12 | `on_hand` from the view | Paint fell by exactly `3.5` | PASS |
| STK-13 | Items Paint `1` + an unknown material | `404`, **nothing** written (no movement, reservation unchanged, no audit row) | PASS |
| STK-14 | Zero / negative quantity; the same material twice; `items: []`; unknown report; worker | `400`, `400`, `400`, `404`, `403` | PASS |
| STK-15 | Declare Paint `0.1` | ledger `-0.100` exactly | PASS |
| STK-16 | Declare Filler `50` (only 1.2 reserved) | allowed; remaining clamps at `0`, ledger `-50`; `available` may go negative — a soft `reservation_unmet` alert, never a block | PASS |
| STK-17 | Fix STK-16 with an adjustment (`+45`, note `TEST over-declared`) | `201` — the only way to correct the ledger | PASS |

## 5. Photos

| ID | Do | Expected | Result |
|---|---|---|---|
| REP-14 | Upload a PDF to `entity_type=report`; then a JPG | `400`; `201`. `GET /api/reports/:id` shows it in `photos` | PASS |
| REP-15 | **[CHECK IMAGEKIT]** | the JPG is in `tenant-<A>/report/<report id>/` | todo |

## 6. The report crons

| ID | Do | Expected | Result |
|---|---|---|---|
| ALR-01 | `TEST Project Side`: backdate its `in_progress` history row by 10 days, no report; `yarn job:report-alerts` | counted in `missing` | PASS |
| ALR-02 | A project with reports 10 days ago and yesterday, both `40` | counted in `stalled` | PASS |

## 7. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-SR-01 | B owner: `GET /api/reports` → `total 0`; A's report → `404`; post on A's project → `404`; materials on A's report → `404`; A's progress → `404` | as stated | PASS |

After this phase, re-run **section 3 of phase 04** (`scope = own`).

## Result — 2026-10-08

> **Status: 1 waiting for you (REP-15, ImageKit check). The END message is not sent yet.**

**25 PASS, 0 FAIL, 1 waiting** (REP-15, ImageKit check — asked on Telegram: folder `Chantios/tenant-1/report/1/`, media id 39).

- REP-04: the leader's post the same day edited the supervisor's report (same `id`, `created_by` stays the supervisor, `progress_pct` 46). The audit history of report 1 shows the whole chain (30 → 45 → 46 → 50).
- REP-05: first run sent an undefined project id (my script), re-run with `TEST Project Refuse` → `400 Site reports can only be posted on an in_progress project (this one is prospect)`.
- REP-14: PDF → `400`; the JPG answered `500 Internal server error` on the **first** try and `201` on the retry. The dev server had been restarted by its file watcher a few minutes earlier — in phase 05 the `500`s were also the first upload after a pause. Added as a clue to problem 11 in RESULTS.md. `GET /api/reports/1` lists the photos (including the phase 05 ones).
- STK-10: Paint `-3.5` at frozen `6.00`, Tape `-3` at `2.00`, both with `report_id 1` and `project_id 4`. STK-11: Paint remaining 5.5 (reserved 9, active); Tape remaining 0, `consumed`. STK-12: Paint on hand 96.5.
- STK-13: `404`; movement count (2), `declare_materials` audit count (1) and the Paint reservation unchanged.
- STK-16: Filler 50 declared → remaining 0 (`consumed`), ledger `-50`, on hand `-20`, two `reservation_unmet` notifications (short by 20; one per admin/manager). STK-17 adjustment `+45` → on hand 25.
- ALR-01: `{ missing: 1, stalled: 0 }` (Project Side). ALR-02: `{ missing: 0, stalled: 1 }` (Side, reports 2026-09-28 and 2026-10-07, both 40).
- REP-09: the report dated 2026-10-06 (90) did not move progress: it stays `50` (2026-10-08).
- The phase 04 section 3 re-run (`scope = own`) is still to do.

### Data left

Reports (A): 1 on Main 2026-10-08 (50, weather Sunny, note Second coat), Main 2026-10-06 (90), Side 2026-09-28 (40) and 2026-10-07 (40). Consumption movements: Paint -3.5 and -0.1, Tape -3, Filler -50 (+45 adjustment). Reservations (Main): Paint remaining 5.4 (active), Tape 0 (consumed), Filler 0 (consumed). Stock on hand: Paint 96.4, Tape 37, Filler 25. Project Side: its `in_progress` history row is dated 10 days back. Media: one new report photo (id 39). 2 `reservation_unmet` notifications.
