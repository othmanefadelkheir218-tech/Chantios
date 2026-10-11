# Step 19 — Bulk import (materials and stock)

> Needs step 05 (catalogue & stock) and step 13 (notifications). **Built 2026-10-10** (backend + frontend). Unit tests pass; the live HTTP check waits for the owner to start the API.

## Goal

A user imports up to 500 materials or stock rows from an `.xlsx` file in one go. The import runs in the background, writes all or nothing, and ends with an in-app notification.

## Decide first

**None.** All rules are decided in [../bulk-import.md](../bulk-import.md). This file does not restate them.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 4. **One migration** (`bulk_import`):

| Table | Change |
|---|---|
| — | new enums `import_type`, `import_status` |
| `import_batches` | new table |
| `stock_movements` | add `import_batch_id` → `import_batches.id` (nullable) |
| `materials` | unique index on `(tenant_id, lower(btrim(description)))` — raw SQL in the migration (Prisma can't write an expression index) |

**Before the migration:** look for duplicate descriptions already in the database. If some exist, the index fails. Show them to the owner — never rename or merge data without asking.

`import_batches` has `tenant_id`, so the Prisma tenant extension scopes it like every business table.

## Modules to create

```
src/
└── imports/
    ├── decorators/imports.swagger.ts
    ├── dto/create-materials-import.dto.ts, create-stock-import.dto.ts, import-job.dto.ts,
    │       material-import-row.dto.ts, stock-import-row.dto.ts, find-imports-query.dto.ts
    ├── entities/import-batch.entity.ts
    ├── handlers/create-import.handler.ts      ← rights + double-import check, saves the batch, queues the job
    │            run-import.handler.ts          ← pending → processing → done/failed, audit, notification
    │            run-materials-import.handler.ts, run-stock-import.handler.ts
    │            find-imports.handler.ts, run-import.types.ts
    ├── helpers/import-hash.helper.ts           ← sha256 of the normalised rows
    │           import-error.helper.ts          ← every French error message, one place
    │           import-batch.helper.ts          ← the response shape (never `rows`)
    ├── processors/import.processor.ts          ← BullMQ worker, runs inside cls.run (copy billing/processors/renewal.processor.ts)
    ├── repositories/import-batch.repository.ts
    ├── imports.service.ts / .controller.ts / .module.ts
```

`imports` owns only `import_batches`. It writes materials through `MaterialsService` and movements through `StockService`, passing the transaction client. It never touches their repositories.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/materials/export` | `stock:view` | every active material, no pagination: `id`, `description`, `unit`, `purchase_price`, `minimum_stock`. The frontend builds the `.xlsx` |
| `POST` | `/api/imports/materials` | `stock:create` (+ `stock:edit` / adjustment right, see handler) | body `{ file_name, rows }` → `202` `{ id, status: 'pending' }` |
| `POST` | `/api/imports/stock` | `stock:create` (+ adjustment right for `adjustment` rows) | body `{ file_name, rows }` → `202` |
| `GET` | `/api/imports` | `stock:view` | `?type=&status=`, paginated, newest first. No `rows` in the list |
| `GET` | `/api/imports/:id` | `stock:view` | with `errors` and counts |

No delete or edit route: a batch is never changed by hand.

## DTOs

### `create-materials-import.dto.ts` / `create-stock-import.dto.ts`
One DTO per route, so each row is validated as its own class. `file_name` `@IsString @MaxLength(255)`. `rows` `@IsArray @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested`. Each row carries `row` — the Excel line number, used in error messages. The JSON body limit is `2mb` (`main.ts`).

### `material-import-row.dto.ts`
`row` `@IsInt`. `id` optional `@IsInt`. `description` required. `unit` required. `purchase_price` `@IsNumberString`, `≥ 0`. `minimum_stock` `@IsNumberString`, `≥ 0`. `stock_depart` optional `@IsNumberString`, `> 0`.

### `stock-import-row.dto.ts`
`row` `@IsInt`. `id` `@IsInt` required. `description` required. `type` `@IsEnum(['purchase','adjustment'])`. `quantity` `@IsNumberString`, not zero. `movement_date` optional ISO date. `note` optional — required when `type = adjustment`. **No price field, no `project_id`.**

## Repository methods

```ts
// import-batch.repository.ts
create(data), findById(id), findMany(where, skip, take)
findActiveByHash(type, rowsHash)          // status <> 'failed'
setStatus(id, status, extra?, tx?)        // started_at / finished_at / errors / counts
```

What the other modules must add (in their own service + repository):

```ts
// MaterialsService
findAllActiveForExport()
findManyByIds(ids)                         // tenant-scoped, with is_active
findDescriptionsTaken(descriptions)        // lower(btrim()) match, archived included
createMany(rows, tx), updatePriceAndMinimum(id, purchase_price, minimum_stock, tx)

// StockService
recordPurchase(dto, actor, tx?)            // the existing handler, now accepts tx
recordAdjustment(dto, actor, tx?)          // same
```

Do **not** write a second purchase or adjustment rule for the import. The import calls the existing handlers row by row inside one transaction. Add `tx?` and `import_batch_id?` to them if they don't take them yet.

## Handlers

| Handler | What it does |
|---|---|
| `create-import.handler` | checks the rights for this file (a `materials` file with an `id` row needs `stock:edit`; any `stock_depart` or `adjustment` row needs `admin` / `manager` → else `403`). Hashes the rows; same hash in a non-failed batch → `409`. Saves the batch `pending`, queues the job with the batch id + tenant id + user id. Returns at once |
| `import.processor` | opens `cls.run`, sets the tenant + user, calls the right run handler. On a crash: batch `failed` with one general error, and the notification still goes out |
| `run-materials-import.handler` | `processing` → loads all ids and taken descriptions in **2 queries** (no query per row) → checks every row and collects **all** errors → errors? `failed`, nothing written. None? **one transaction:** create new materials, update `purchase_price` / `minimum_stock`, write `Stock initial` adjustments (with `import_batch_id`), set `done` + counts. A unique-index error during the write (another import at the same time) → `failed` with that row's error |
| `run-stock-import.handler` | same shape: check all rows → one transaction → each row through `StockService` with `import_batch_id` → `done`. Then the coverage check **once** |
| `find-imports` / `find-import` | read the batches |

Both run handlers end by calling `NotificationsService` with `import_done` or `import_failed` for `created_by`. Payload: `{ import_batch_id, type, row_count, created_count, updated_count, error_count }`.

### Error messages

French, with the Excel line number, built by `import-error.helper.ts` in one place. Examples:

```
Ligne 4 : la colonne « unité » est vide.
Ligne 12 : le matériau « Peinture » existe déjà.
Ligne 15 : le matériau « Peinture » apparaît deux fois dans le fichier (lignes 15 et 31).
Ligne 20 : l'id 88 ne correspond pas à « Ruban adhésif ».
Ligne 21 : l'unité ne peut pas être changée par import (L → kg).
Ligne 30 : une note est obligatoire pour un ajustement.
```

## Tasks

- [x] Check the database for duplicate material descriptions; report to the owner if any
- [x] Migration `bulk_import` (enums, table, column, unique index as raw SQL)
- [x] Map the unique-index error to `409` in `create-material` / `update-material` too (the form gets the same rule)
- [x] `GET /api/materials/export`
- [x] `imports` module, shape of `.instruction/code_structure.txt`
- [x] `record-imported-movements.handler` in `stock` (inside the import transaction, with `import_batch_id`), reusing the stock helpers `assertPositiveQuantity` / `assertNonZeroQuantity` — no second rule
- [x] `create-import.handler` with the rights check and the hash check
- [x] BullMQ queue `imports` + processor inside `cls.run`
- [x] Both run handlers: all errors first, then one transaction
- [x] `import_done` / `import_failed` in `TENANT_ALERT_TYPES`
- [x] Swagger for the module
- [x] Unit tests for each handler

## Frontend (`ChanitOs_client`)

Plan first in `my-app/.instruction/`, then build. Text in `fr.json` only.

Built 2026-10-10 (`ChanitOs_client/my-app`): `app/[locale]/(tenant)/_components/imports/`, `lib/imports/`, `stock/imports/` page, `hooks/use-imports.ts`, `exceljs` (loaded only on click).

- `/catalogue/materials` and `/stock`: one **Excel** menu — export (= the template), import, history.
- One `.xlsx` library on the front only (read + write). The template is the export itself.
- Import dialog: pick a file → read it → check columns, types and the 500 limit → preview table, bad rows in red → **Importer** sends the JSON → close the dialog, show "Import en cours".
- An **Imports** list (status, date, counts, errors per line) — the place the notification links to.
- On `import_done` / `import_failed`, refresh the materials or stock list.
- Buttons and options follow the user's rights (no `stock_depart` / `adjustment` for a role without the adjustment right).

## Acceptance

The live HTTP checks below wait for the owner to start the API. The rules behind each one are covered by the unit tests (`imports.handlers.spec.ts`, `record-imported-movements.handler.spec.ts`, `materials.handlers.spec.ts`).


- [ ] Export → re-import the same file unchanged → nothing to import (the frontend says so; the backend skips unchanged rows)
- [ ] 10 new rows → `done`, 10 created; with `stock_depart` → one `Stock initial` adjustment each, `import_batch_id` set
- [ ] Change `purchase_price` on 5 rows → updated; past movements keep their old `unit_price`
- [ ] One duplicate description among 100 good rows → `failed`, **0** rows written, the error names the line
- [ ] `id` / `description` mismatch → `failed`. Changed unit → `failed`. `id` of another tenant → `failed` (same message as not found)
- [ ] 501 rows → `400`. 0 rows → `400`
- [ ] Same file twice → `409`. After a `failed` batch the same file can be sent again
- [ ] Stock file with a `consumption` row → `400`. `adjustment` without a note → `failed` with the line
- [ ] `adjustment` rows as a role without the adjustment right → `403`. `worker` → `403`
- [ ] Two imports with the same new description at the same time → one `done`, one `failed`
- [ ] The user gets `import_done` / `import_failed` in the bell
- [ ] Tenant A can't see tenant B's batches
- [x] `npx tsc --noEmit` and `npx jest` clean (77 suites, 920 tests)
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [../bulk-import.md](../bulk-import.md) — every rule of this step
- [../catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md) — the ledger, starting stock
- [../alerts.md](../alerts.md) — notifications
- [05-Catalogue & Stock.md](05-Catalogue%20%26%20Stock.md) — the purchase / adjustment handlers this step reuses
