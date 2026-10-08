# Phase 09 — Purchases

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [purchase-invoices.md](../purchase-invoices.md), [subcontracting.md](../subcontracting.md).
> Old reference: [../test/11-purchases.md](../test/11-purchases.md).

## Goal

The subcontractor and supplier directories, contracts per project, and one `purchase_invoices` table with its two rules — enforced by the app **and** by the database.

## Before you start

- `TEST Project Main` is `in_progress` (phase 08). Create `TEST Project Second` (prospect) for the second contract.
- `TEST Small` allows 2 subcontractors. This phase creates **3 active subcontractors** — no error expected (billed in phase 18).
- Subcontractor and supplier emails use `gryehirir+<tag>@gmail.com`. No email is sent to them by the app.
- Purchase invoices: **admin and accountant only**.

---

## 1. Subcontractors and contracts

| ID | Do | Expected | Result |
|---|---|---|---|
| SCT-01 | Create `TEST Plumbing` (trade `plumbing`, phone `+32 475 00 00 00`, `hourly_rate 45.00`) | `201`, `is_active true` | PASS |
| SCT-02 | **Edit** it: trade `heating`, email `gryehirir+plumb@gmail.com` | `200`, the re-read shows it | PASS |
| SCT-03 | Bad phone | `400` | PASS |
| SCT-04 | Create `TEST Electric` and `TEST Roofing` | `201` both — 3 active on a 2-subcontractor plan, **no error** | PASS |
| SCT-05 | `GET /api/subcontractors?search=TEST&trade=heating` | filtered, paginated | PASS |
| CON-01 | Contract with no `project_id` | `400` | PASS |
| CON-02 | `end_date` before `start_date` (create, and on `PATCH` against the stored start) | `400` | PASS |
| CON-03 | `TEST Plumbing` on Project Main (`2500.00`) and on Project Second | 2 contracts, one directory row; `GET /api/subcontractors/:id/contracts` → `total 2` | PASS |
| CON-04 | Contract on `TEST Project Cancel` (cancelled) | `400` | PASS |
| CON-05 | Status `completed` on the Second contract, then `cancelled`; `in_progress → in_progress` | `200`, then `400` (final), `400` | PASS |

## 2. Suppliers and cost types

| ID | Do | Expected | Result |
|---|---|---|---|
| SUP-01 | Create `TEST Brico` supplier, edit it, create `TEST Archive` and delete it | `201`, `200`, `is_active false` (row kept) | PASS |
| CT-01 | `GET /api/cost-types` | `material`, `subcontractor`, `labor` (`tenant_id null`) | PASS |
| CT-02 | Owner adds `insurance` | `201` — in A's list, **not** B's | PASS |
| CT-03 | `PATCH` the `material` default | `404` | PASS |
| CT-04 | `POST { "name": "MATERIAL" }` | `409` (case-insensitive, against defaults too) | PASS |
| CT-05 | Manager adds a cost type | `403` | PASS |

## 3. Purchase invoices — the two rules

| ID | Do | Expected | Result |
|---|---|---|---|
| PUR-01 | Supplier bill, cost type `material`, **with** `project_id` | `400 A material bill cannot carry a project…` | PASS |
| PUR-02 | Same, no project, `100.00` at 21% | `201`, `PUR-2026-0001`, `vat_amount 21`, `amount_incl_vat 121` | PASS |
| PUR-03 | 3 creates at the same moment | 3 distinct consecutive `PUR-` numbers | PASS |
| PUR-04 | Source pairing: `supplier` without `supplier_id` → `400`; `subcontractor` with a `supplier_id` → `400`; `subcontractor` without project → `400`; `subcontractor` with a project that is not the contract's → `400` | as stated | PASS |
| PUR-05 | Subcontractor bill on the Main contract, Project Main, `2500.00` at 21% | `201` — stays `to_pay` (phase 12 uses it) | PASS |
| PUR-06 | A second bill on the same contract, `500.00` at 6% | `201`, `vat 30`, `incl 530` | PASS |
| PUR-07 | Supplier bill, cost type `insurance`, **with** a project | `201` — only `material` forbids a project | PASS |
| PUR-08 | Negative amount | `400` | PASS |
| PUR-09 | **Database**, bypassing the app: insert a material bill with a `project_id`; a subcontractor bill with a `supplier_id`; a supplier bill with none; a subcontractor bill with no project | all refused (`trg_material_bill_no_project`, `chk_purchase_one_source`, `chk_subcontractor_has_project`) | PASS |
| PUR-10 | `PATCH` the material bill with a `project_id`; `PATCH` the 6% bill to `1000.00` | `400`; `vat 60`, `incl 1060` | PASS |
| PUR-11 | `POST .../paid { "payment_reference": "TRF-1" }` on the 6% bill; again | `200 paid`, `paid_at`; `409` | PASS |
| PUR-12 | Bill due in 5 days (unpaid) → `GET /api/purchase-invoices/due-soon?days=30` | listed; the paid bill is not | PASS |
| PUR-13 | List filters `?type=&status=&project_id=&cost_type_id=` | filtered | PASS |
| PUR-14 | Upload a JPG to `entity_type=purchase_invoice`; then a PDF | `400 ... allowed: application/pdf`; `201` | PASS |
| PUR-15 | **[CHECK IMAGEKIT]** | the PDF is in `tenant-<A>/purchase_invoice/<bill id>/` | PASS (owner confirmed in ImageKit, 2026-10-08) |
| PUR-16 | `POST /api/stock/purchase` Filler `10` with `purchase_invoice_id` = the PUR-02 bill | `201`, the movement carries the link, `project_id null` | PASS |

## 4. Roles and isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-PU-01 | Manager: `GET /api/purchase-invoices` | `403` | PASS |
| ROL-PU-02 | Accountant: read `200`, create `201`; `POST /api/subcontractors` → `403` | as stated | PASS |
| ISO-PU-01 | B owner: A's subcontractor, bill and supplier by id; `GET /api/cost-types` | `404` each; no `insurance` in B's list | PASS |

## Result — 2026-10-08

**33 PASS, 0 FAIL, 0 SKIP.** PUR-15 confirmed by the owner (screenshot of folder `1`: `bill_RnWG98E…pdf` present).

- PUR-09: all 4 direct inserts refused (trigger for the material bill; `chk_purchase_one_source` x2; `chk_subcontractor_has_project`); no test row left. Sequence ids skipped (bill ids 8–11 burned), numbers unaffected.
- CON-01 message: `project_id must be an integer number`. CON-04: `Cannot create a contract on a cancelled project`.
- PUR-12: due-soon lists only the unpaid bill due in 5 days (PUR-2026-0008); the paid PUR-0006 is not listed.
- 3 active subcontractors on the 2-subcontractor plan: no error (phase 18 bills it).

### Data left

Project 9 `TEST Project Second` (prospect). Subcontractors 1 `TEST Plumbing` (heating), 2 `TEST Electric`, 3 `TEST Roofing`. Contracts: 1 on Main (2500, in_progress), 2 on Second (completed). Suppliers: 1 `TEST Brico`, 2 `TEST Archive` (inactive). Cost type 4 `insurance` (A). Purchase invoices PUR-2026-0001 (material, Filler purchase linked, PDF media 37), 0002–0004 (material), 0005 (2500 @21, to_pay), 0006 (1000 @6, paid), 0007 (insurance on Main), 0008 (insurance, due 2026-10-13), 0009 (accountant). Stock: Filler +10 (on hand 30).
