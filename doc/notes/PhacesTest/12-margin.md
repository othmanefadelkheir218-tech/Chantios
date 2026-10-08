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
| MAR-01 | `GET /api/projects/<Margin>/margin` with no accepted quote | `200`, `budget "0"`, `margin_pct null`, no error | todo |
| MAR-02 | Accept a `10000.00` quote (free-text line) | `budget 10000`, `margin_pct 100` | todo |
| MAR-03 | Accept a second `1500.00` quote | `budget 11500` | todo |
| MAR-04 | `GET /api/projects/<Margin>/budget-history` | 2 quotes by `accepted_at`, `budget_after` `10000` then `11500` | todo |
| MAR-05 | Supervisor report + declare `TEST Brick` `40` | `material_cost 400`; then Brick price → `99.00`: still `400` | todo |
| MAR-06 | Worker logs `10` h on 2 days (rate `20`) | `labor_cost 400`; worker rate → `45.00`: still `400` (set back after) | todo |
| MAR-07 | Subcontractor bill `2500.00`, `to_pay` | `bill_cost 2500` at once | todo |
| MAR-08 | Mark it paid | margin unchanged | todo |
| MAR-09 | A `material` bill with no project (also with explicit `"project_id": null`) | not in `bill_cost` | todo |
| MAR-10 | The total | `total_cost 3300`, `margin_excl_vat 8200`, `margin_pct 71.3` | todo |

## 2. Breakdown

| ID | Do | Expected | Result |
|---|---|---|---|
| MAR-11 | `GET /api/projects/<Margin>/margin/breakdown` | `material 400`, `labor 400`, `subcontractor 2500`, `total_cost 3300` | todo |
| MAR-12 | A supplier bill with cost type `insurance` (`200.00`) on Margin | a **4th** line `insurance 200`, no code change | todo |

## 3. The 80 / 95 % alerts — each fires once

`TEST Project Alerts`: accept a `10000.00` quote, then supplier bills with cost type `insurance` on it.

| ID | Bill | Total | Expected (`project_margin_alerts` rows) | Result |
|---|---|---|---|---|
| ALT-01 | `7900` | 79 % | 0 rows, nothing sent | todo |
| ALT-02 | `100` | 80 % | **1** row — one `margin_warning` to admin + manager | todo |
| ALT-03 | `300` | 83 % | still 1 — **nothing sent** | todo |
| ALT-04 | `1200` | 95 % | **2** rows — one `margin_critical` | todo |
| ALT-05 | `10` | 95 %+ | nothing new | todo |
| ALT-06 | accept a `5000` quote | 63 % of 15000 | **0** rows — both deleted | todo |
| ALT-07 | `2500` | 80 % of 15000 | warning fires **again**, 1 row | todo |
| ALT-08 | **[CHECK EMAIL]** owner `othmanefadelkheir218@gmail.com` and manager `zakariyazouazou@gmail.com` | exactly: warning (ALT-02), critical (ALT-04), warning (ALT-07) — no duplicates | todo |

## 4. Snapshot on `completed`

| ID | Do | Expected | Result |
|---|---|---|---|
| SNP-01 | `GET /api/projects/<Margin>/snapshot` while running | `404 This project has no closure snapshot` | todo |
| SNP-02 | `→ completed` | snapshot = the live numbers, `voided_at null`, one cost row per type, rows sum to `total_cost`; status + history + snapshot in one transaction | todo |
| SNP-03 | After closing: change Brick's price and add a late `700` bill | live view `+700`; snapshot **identical** (same id, same total) | todo |
| SNP-04 | Manager reopens | `403`, snapshot untouched | todo |
| SNP-05 | Owner reopens | `200`; snapshot gets `voided_at` + `voided_by`, row still exists; `GET snapshot` → `404` | todo |
| SNP-06 | Close again | 2 snapshot rows, exactly one with `voided_at null`, the new one includes the late bill | todo |
| SNP-07 | `completed → cancelled` | `400` (not in the matrix) | todo |

## 5. Snapshot on `cancelled`

| ID | Do | Expected | Result |
|---|---|---|---|
| SNP-08 | `TEST Project Stop`: accept a `4000.00` quote, a `3000.00` insurance bill, then cancel with a reason | snapshot `total_cost 3000`, `margin 1000`; reservations released | todo |
| SNP-09 | A bill after the cancel | live `3500`, snapshot stays `3000`; `cancelled → in_progress` `400` — never voided | todo |

## 6. List, roles, isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| MAR-13 | `GET /api/margins` | one row per active project, worst first, no-quote project with `margin_pct null`; `?status=completed` / `cancelled` lists closed ones | todo |
| MAR-14 | Manager, accountant `200`; supervisor, worker, leader, sales `403` on every margin route | as stated | todo |
| MAR-15 | `POST /api/margins`, `PATCH /api/projects/:id/margin` | `404` — no write route | todo |
| ISO-MA-01 | B owner on A's margin, breakdown, snapshot, budget-history → `404`; `GET /api/margins` → `total 0` | as stated | todo |
