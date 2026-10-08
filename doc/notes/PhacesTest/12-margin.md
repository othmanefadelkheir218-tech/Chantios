# Phase 12 — Margin & Closure Snapshot

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [margin-profitability.md](../margin-profitability.md), [technical/phase-08-margin-snapshot.md](../technical/phase-08-margin-snapshot.md).
> Old reference: [../test/14-margin.md](../test/14-margin.md).

## Goal

The live margin from three doors only (material, labour, bills), the breakdown by cost type, the 80 / 95 % alerts that fire once, and the snapshot frozen on `completed` and `cancelled`.

```
margin_excl_vat = budget − material_cost − labor_cost − bill_cost
margin_pct      = margin / budget × 100        (NULL when budget = 0)
```

## Before you start

Three new projects with clean numbers, all for `TEST Client Main`:

| Project | Use |
|---|---|
| `TEST Project Margin` | sections 1, 2, 4 |
| `TEST Project Alerts` | section 3 |
| `TEST Project Stop` | section 5 |

Extra data: material `TEST Brick` (`10.00`, buy 100), the worker assigned to a task on Margin, a `TEST Plumbing` contract on Margin.

---

## 1. The live margin

| ID | Do | Expected | Result |
|---|---|---|---|
| MAR-01 | `GET /api/projects/<Margin>/margin` with no accepted quote | `200`, `budget "0"`, `margin_pct null`, no error | PASS |
| MAR-02 | Accept a `10000.00` quote (free-text line) | `budget 10000`, `margin_pct 100` | PASS |
| MAR-03 | Accept a second `1500.00` quote | `budget 11500` | PASS |
| MAR-04 | `GET /api/projects/<Margin>/budget-history` | 2 quotes by `accepted_at`, `budget_after` `10000` then `11500` | PASS |
| MAR-05 | Supervisor report + declare `TEST Brick` `40` | `material_cost 400`; then Brick price → `99.00`: still `400` | PASS |
| MAR-06 | Worker logs `10` h on 2 days (rate `20`) | `labor_cost 400`; worker rate → `45.00`: still `400` (set back after) | PASS |
| MAR-07 | Subcontractor bill `2500.00`, `to_pay` | `bill_cost 2500` at once | PASS |
| MAR-08 | Mark it paid | margin unchanged | PASS |
| MAR-09 | A `material` bill with no project (also with explicit `"project_id": null`) | not in `bill_cost` | PASS |
| MAR-10 | The total | `total_cost 3300`, `margin_excl_vat 8200`, `margin_pct 71.3` | PASS |

## 2. Breakdown

| ID | Do | Expected | Result |
|---|---|---|---|
| MAR-11 | `GET /api/projects/<Margin>/margin/breakdown` | `material 400`, `labor 400`, `subcontractor 2500`, `total_cost 3300` | PASS |
| MAR-12 | A supplier bill with cost type `insurance` (`200.00`) on Margin | a **4th** line `insurance 200`, no code change | PASS |

## 3. The 80 / 95 % alerts — each fires once

`TEST Project Alerts`: accept a `10000.00` quote, then supplier bills with cost type `insurance` on it.

| ID | Bill | Total | Expected (`project_margin_alerts` rows) | Result |
|---|---|---|---|---|
| ALT-01 | `7900` | 79 % | 0 rows, nothing sent | PASS |
| ALT-02 | `100` | 80 % | **1** row — one `margin_warning` to admin + manager | PASS |
| ALT-03 | `300` | 83 % | still 1 — **nothing sent** | PASS |
| ALT-04 | `1200` | 95 % | **2** rows — one `margin_critical` | PASS |
| ALT-05 | `10` | 95 %+ | nothing new | PASS |
| ALT-06 | accept a `5000` quote | 63 % of 15000 | **0** rows — both deleted | PASS |
| ALT-07 | `2500` | 80 % of 15000 | warning fires **again**, 1 row | PASS |
| ALT-08 | **[CHECK EMAIL]** owner `othmanefadelkheir218@gmail.com` and manager `zakariyazouazou@gmail.com` | exactly: warning (ALT-02), critical (ALT-04), warning (ALT-07) — no duplicates | waiting |

## 4. Snapshot on `completed`

| ID | Do | Expected | Result |
|---|---|---|---|
| SNP-01 | `GET /api/projects/<Margin>/snapshot` while running | `404 This project has no closure snapshot` | PASS |
| SNP-02 | `→ completed` | snapshot = the live numbers, `voided_at null`, one cost row per type, rows sum to `total_cost`; status + history + snapshot in one transaction | PASS |
| SNP-03 | After closing: change Brick's price and add a late `700` bill | live view `+700`; snapshot **identical** (same id, same total) | PASS |
| SNP-04 | Manager reopens | `403`, snapshot untouched | PASS |
| SNP-05 | Owner reopens | `200`; snapshot gets `voided_at` + `voided_by`, row still exists; `GET snapshot` → `404` | PASS |
| SNP-06 | Close again | 2 snapshot rows, exactly one with `voided_at null`, the new one includes the late bill | PASS |
| SNP-07 | `completed → cancelled` | `400` (not in the matrix) | PASS |

## 5. Snapshot on `cancelled`

| ID | Do | Expected | Result |
|---|---|---|---|
| SNP-08 | `TEST Project Stop`: accept a `4000.00` quote, a `3000.00` insurance bill, then cancel with a reason | snapshot `total_cost 3000`, `margin 1000`; reservations released | PASS |
| SNP-09 | A bill after the cancel | live `3500`, snapshot stays `3000`; `cancelled → in_progress` `400` — never voided | PASS |

## 6. List, roles, isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| MAR-13 | `GET /api/margins` | one row per active project, worst first, no-quote project with `margin_pct null`; `?status=completed` / `cancelled` lists closed ones | PASS |
| MAR-14 | Manager, accountant `200`; supervisor, worker, leader, sales `403` on every margin route | as stated | PASS |
| MAR-15 | `POST /api/margins`, `PATCH /api/projects/:id/margin` | `404` — no write route | PASS |
| ISO-MA-01 | B owner on A's margin, breakdown, snapshot, budget-history → `404`; `GET /api/margins` → `total 0` | as stated | PASS |

---

## Result — 2026-10-09

**32 PASS, 0 FAIL, 1 waiting** (ALT-08, the owner's email check — asked on Telegram).

Data: `TEST Project Margin` = 11, `TEST Project Alerts` = 12, `TEST Project Stop` = 13, `TEST Brick` = 5 (price left at `50.00`), task 7, contract 3 (`TEST Plumbing`, `2500`).

- Setup: `POST /api/projects` with a date-only `start_date`/`end_date` answered `500` (same as PRJ-01, phase 06). Full ISO datetimes worked.
- MAR-02..04: budget `10000` → `11500`; budget history `QUO-2026-0013` / `QUO-2026-0014`, `budget_after` `10000`, `11500`.
- MAR-05/06: Brick frozen at `10` (`400`) after the price went to `99`; worker frozen at `20` (`400`) after the rate went to `45` (rate set back to `20`). MAR-10: `3300` / `8200` / `71.3`.
- MAR-09: a material bill with no `project_id` and with `"project_id": null` both `201`, not in `bill_cost`.
- ALT: `notifications` rows added: +2 (owner and manager) at ALT-02 (warning), +2 at ALT-04 (critical), +0 at ALT-03 and ALT-05, rows deleted at ALT-06 (`none`), +2 at ALT-07 (warning again). Final rows: `warning` only.
- SNP-02: snapshot id 4 (`3500`, `8000`, cost rows `200 + 400 + 400 + 2500`). SNP-03: live `4200`, snapshot id 4 unchanged. SNP-04: `403 Only an admin can reopen a completed project`. SNP-05: row 4 `voided_at` set, `voided_by` 1, `GET snapshot` → `404`. SNP-06: snapshot id 5 (`4200`, insurance `900`), one live row. SNP-07: `400 Cannot move a project from completed to cancelled`.
- SNP-08: snapshot id 6 (`3000`, margin `1000`); the 3 reservations (Paint 15, Tape 5, Filler 2) went `active` → `released`. SNP-09: live `3500`, snapshot `3000`; `cancelled → in_progress` `400`.
- MAR-13: active list worst first (`-435`, `-170.39`, `19.93`, then `null`s). MAR-14: admin, manager, accountant `200` on all 5 routes; supervisor, worker, leader, sales `403` on all 5.
- ISO-MA-01: B's owner gets `404` on A's margin, breakdown, snapshot, budget-history. `GET /api/margins` for B shows `total 1`, not `0`: B has its own `TEST B Project` (id 8, from phase 06). None of A's projects appear — isolation holds, the "total 0" in the scenario assumed B had no project.
- Not checked: that the status change, history and snapshot are written in one transaction (needs a forced failure) — only the result is seen.
- ALT-08 (email): expected in each of the two inboxes, for project Alerts around 00:52: warning, critical, warning.
