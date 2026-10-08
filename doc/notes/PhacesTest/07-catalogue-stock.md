# Phase 07 — Catalogue & Stock

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md).
> Old reference: [../test/09-catalogue-stock.md](../test/09-catalogue-stock.md).

## Goal

The catalogue, the recipe, and the stock ledger: no stored quantity, append-only, frozen prices, soft alerts.

## Before you start

The data built here is reused by phases 08–12:

| Name | Unit | Price | Minimum |
|---|---|---|---|
| Material `TEST Paint` | `l` | `6.00` | `10` |
| Material `TEST Tape` | `piece` | `2.00` | `5` |
| Material `TEST Filler` | `kg` | `4.00` | `5` |
| Service `TEST Painting` | `m2` | `25.00`, VAT `6.00` | recipe: Paint `0.15`, Tape `0.05`, Filler `0.02` per m² |
| Service `TEST Labour` | `h` | `45.00`, VAT `21.00` | no recipe |

---

## 1. Categories

| ID | Do | Expected | Result |
|---|---|---|---|
| CAT-01 | `GET /api/categories` | the 10 shared defaults (`tenant_id null`), flat list | PASS |
| CAT-02 | Owner creates `TEST Finishing` | `201`, carries A's `tenant_id`; appears in A's list, **not** in B's | PASS |
| CAT-03 | `PATCH` / `DELETE` a shared default | `404 Category not found` | PASS |
| CAT-04 | `PATCH` the own category; `DELETE` it then recreate | `200`; `is_active false` | PASS |
| CAT-05 | Manager creates a category | `403` | PASS |

## 2. Services and recipe

| ID | Do | Expected | Result |
|---|---|---|---|
| SVC-01 | Create the 3 materials and 2 services above | `201` each | PASS |
| SVC-02 | `PUT /api/services/<Painting>/recipe` with a 3-row recipe of wrong values, then the real 3 rows | `200`; `GET recipe` → exactly the real 3 rows | PASS |
| SVC-03 | `PUT` with a single row, then back to the 3 real rows | old rows gone each time — whole replace, one transaction | PASS |
| SVC-04 | Recipe with `quantity_per_unit 0` or a material of B | `400` / `404` | PASS |
| SVC-05 | `GET /api/services?category_id=&search=` | filtered | PASS |

## 3. Materials and the ledger

| ID | Do | Expected | Result |
|---|---|---|---|
| MAT-01 | `GET /api/materials/<Paint>` | no `quantity` key; `on_hand 0`, `reserved 0`, `available 0` | PASS |
| MAT-02 | `GET /api/materials/low-stock` | all 3 materials (0 ≤ minimum) | PASS |
| STK-01 | `POST /api/stock/purchase` Paint `100`, Tape `40`, Filler `20` | `201`, `project_id null`, `unit_price` = the purchase price; `on_hand` 100 / 40 / 20 | PASS |
| STK-02 | Purchase with `project_id` | `400 property project_id should not exist` | PASS |
| STK-03 | Purchase `-5` or `0` | `400 quantity must be positive` | PASS |
| STK-04 | Paint purchase price `6.00 → 9.00`, then `GET /api/stock/movements?material_id=<Paint>` | the old row still `6.00`; set back to `6.00` | PASS |
| STK-05 | Adjustment with no `note` | `400 note should not be empty` | PASS |
| STK-06 | Manager: adjustment Tape `-38`, note `TEST damaged` | `201`, `on_hand 2`; Tape joins `low-stock` | PASS |
| STK-07 | Worker / sales / supervisor: adjustment | `403` | PASS |
| STK-08 | `GET /api/stock/movements?material_id=&type=&from=&to=` | filtered; there is no `PATCH` or `DELETE` on a movement (`404`) | PASS |
| STK-09 | Owner: adjustment Tape `+38`, note `TEST correction` | `on_hand 40` again — the fix is a new row, the old one stays | PASS |

## 4. Reservations

Reservations are created by **accepting a quote** (phase 08, QUO-09 and QUO-11 → Paint 9, Tape 3, Filler 1.2) and consumed by **site reports** (phase 11). They are checked there, through the real routes. What is checked here:

| ID | Do | Expected | Result |
|---|---|---|---|
| RES-01 | `GET /api/stock/reservations` | empty — no quote accepted yet | PASS |
| RES-02 | There is no `POST /api/stock/consumption` and no reservation create route | `404` | PASS |

## 5. Roles and isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-CS-01 | Worker: `GET /api/materials`, `POST /api/stock/purchase` | `403` | PASS |
| ROL-CS-02 | Supervisor: `GET /api/materials` → `200`, `POST /api/materials` → `403` | as stated | PASS |
| ISO-CS-01 | B owner: A's material and service by id | `404`; B's movements list has none of A's rows | PASS |

## Result — 2026-10-08

**26 PASS, 0 FAIL, 0 SKIP.**

- Materials use the field `description` (not `name`): `TEST Paint` is `description`.
- STK-05: the `400` lists `note should not be empty` and `note must be a string` (plan text matches the first).
- STK-07 / ROL-CS-02 messages are `Insufficient role` and `No canCreate access to stock` — both `403`. The supervisor's `POST /materials` is refused by the **stock** permission, not a materials one (materials share the `stock` module).
- STK-04: price `6.00 → 9.00 → 6.00`; the purchase row stayed `6`.

### Data left

Categories (A): 12 `TEST Finishing` (active), 11 `TEST Finishing 2` (inactive). Materials: 1 `TEST Paint` (on hand 100), 2 `TEST Tape` (40), 3 `TEST Filler` (20); 4 `TEST B Mat` (company B). Services: 1 `TEST Painting` (m², 25, VAT 6, recipe 0.15 / 0.05 / 0.02), 2 `TEST Labour` (h, 45, VAT 21; category 12). Stock movements: 3 purchases + 2 Tape adjustments (−38, +38). No reservations.
