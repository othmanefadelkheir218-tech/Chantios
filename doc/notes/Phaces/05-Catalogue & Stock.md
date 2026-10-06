# Step 05 — Catalogue & Stock  *(phase 04)*

> The hardest step so far. Stock is a ledger, and nothing stores a running quantity.

## Goal

What the company sells (`services`), what it stocks (`materials`), the recipe linking them, the append-only stock ledger, and per-project reservations.

## Decide first

**None.** Fully specified.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 4.

| Table | Purpose |
|---|---|
| `categories` | **nullable `tenant_id`** — `NULL` = shared default, seeded |
| `services` | what the company sells, with `price_excl_vat` and `default_vat_rate` |
| `materials` | what it stocks. **No quantity column** |
| `service_materials` | the recipe: how much of each material one unit of a service consumes |
| `stock_movements` | the append-only ledger. The only place a quantity lives |
| `stock_reservations` | per project, two quantity columns |

### The three rules that shape this step

1. **`materials` has no quantity column.** Quantity is always summed from `stock_movements`, read through the `material_stock_live` view.
2. **The ledger is append-only.** A mistake is corrected with a new `adjustment` row — never by editing or deleting.
3. **`unit_price` is frozen** on every movement, copied from `materials.purchase_price` at that moment. A price change next month never shifts a past cost.

### `categories` and `cost_types` need their own reader

`tenant_id` is nullable, so the generic extension filter would hide the shared defaults. Read them with `WHERE tenant_id IS NULL OR tenant_id = :current` through a dedicated repository method. Never the generic one. See [technical/build-order.md](../technical/build-order.md) § 1b.

### The view

```sql
CREATE VIEW material_stock_live AS ...   -- on_hand, reserved, available
```

Raw SQL in the migration — Prisma does not manage views. It carries `tenant_id` and **must** be filtered by it in every `$queryRaw`. Full SQL in [Schema Proposal.md](../../Schema%20Proposal.md) § 10.

## Modules to create

```
src/
├── categories/        (small: CRUD + the shared-defaults reader)
├── services/          (services + service_materials — one domain, the recipe belongs to the service)
│   ├── dto/create-service.dto.ts, update-service.dto.ts, set-recipe.dto.ts,
│   │       find-services-query.dto.ts
│   ├── handlers/create-service.handler.ts, find-services.handler.ts, update-service.handler.ts,
│   │            archive-service.handler.ts, set-recipe.handler.ts, get-recipe.handler.ts
│   ├── repositories/service.repository.ts     (services + service_materials)
│   └── ...
├── materials/
│   ├── handlers/create-material.handler.ts, find-materials.handler.ts,
│   │            update-material.handler.ts, archive-material.handler.ts,
│   │            stock-level.handler.ts
│   ├── repositories/material.repository.ts
│   └── ...
└── stock/             (the ledger + reservations — one domain)
    ├── dto/create-movement.dto.ts, adjust-stock.dto.ts, find-movements-query.dto.ts
    ├── handlers/record-purchase.handler.ts, record-consumption.handler.ts,
    │            record-adjustment.handler.ts, find-movements.handler.ts,
    │            create-reservations.handler.ts, consume-reservation.handler.ts,
    │            release-reservations.handler.ts, check-coverage.handler.ts
    ├── helpers/recipe.helper.ts          ← walks the recipe. Used by reservations AND reports
    ├── repositories/stock-movement.repository.ts, stock-reservation.repository.ts
    └── stock.service.ts / .controller.ts / .module.ts
```

`recipe.helper.ts` is called by step 05 (reservations from an accepted quote) **and** step 09 (pre-filling a site report). One implementation, two callers. This is the single-source-of-truth rule in action.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/categories` | `catalogue:view` | shared defaults **+** own rows |
| `POST` | `/api/categories` | `admin` | own row, carries `tenant_id` |
| `PATCH` | `/api/categories/:id` | `admin` | own rows only — never a `NULL` default |
| `DELETE` | `/api/categories/:id` | `admin` | `is_active = false`, own rows only |
| `POST` | `/api/services` | `catalogue:create` | |
| `GET` | `/api/services` | `catalogue:view` | `?category_id=&search=` |
| `GET` | `/api/services/:id` | `catalogue:view` | |
| `PATCH` | `/api/services/:id` | `catalogue:edit` | |
| `DELETE` | `/api/services/:id` | `catalogue:delete` | `is_active = false` |
| `GET` | `/api/services/:id/recipe` | `catalogue:view` | `service_materials` rows |
| `PUT` | `/api/services/:id/recipe` | `catalogue:edit` | replaces the whole recipe, one transaction |
| `POST` | `/api/materials` | `stock:create` | |
| `GET` | `/api/materials` | `stock:view` | joined with `material_stock_live` |
| `GET` | `/api/materials/:id` | `stock:view` | with `on_hand`, `reserved`, `available` |
| `PATCH` | `/api/materials/:id` | `stock:edit` | `purchase_price` changes affect **future** movements only |
| `DELETE` | `/api/materials/:id` | `stock:delete` | `is_active = false` |
| `GET` | `/api/materials/low-stock` | `stock:view` | `on_hand <= minimum_stock` |
| `POST` | `/api/stock/purchase` | `stock:create` | positive quantity, **no `project_id`** |
| `POST` | `/api/stock/adjustment` | `admin` / `manager` | either sign, `note` required |
| `GET` | `/api/stock/movements` | `stock:view` | `?material_id=&project_id=&type=&from=&to=` |
| `GET` | `/api/stock/reservations` | `stock:view` | `?project_id=&material_id=` |

**There is no `POST /api/stock/consumption` route.** Consumption is declared from the site report in step 09, never directly. The handler exists here; step 09 calls it through the stock **service**.

## DTOs

### `create-service.dto.ts`
`category_id` `@IsInt`. `description` required. `unit` required (`m2`, `ml`, `h`, `piece`). `price_excl_vat` `@IsNumberString`. `default_vat_rate` optional `@IsNumberString` — `null` falls back to `tenants.default_vat_rate`. For Belgian labour services set `6.00` here, so the quote line pre-fills correctly in step 06.

### `set-recipe.dto.ts`
`items` — array of `{ material_id: integer, quantity_per_unit: string }`, `quantity_per_unit > 0`. Replaces the whole recipe.

### `create-material.dto.ts`
`description` required. `unit` required. `purchase_price` `@IsNumberString @Min(0)`. `minimum_stock` `@IsNumberString @Min(0)`.

### `create-movement.dto.ts` (purchase)
`material_id` `@IsInt`. `quantity` `@IsNumberString`, **positive**. `unit_price` optional — defaults to `materials.purchase_price`. `movement_date` optional. `purchase_invoice_id` optional integer. `note` optional. **No `project_id`** — the DTO must not accept one.

### `adjust-stock.dto.ts`
`material_id`, `quantity` (either sign, not zero), `note` **required** — an adjustment without a reason is unauditable. `project_id` optional.

## Repository methods

```ts
// service.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data),
setActive(id, isActive)
findRecipe(serviceId): Promise<ServiceMaterial[]>
replaceRecipe(serviceId, items): Promise<void>        // delete + insert, ONE transaction

// material.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data), setActive(id, isActive)
findWithStockLevels(where, skip, take)     // $queryRaw on material_stock_live, tenant_id passed
findLowStock()                             // on_hand <= minimum_stock
findStockLevel(materialId)

// stock-movement.repository.ts
create(data, tx?), createMany(rows, tx?), findMany(where, skip, take)
sumByProject(projectId)                    // step 10 margin

// stock-reservation.repository.ts
upsertAdd(projectId, materialId, qty, tx?) // adds to BOTH quantity columns
findByProject(projectId), findByMaterial(materialId)
decrementRemaining(projectId, materialId, qty, tx?)
releaseByProject(projectId, tx?)           // status = 'released', remaining = 0
```

`upsertAdd` is the important one: `UNIQUE (project_id, material_id)` means a **second** accepted quote adds to the existing row, it never inserts a duplicate.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `record-purchase.handler` | quantity **positive**, `project_id` forced `NULL` — stock is a shared pool. Freezes `unit_price` from `materials.purchase_price` unless given. Then calls `check-coverage` |
| `record-consumption.handler` | quantity **negative**, `project_id` **required**, `report_id` set. Freezes `unit_price`. Then calls `consume-reservation`. **Called only by step 09** |
| `record-adjustment.handler` | either sign, `note` required, `admin`/`manager` only. The only way to fix a mistake |
| `create-reservations.handler` | walks the recipe for every quote line **with** a `service_id`. `upsertAdd` per material. Called by step 06 on quote acceptance |
| `consume-reservation.handler` | lowers `remaining_quantity` only. At zero → `status = 'consumed'`. `reserved_quantity` never moves |
| `release-reservations.handler` | `status = 'released'`, `remaining_quantity = 0`. Called by step 04 on project cancellation. **Consumed stock is never reversed** |
| `check-coverage.handler` | after any purchase, finds reservations now covered and clears their alert. Soft only |
| `stock-level.handler` | reads `material_stock_live`. Low stock → alert (step 13 wires it) |

### Reservation quantities

```
for each quote_line WITH a service_id:
    for each row in service_materials for that service:
        reserve[material] += quote_line.quantity × quantity_per_unit
```

`quote_lines.service_id` is **nullable on purpose**. A catalogue line reserves stock; a free-text line reserves nothing. That is by design, not a gap.

### Reservation lifecycle

| Event | What happens |
|---|---|
| Quote accepted | `upsertAdd` — both quantities rise, `status = 'active'` |
| Material consumed | `remaining_quantity` drops by the same amount |
| `remaining_quantity` hits 0 | `status = 'consumed'` |
| Project cancelled | `status = 'released'`, `remaining_quantity = 0` |

Only `active` rows count in `material_stock_live.reserved`.

### Alerts are soft, never a hard block

A quote can be accepted with not enough stock. An alert fires — *"not enough stock for this project, order more"* — and clears by itself when a purchase covers it. A hard block would be wrong: the company often buys materials **after** signing.

## Tasks

- [x] `material_stock_live` view as raw SQL in a migration — already existed from step 01, confirmed live
- [x] `categories` module + the shared-defaults reader (`tenant_id IS NULL OR = :current`)
- [x] Guard: a tenant can never edit or delete a `NULL`-tenant default row
- [x] `services` module + the recipe endpoints
- [x] `replaceRecipe` in one transaction
- [x] `materials` module, joined with the view
- [x] `low-stock` endpoint
- [x] `stock` module: purchase, adjustment, movements list
- [x] `record-consumption.handler` — built here, **no route**, called by step 09
- [x] `recipe.helper.ts` — the recipe walk, one implementation
- [x] Reservations: `upsertAdd`, `consume`, `release`, `check-coverage`
- [x] Expose `releaseByProject` through the stock **service** and call it from step 04's cancel handler
- [x] All `$queryRaw` on the view pass `tenant_id` explicitly
- [x] `// TODO: step 13` at the low-stock and coverage alert points

## Acceptance

Run live 2026-10-06: HTTP scenarios against a real running app (`PORT=5391 node dist/main`), reservation/consumption scenarios via a direct service-level script against the real database (no HTTP route exists for them yet — only step 06/09 will call them). Scenarios in [../test/09-catalogue-stock.md](../test/09-catalogue-stock.md). Test data cleaned up afterward.

- [x] `GET /api/categories` returns the seeded defaults **plus** the tenant's own rows
- [x] A tenant tries to edit a `NULL`-tenant category → refused (`404`, the tenant-scoped repository simply never matches it)
- [x] Create a service with 3 recipe rows → `PUT recipe` replaces all 3 in one transaction (confirmed: replacing with 1 row leaves exactly 1, the old 3 are gone)
- [x] `materials` has no quantity column
- [x] Record a purchase of 100 → `on_hand = 100` from the view; `project_id` is `NULL`
- [x] Try to post a purchase with a `project_id` → rejected outright (`400`, the field doesn't exist on the DTO)
- [x] Try to post a purchase with a negative quantity → rejected
- [x] Reserve 30 via the recipe → `reserved = 30`, `available = 70`
- [x] A second accepted quote reserves 10 more → **one** row, `reserved_quantity = 40`
- [x] Consume 25 → `remaining_quantity = 15`, `reserved_quantity` still 40, `on_hand = 75`
- [x] Consume the last 15 → `status = 'consumed'`
- [x] Reserve more than `on_hand` → allowed, `available` goes negative (confirmed `-440`); the alert itself is a `// TODO: step 13`, not wired yet — the step file says so explicitly
- [x] Buy more stock → coverage-check logic runs (confirmed unit-tested); the actual alert-clear side effect is the same step-13 TODO as above
- [x] Cancel the project → remaining reservations `released`, `remaining_quantity = 0`; consumed movements untouched (confirmed: 2 movement rows survived the cancel)
- [x] Change `materials.purchase_price` → past movements keep their old `unit_price` (confirmed: 3 movements stayed at the original price after changing it)
- [x] An adjustment with no `note` → rejected
- [x] A `worker` calling any stock route → 403
- [x] Tenant A cannot see tenant B's materials, movements or reservations
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md) — the full field lists and the worked example
- [qa-project-quote-stock-invoices.md](../qa-project-quote-stock-invoices.md) — reservations, cancellation
- [technical/phase-04-catalogue-stock.md](../technical/phase-04-catalogue-stock.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 4, § 10 the view
