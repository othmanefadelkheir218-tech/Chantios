# Tests — Purchases

> Routes: `/api/subcontractors`, `/api/contracts`, `/api/suppliers`, `/api/cost-types`, `/api/purchase-invoices`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [purchase-invoices.md](../purchase-invoices.md), [subcontracting.md](../subcontracting.md), the step file [Phaces/07-purchases.md](../Phaces/07-purchases.md).

## Before you start

- **Guards:** every route carries `@TenantAuth()` + a module key. Subcontractors and contracts → `subcontractors`. Suppliers → `stock`. `GET /cost-types` and every purchase-invoice route → `purchase_invoices`. `POST`/`PATCH` on cost types → `admin` only.
- **Roles:** `purchase_invoices` is **admin and accountant only** (`manager` gets `403`). `subcontractors`: `manager` full, `accountant` view.
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. Also `manager@`, `accountant@dupont.test` and `admin@verhelst.test` (other tenant).
- **No new migration this step** — all 5 tables, the 3 seeded cost types, `chk_purchase_one_source`, `chk_subcontractor_has_project` and the `trg_material_bill_no_project` trigger already existed from step 01's migration.
- **Prerequisites:** a client and two projects (step 04).
- Every record you create should start with `TEST`.
- Money is a string. `vat_amount` and `amount_incl_vat` are computed by the server — never send them.

---

## 1. Subcontractors and contracts

### SUB-01 — Create, then EDIT (a past testing bug was that edit did not work)

`POST /api/subcontractors` `{"company_name":"TEST Plumbing","trade":"plumbing","phone":"+32 475 00 00 00","hourly_rate":"45.00"}` → `201`, `is_active: true`. Then `PATCH /api/subcontractors/:id` `{"trade":"heating","email":"a@b.be"}` → `200`, a re-read shows the change. Confirmed live.

### SUB-02 — Invalid phone → `400`

`{"company_name":"TEST bad","phone":"abc"}` → `400`. Confirmed live.

### SUB-03 — List filters

`GET /api/subcontractors?search=TEST&trade=heating` → paginated `{ data, total, page, limit }`. Confirmed live.

### CON-01 — A contract with no `project_id` → `400`

`POST /api/contracts` `{"subcontractor_id":<id>,"amount_excl_vat":"1000.00"}` → `400`. Confirmed live.

### CON-02 — `end_date` before `start_date` → `400`

`"start_date":"2026-11-10","end_date":"2026-11-01"` → `400` `end_date cannot be before start_date`. Also checked on `PATCH` against the stored start date. Confirmed live.

### CON-03 — Same subcontractor, second project → a NEW contract

Two `POST /api/contracts` with the same `subcontractor_id` and two different `project_id` → two contracts, one directory row. `GET /api/subcontractors/:id/contracts` → `total: 2`. `GET /api/contracts?project_id=&status=` filters. Confirmed live.

### CON-04 — Status: `in_progress` → `completed` / `cancelled`, then final

`PATCH /api/contracts/:id/status` `{"status":"completed"}` → `200`. Then `{"status":"cancelled"}` → `400` (both final states are terminal). `in_progress` → `in_progress` → `400`. A contract on a `cancelled` project → `400`. Confirmed live.

---

## 2. Suppliers

### SUP-01 — Create, edit, archive

`POST /api/suppliers` `{"name":"TEST Brico","phone":"+32 2 111 22 33"}` → `201`. `PATCH` → saved. `DELETE` → `is_active: false`, the row stays. Create and edit confirmed live.

---

## 3. Cost types

### CT-01 — Defaults plus own

`GET /api/cost-types` shows `material`, `subcontractor`, `labor` (`tenant_id: null`). An admin adds `insurance` (`POST`, `201`, carries the caller's `tenant_id`) → it shows in **their** list and **not** in another tenant's. Confirmed live.

### CT-02 — A default can never be edited

`PATCH /api/cost-types/<id of material>` → `404` (the tenant-scoped client never matches a `NULL`-tenant row). Confirmed live.

### CT-03 — Duplicate name → `409`, non-admin → `403`

`POST {"name":"MATERIAL"}` → `409` (case-insensitive, against defaults and own rows). `manager` `POST` → `403`. Confirmed live.

---

## 4. Purchase invoices — the two rules

### PUR-01 — Material bill WITH a project → rejected

`POST /api/purchase-invoices` with `cost_type_id` = `material`, `type: "supplier"`, `supplier_id`, `project_id` → `400` `A material bill cannot carry a project…`. Confirmed live.

### PUR-02 — Material bill, no project → accepted

Same body without `project_id` → `201`. `vat_amount: "21"`, `amount_incl_vat: "121"` for `100.00` at `21.00`. Confirmed live.

### PUR-03 — First bill is `PUR-2026-0001`; 3 parallel creates → 3 distinct numbers

The tenant's first bill → `PUR-2026-0001`. Fire 3 `POST`s in parallel → 3 distinct consecutive numbers, no error. Confirmed live.

### PUR-04 — Source pairing

| Body | Result |
|---|---|
| `type: "supplier"`, no `supplier_id` | `400` |
| `type: "subcontractor"` with a `supplier_id` | `400` |
| `type: "subcontractor"`, no `project_id` | `400` |
| `type: "subcontractor"`, contract + project | `201` |

All confirmed live. A subcontractor bill whose `project_id` is not **the contract's** project → `400`. A negative `amount_excl_vat` → `400`.

### PUR-05 — One contract, two bills

Two `POST`s with the same `subcontractor_contract_id` → both `201`. VAT `6.00` on `500.00` → `30.00` / `530.00`. Confirmed live.

### PUR-06 — A supplier bill with a non-material cost type may carry a project

`cost_type_id` = own `insurance`, `project_id` set → `201`. Confirmed live.

### PUR-07 — The database refuses it too (bypass the app)

Insert straight into Postgres (no handler in front):

```
insert into purchase_invoices(tenant_id,type,cost_type_id,supplier_id,project_id,number,amount_excl_vat,issue_date)
  values (1,'supplier',<material id>,1,1,'X-TRG',10,'2026-10-06');
```

→ `ERROR: A material purchase invoice cannot carry a project_id…` (the trigger). The same for `chk_purchase_one_source` (subcontractor with a supplier; supplier with none) and `chk_subcontractor_has_project`. All four confirmed live.

---

## 5. Update, paid, due-soon

### PUR-08 — `PATCH` re-checks the rules and recomputes VAT

`PATCH` a material bill with `{"project_id":<id>}` → `400`. `PATCH {"amount_excl_vat":"1000.00"}` on a 6 % bill → `vat_amount: 60`, `amount_incl_vat: 1060`. Confirmed live.

### PUR-09 — Mark paid

`POST /api/purchase-invoices/:id/paid` `{"payment_reference":"TRF-1"}` → `200`, `status: "paid"`, `paid_at` set. A second call → `409`. The margin is unaffected (a bill counts from entry). Confirmed live.

### PUR-10 — Due soon

`GET /api/purchase-invoices/due-soon?days=30` → unpaid bills with a `due_date` within 30 days (overdue included); a paid bill leaves the list. Confirmed live. Step 13 wires the alert (`// TODO: step 13`).

### PUR-11 — List filters

`GET /api/purchase-invoices?type=subcontractor&status=paid&project_id=<id>` → filtered, paginated. Confirmed live.

---

## 6. Media (the received PDF)

### MED-01 — PDF only

`POST /api/media` (multipart) `entity_type=purchase_invoice`, `entity_id=<bill id>`, a `.jpg` → `400` `image/jpeg is not allowed for purchase_invoice — allowed: application/pdf`. The same with a PDF → `201`, `file_url` under `/Chantios/tenant-<id>/purchase_invoice/<id>/`. Both confirmed live (the test file was hard-deleted afterwards with `DELETE /api/media/permanent`).

### STK-01 — Link a stock purchase to its bill

`POST /api/stock/purchase` `{"material_id":<id>,"quantity":"20","purchase_invoice_id":<bill id>}` → `201`, `purchase_invoice_id` set on the movement, `project_id: null`. Confirmed live. (The field already existed from step 05.)

---

## 7. Roles and isolation

### ROLE-01 — Who can touch what

- `manager` → `GET /api/purchase-invoices` → `403`. Confirmed live.
- `accountant` → read `200`, create `201`. Confirmed live.
- `manager` creating a cost type → `403` (admin only). Confirmed live.

### ISO-01 — Tenant B sees nothing of tenant A

`admin@verhelst.test`: `GET /api/subcontractors/:id` and `GET /api/purchase-invoices/:id` of tenant A → `404`; `GET /api/suppliers` and `GET /api/purchase-invoices` → none of A's rows; `GET /api/cost-types` does not show A's `insurance`. All confirmed live. The e2e loop in `test/tenant-isolation.e2e-spec.ts` covers these 5 tables automatically.
