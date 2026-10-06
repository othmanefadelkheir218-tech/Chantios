# Step 07 — Purchases  *(phase 06)*

> Money out. Subcontractors, suppliers, and every bill the company receives.

## Goal

The subcontractor and supplier directories, contracts per project, and one `purchase_invoices` table for both kinds of bill.

## Decide first

**None.** Fully specified.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 7.

| Table | Purpose |
|---|---|
| `subcontractors` | the directory — created once, reused on every project |
| `suppliers` | same shape, for material suppliers |
| `subcontractor_contracts` | one engagement per project. `project_id` **required** |
| `cost_types` | nullable `tenant_id`, 3 seeded rows, a tenant may add its own |
| `purchase_invoices` | **every** bill received, both kinds |

### `type` and `cost_type_id` answer two different questions

| Column | Question |
|---|---|
| `type` | **who** sent us the paper — `subcontractor` / `supplier` |
| `cost_type_id` | **what kind of cost** it is — the margin reads this one |

| Case | `type` | `cost_type` | `project_id` | In the margin? |
|---|---|---|---|---|
| Plumber on one job | `subcontractor` | `subcontractor` | **required** | yes |
| Tiles, any reason | `supplier` | `material` | **always NULL** | no — counted when consumed |

### Why a material bill never carries a project

Material cost has exactly one source: the `consumption` rows in `stock_movements`. Every material passes through the stock, even a delivery straight to site — one `purchase` row the day it arrives, one `consumption` row the day it is used. If the bill also carried a project, the same tiles would be counted **twice**.

This is enforced by a **trigger**, not a `CHECK`, because it has to read `cost_types.name`:

```sql
CREATE TRIGGER trg_material_bill_no_project
  BEFORE INSERT OR UPDATE ON purchase_invoices ...
```

Full function in [Schema Proposal.md](../../Schema%20Proposal.md) § 7. Write it in the migration — it is the guard that makes the double count impossible by construction rather than by a `WHERE` someone can forget.

### Buying stock writes two rows

| Table | Question it answers |
|---|---|
| `stock_movements` (`purchase`) | how many units do we now have? |
| `purchase_invoices` (`supplier`) | how much do we owe, to whom, by when? |

Both are recorded. A movement with no bill is fine (a correction). A bill with no movement is fine (transport, a service). When both exist they are linked by `stock_movements.purchase_invoice_id`.

## Modules to create

```
src/
├── subcontractors/     (directory CRUD + contracts — one domain)
│   ├── dto/create-subcontractor.dto.ts, update-subcontractor.dto.ts,
│   │       create-contract.dto.ts, update-contract.dto.ts, find-*-query.dto.ts
│   ├── handlers/create-subcontractor.handler.ts, find-subcontractors.handler.ts,
│   │            update-subcontractor.handler.ts, archive-subcontractor.handler.ts,
│   │            create-contract.handler.ts, find-contracts.handler.ts,
│   │            update-contract.handler.ts, set-contract-status.handler.ts
│   ├── repositories/subcontractor.repository.ts, contract.repository.ts
│   └── ...
├── suppliers/          (small: directory CRUD)
├── cost-types/         (small: list + tenant-own CRUD, shared-defaults reader)
└── purchase-invoices/
    ├── dto/create-purchase-invoice.dto.ts, update-purchase-invoice.dto.ts,
    │       mark-paid.dto.ts, find-purchase-invoices-query.dto.ts
    ├── handlers/create-purchase-invoice.handler.ts, find-purchase-invoices.handler.ts,
    │            find-purchase-invoice.handler.ts, update-purchase-invoice.handler.ts,
    │            mark-paid.handler.ts, due-soon.handler.ts
    ├── helpers/purchase-invoice.helper.ts    (the source + cost-type rules)
    ├── repositories/purchase-invoice.repository.ts
    └── ...
```

`cost-types` reads with `WHERE tenant_id IS NULL OR tenant_id = :current`, the same dedicated-method rule as `categories` in step 05.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/subcontractors` | `subcontractors:create` | |
| `GET` | `/api/subcontractors` | `subcontractors:view` | `?search=&trade=` |
| `GET` | `/api/subcontractors/:id` | `subcontractors:view` | |
| `PATCH` | `/api/subcontractors/:id` | `subcontractors:edit` | **editable** — a testing bug was that it was not |
| `DELETE` | `/api/subcontractors/:id` | `subcontractors:delete` | `is_active = false` |
| `GET` | `/api/subcontractors/:id/contracts` | `subcontractors:view` | history across projects |
| `POST` | `/api/contracts` | `subcontractors:create` | `project_id` required |
| `GET` | `/api/contracts` | `subcontractors:view` | `?project_id=&status=` |
| `PATCH` | `/api/contracts/:id` | `subcontractors:edit` | |
| `PATCH` | `/api/contracts/:id/status` | `subcontractors:edit` | `in_progress`/`completed`/`cancelled` |
| `POST` | `/api/suppliers` | `stock:create` | |
| `GET` | `/api/suppliers` | `stock:view` | |
| `PATCH` | `/api/suppliers/:id` | `stock:edit` | |
| `DELETE` | `/api/suppliers/:id` | `stock:delete` | `is_active = false` |
| `GET` | `/api/cost-types` | `purchase_invoices:view` | defaults **+** own |
| `POST` | `/api/cost-types` | `admin` | own row only |
| `PATCH` | `/api/cost-types/:id` | `admin` | own rows only, never a `NULL` default |
| `POST` | `/api/purchase-invoices` | `purchase_invoices:create` | both kinds, one endpoint |
| `GET` | `/api/purchase-invoices` | `purchase_invoices:view` | `?type=&status=&project_id=&cost_type_id=` |
| `GET` | `/api/purchase-invoices/:id` | `purchase_invoices:view` | |
| `PATCH` | `/api/purchase-invoices/:id` | `purchase_invoices:edit` | |
| `POST` | `/api/purchase-invoices/:id/paid` | `purchase_invoices:edit` | `paid_at`, `payment_reference` |
| `GET` | `/api/purchase-invoices/due-soon` | `purchase_invoices:view` | the cron's query |

The received PDF is attached through step 03's media endpoint with `entity_type = 'purchase_invoice'`. **There is no `document_url` column.**

## DTOs

### `create-subcontractor.dto.ts`
`company_name` required. `trade`, `email` `@IsEmail`, `phone` `@Matches` the format, `vat_number`, `hourly_rate` `@IsNumberString` all optional.

### `create-contract.dto.ts`
`subcontractor_id` `@IsInt` **required**. `project_id` `@IsInt` **required**. `description` optional. `amount_excl_vat` `@IsNumberString @Min(0)`. `start_date`, `end_date` optional — **end not before start**.

### `create-purchase-invoice.dto.ts`
`type` `@IsIn(['subcontractor','supplier'])`. `cost_type_id` `@IsInt` **required**. `subcontractor_contract_id` optional integer. `supplier_id` optional integer. `project_id` optional integer. `external_number` optional. `amount_excl_vat` `@IsNumberString @Min(0)`. `vat_rate` `@IsNumberString`. `issue_date` **required** ISO date. `due_date` optional. `payment_reference` optional.

Validate the source pairing in the DTO with a custom validator **and** rely on the DB check. Two layers — the DTO gives a clear message, the constraint makes it impossible.

## Repository methods

```ts
// subcontractor.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data),
setActive(id, isActive), countActive()        // the max_subcontractors billing dimension

// contract.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data),
setStatus(id, status), findByProject(projectId), findBySubcontractor(id)

// supplier.repository.ts         (same shape as subcontractor)
// cost-type.repository.ts
findAllForTenant()                 // WHERE tenant_id IS NULL OR tenant_id = :current
create(data), update(id, data), findByName(name)

// purchase-invoice.repository.ts
create(data, number, tx), findById(id), findMany(where, skip, take), update(id, data),
markPaid(id, paidAt, reference), findDueSoon(days)
sumByProjectGroupedByCostType(projectId)      // step 10 margin
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-subcontractor.handler` | phone format. `is_active = true` |
| `create-contract.handler` | `project_id` **required**. The project must belong to this tenant and not be `cancelled`. `end_date` not before `start_date` |
| `set-contract-status.handler` | `in_progress` → `completed` / `cancelled` |
| `create-purchase-invoice.handler` | **the two rules.** (1) Exactly one source: `subcontractor` needs a contract and no supplier; `supplier` needs a supplier and no contract. (2) `cost_type = 'material'` forces `project_id = NULL`; `type = 'subcontractor'` requires a `project_id`. Takes `PUR-` from the shared counter, in the same transaction. Computes `vat_amount` and `amount_incl_vat` |
| `mark-paid.handler` | `status = 'paid'`, `paid_at`, `payment_reference`. **The margin does not change** — the cost counted from the day the bill was entered |
| `due-soon.handler` | the cron query for *"purchase bill due"* (step 13 wires the alert) |

### A bill counts in the margin from entry, not from payment

`purchase_invoices.status` only tracks whether the money has left the bank. The margin counts the bill as soon as it exists — a cost you owe is a cost. See [margin-profitability.md](../margin-profitability.md).

### Instalments

`status` is `to_pay` / `paid`, all or nothing. There is **no payment ledger for money out in v1**. A subcontractor paid in stages gets **one bill per stage**, each paid in full — that is how it works on paper. If a single bill ever needs partial payments, add a `purchase_payments` ledger copying step 06's `payments`.

### Never shown to the client

Purchase invoices, suppliers and contracts are internal. The step 12 portal never shows them, their amounts, or these names.

## Tasks

- [x] `trg_material_bill_no_project` trigger in a migration
- [x] `subcontractors` module + contracts
- [x] `suppliers` module
- [x] `cost-types` module + the shared-defaults reader
- [x] Guard: a tenant can never edit a `NULL`-tenant cost type
- [x] `purchase-invoices` module, both kinds in one endpoint
- [x] Source-pairing validator in the DTO
- [x] `PUR-` numbering through step 06's shared counter
- [x] `due-soon` endpoint
- [x] Media upload for the received PDF, `entity_type = 'purchase_invoice'`, PDF only
- [x] Optional link: `stock_movements.purchase_invoice_id` when recording a stock purchase
- [x] `// TODO: step 13` at the due-soon alert point

## Acceptance

- [x] Create a subcontractor, then **edit** it → changes saved
- [x] Invalid phone → rejected
- [x] Contract with no `project_id` → rejected
- [x] Same subcontractor, second project → a new contract, the directory row reused
- [x] One contract, two bills → both accepted
- [x] `type = 'subcontractor'` with a `supplier_id` → rejected by the DB check
- [x] `type = 'supplier'` with no `supplier_id` → rejected
- [x] `cost_type = 'material'` **with** a `project_id` → **rejected by the trigger**
- [x] `cost_type = 'material'` with `project_id = NULL` → accepted
- [x] `type = 'subcontractor'` with no `project_id` → rejected
- [x] First purchase invoice → `PUR-2026-0001`
- [x] A tenant adds a cost type `insurance` → appears in their list, **not** in another tenant's
- [x] Mark a bill paid → `status`, `paid_at` set
- [x] Upload a JPG as the bill document → rejected, PDF only
- [x] A `manager` cannot touch purchase invoices (admin and accountant only)
- [x] Tenant A cannot see tenant B's subcontractors, suppliers or bills
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [purchase-invoices.md](../purchase-invoices.md) — the table, the two rules, the double-count guard
- [subcontracting.md](../subcontracting.md) — directory vs contract vs bill
- [technical/phase-06-subcontracting.md](../technical/phase-06-subcontracting.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 7 and the trigger
