# ChantierOS — Bulk import (materials and stock)

> Decided 2026-10-10 by the owner. Build step: [Phaces/19-bulk-import.md](Phaces/19-bulk-import.md). DDL: [Schema Proposal.md](../Schema%20Proposal.md) § 4.

## Why

A new company has hundreds of materials and stock lines. Typing them one by one is too slow. The user fills an Excel file and imports it in one go.

## The flow

```
1. Export   → the user downloads an .xlsx of their materials (id + description + the other columns)
2. Edit     → the user fills or changes rows in Excel
3. Upload   → the frontend reads the file, checks columns and types, shows a preview
4. Send     → the frontend sends the rows as JSON. The backend saves an import batch (status `pending`) and answers `202` at once
5. Job      → a background job checks every row again and writes everything in ONE transaction
6. Result   → status `done` or `failed` + an in-app notification. The user does not wait on the page
```

## Format

- **`.xlsx` only.** No CSV: separators, decimal commas and accents break CSV files. Excel cells have types.
- The frontend reads and writes the `.xlsx`. The backend only sees JSON.
- **Max 500 rows per file.** More is refused before the job starts.
- An empty file is refused.

## All or nothing

- One DB transaction for the whole file. If one row fails, **nothing** is written.
- The job collects **every** error, not only the first one, so the user fixes everything in one go.
- Each error has the row number (the Excel line) and a clear reason, in French, for example: `Ligne 12 : le matériau « Peinture » existe déjà.`
- The error list is saved on the import batch and shown on the import page.

## The key: `id`, checked against `description`

- The `id` column is the key. `description` (the material's name) must match the row with that `id`, otherwise it is an error.
- An `id` that does not exist, belongs to another company or is archived is an error.
- Matching ignores spaces at the start and end and ignores case (`Peinture` = `peinture `).
- The backend never trusts an `id` from a file: it always checks it against the user's tenant.

## Materials import

| `id` in the row | What happens |
|---|---|
| empty | **Create** the material. Error if the description already exists in the company (or twice in the file) |
| exists, `description` matches | **Update** `purchase_price` and `minimum_stock` only. Same values as today → skipped, nothing written |
| exists, `description` does not match | Error |
| exists, `unit` does not match | Error — the unit never changes by import |
| not found / other company / archived | Error |

- **Only `purchase_price` and `minimum_stock` can be updated by import.** A rename or a unit change is done in the form, one material at a time.
- **`stock_depart`** (optional column, new rows only): after the material is created, one `adjustment` movement with note `Stock initial`, dated today, at the material's purchase price. Same rule as the create form ([catalogue-stock-tables-and-cost-storage.md](catalogue-stock-tables-and-cost-storage.md) § Starting stock). A `stock_depart` on an existing row is an error — use the stock import.
- Same permission as the single routes: `stock:create` to create, `stock:edit` to update. A file with `stock_depart` needs the adjustment right (`admin` / `manager`).
- **Unique description:** two materials of the same company can never have the same description (DB rule, case-insensitive, archived rows count too). This also protects against two imports running at the same time.

## Stock import

- Each row: `id`, `description` (must match), `type`, `quantity`, `movement_date` (optional, today by default), `note`.
- The stock template lists every material. A line with no type and no quantity is skipped: the user fills only the lines they need.
- The same material may come back on several lines — each line is one movement.
- `type` is `purchase` or `adjustment` only. **Never `consumption`** — consumption comes from site reports only ([site-reports.md](site-reports.md)).
- The rules of the single routes apply to each row: a `purchase` is positive and has no project; an `adjustment` is not zero and needs a `note`. A file with `adjustment` rows needs the adjustment right (`admin` / `manager`).
- **The price is always the material's current `purchase_price`.** The file has no price column. To change a price, update the material first (form or materials import), then import the stock. The export shows `unit` and `purchase_price` as read-only columns so the user sees the price that will be used; the backend ignores them.
- After the transaction, the coverage check runs once (the same one as after a single purchase).

## Import batches

Every upload is one row in `import_batches`.

| Status | Meaning |
|---|---|
| `pending` | saved, waiting for the job |
| `processing` | the job is running |
| `done` | everything was written |
| `failed` | nothing was written; `errors` holds the list |

- **Traceability:** every stock movement written by an import carries `import_batch_id`. To undo an import, a manager adds reverse `adjustment` rows — the ledger stays append-only.
- **No double import:** the backend computes a hash of the rows. The same rows already in a `pending`, `processing` or `done` batch of the same company and type → refused (`409`). A `failed` batch can be sent again.
- A batch row is never deleted.

## Notification

- When the job ends, the user who uploaded gets `import_done` or `import_failed`, with the batch id, file name and counts in the payload.
- Same channel as every other alert: an in-app row, a live socket event, and an email in the company's language (`fr` / `en` / `nl`).
