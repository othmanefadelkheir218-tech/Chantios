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
| SCT-01 | Create `TEST Plumbing` (trade `plumbing`, phone `+32 475 00 00 00`, `hourly_rate 45.00`) | `201`, `is_active true` | todo |
| SCT-02 | **Edit** it: trade `heating`, email `gryehirir+plumb@gmail.com` | `200`, the re-read shows it | todo |
| SCT-03 | Bad phone | `400` | todo |
| SCT-04 | Create `TEST Electric` and `TEST Roofing` | `201` both — 3 active on a 2-subcontractor plan, **no error** | todo |
| SCT-05 | `GET /api/subcontractors?search=TEST&trade=heating` | filtered, paginated | todo |
| CON-01 | Contract with no `project_id` | `400` | todo |
| CON-02 | `end_date` before `start_date` (create, and on `PATCH` against the stored start) | `400` | todo |
| CON-03 | `TEST Plumbing` on Project Main (`2500.00`) and on Project Second | 2 contracts, one directory row; `GET /api/subcontractors/:id/contracts` → `total 2` | todo |
| CON-04 | Contract on `TEST Project Cancel` (cancelled) | `400` | todo |
| CON-05 | Status `completed` on the Second contract, then `cancelled`; `in_progress → in_progress` | `200`, then `400` (final), `400` | todo |

## 2. Suppliers and cost types

| ID | Do | Expected | Result |
|---|---|---|---|
| SUP-01 | Create `TEST Brico` supplier, edit it, create `TEST Archive` and delete it | `201`, `200`, `is_active false` (row kept) | todo |
| CT-01 | `GET /api/cost-types` | `material`, `subcontractor`, `labor` (`tenant_id null`) | todo |
| CT-02 | Owner adds `insurance` | `201` — in A's list, **not** B's | todo |
| CT-03 | `PATCH` the `material` default | `404` | todo |
| CT-04 | `POST { "name": "MATERIAL" }` | `409` (case-insensitive, against defaults too) | todo |
| CT-05 | Manager adds a cost type | `403` | todo |

## 3. Purchase invoices — the two rules

| ID | Do | Expected | Result |
|---|---|---|---|
| PUR-01 | Supplier bill, cost type `material`, **with** `project_id` | `400 A material bill cannot carry a project…` | todo |
| PUR-02 | Same, no project, `100.00` at 21% | `201`, `PUR-2026-0001`, `vat_amount 21`, `amount_incl_vat 121` | todo |
| PUR-03 | 3 creates at the same moment | 3 distinct consecutive `PUR-` numbers | todo |
| PUR-04 | Source pairing: `supplier` without `supplier_id` → `400`; `subcontractor` with a `supplier_id` → `400`; `subcontractor` without project → `400`; `subcontractor` with a project that is not the contract's → `400` | as stated | todo |
| PUR-05 | Subcontractor bill on the Main contract, Project Main, `2500.00` at 21% | `201` — stays `to_pay` (phase 12 uses it) | todo |
| PUR-06 | A second bill on the same contract, `500.00` at 6% | `201`, `vat 30`, `incl 530` | todo |
| PUR-07 | Supplier bill, cost type `insurance`, **with** a project | `201` — only `material` forbids a project | todo |
| PUR-08 | Negative amount | `400` | todo |
| PUR-09 | **Database**, bypassing the app: insert a material bill with a `project_id`; a subcontractor bill with a `supplier_id`; a supplier bill with none; a subcontractor bill with no project | all refused (`trg_material_bill_no_project`, `chk_purchase_one_source`, `chk_subcontractor_has_project`) | todo |
| PUR-10 | `PATCH` the material bill with a `project_id`; `PATCH` the 6% bill to `1000.00` | `400`; `vat 60`, `incl 1060` | todo |
| PUR-11 | `POST .../paid { "payment_reference": "TRF-1" }` on the 6% bill; again | `200 paid`, `paid_at`; `409` | todo |
| PUR-12 | Bill due in 5 days (unpaid) → `GET /api/purchase-invoices/due-soon?days=30` | listed; the paid bill is not | todo |
| PUR-13 | List filters `?type=&status=&project_id=&cost_type_id=` | filtered | todo |
| PUR-14 | Upload a JPG to `entity_type=purchase_invoice`; then a PDF | `400 ... allowed: application/pdf`; `201` | todo |
| PUR-15 | **[CHECK IMAGEKIT]** | the PDF is in `tenant-<A>/purchase_invoice/<bill id>/` | todo |
| PUR-16 | `POST /api/stock/purchase` Filler `10` with `purchase_invoice_id` = the PUR-02 bill | `201`, the movement carries the link, `project_id null` | todo |

## 4. Roles and isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-PU-01 | Manager: `GET /api/purchase-invoices` | `403` | todo |
| ROL-PU-02 | Accountant: read `200`, create `201`; `POST /api/subcontractors` → `403` | as stated | todo |
| ISO-PU-01 | B owner: A's subcontractor, bill and supplier by id; `GET /api/cost-types` | `404` each; no `insurance` in B's list | todo |
