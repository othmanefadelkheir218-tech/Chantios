# Tests — Quotes & Invoices

> Routes: `/api/quotes/...`, `/api/invoices/...`, `/api/projects/:id/invoice-coverage`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [client-invoices.md](../client-invoices.md), [document-numbering.md](../document-numbering.md), [entity-fields.md](../entity-fields.md) § VAT, the step file [Phaces/06-quotes-invoices.md](../Phaces/06-quotes-invoices.md).

## Before you start

- **Guards:** every route carries `@TenantAuth()` + `@Module('quotes')` or `@Module('invoices')`. `sales` = full `quotes`, view-only `invoices`. `accountant` = full `invoices`, view-only `quotes`. `admin`/`manager` = full both.
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. You also need `sales@dupont.test` and `accountant@dupont.test` (same password) for the role checks.
- **No new migration this step** — `quotes`, `quote_lines`, `invoices`, `invoice_lines`, `payments`, `document_counters` and the `invoice_balance` view all already existed from step 01's migration.
- **Prerequisites:** a client, a project (`prospect`), a material with stock purchased, and a service with a recipe pointing at that material — all from step 04/05's own routes.
- `payments` is append-only — there is no `PATCH`/`DELETE` route for a payment, ever. A mistake needs a new row.
- Every record you create in these tests should start with `TEST`.

---

## 1. Quotes

### QUO-01 — Create a quote → `QUO-2026-0001`, the next one is `0002`

```
curl -b jar.txt -X POST http://localhost:5391/api/quotes -H "Content-Type: application/json" \
  -d '{"client_id":<id>,"project_id":<id>,"lines":[{"service_id":<svc>,"description":"TEST labour","unit":"h","quantity":"10","unit_price_excl_vat":"50.00","vat_rate":"6.00","position":1},{"description":"TEST supplies","unit":"piece","quantity":"5","unit_price_excl_vat":"20.00","vat_rate":"21.00","position":2}]}'
```

**Expected:** `201`, `number: "QUO-2026-0001"`, `status: "draft"`. A second create on the same tenant → `QUO-2026-0002`. Confirmed live.

### QUO-02 — Mixed VAT: 6% and 21% lines, rounded once per group then summed

10h × €50 (6%) + 5 × €20 (21%) → `amount_excl_vat: "600.00"`, `vat_amount: "51.00"` (30 + 21), `amount_incl_vat: "651.00"`. Confirmed live with the exact numbers above.

### QUO-03 — Concurrency: 3 simultaneous creates get 3 different, consecutive numbers

Fire 3 `POST /api/quotes` in parallel (background `curl` processes, same tenant). **Expected:** 3 distinct numbers, no error, no duplicate — confirmed live (`0011`, `0012`, `0013` in one run).

### QUO-04 — Edit lines while `draft` recalculates the totals; frozen after `send`

`PUT /api/quotes/:id/lines` with new quantities → totals change (confirmed live: 20h × €50 + 5 × €20 → `1100.00`/`81.00`/`1181.00`). `POST /api/quotes/:id/send` → `status: "sent"`, `sent_at` set. The same `PUT .../lines` afterward → `400` `"Lines are frozen once the quote has been sent"`.

### QUO-05 — A quote with zero lines can never reach `sent` (and so never `accepted`)

Create with `"lines":[]` → `201`, totals all `0`. `POST .../send` → `400` `"Cannot send a quote with no lines"`. Confirmed live.

### QUO-06 — `valid_until` hard-blocks acceptance once passed

Create with `"valid_until":"2020-01-01"`, send, then `POST .../accept` → `400` `"This quote has expired"`. Confirmed live.

### QUO-07 — Accept: one transaction across quotes, projects, stock

Project starts `prospect`. `POST /api/quotes/:id/accept` → quote `status: "accepted"`, `accepted_at` set. `GET /api/projects/:id` right after → `status: "in_progress"`. `GET /api/projects/:id/history` → a new row, `from_status: "prospect"`, `to_status: "in_progress"`, `reason: "quote_accepted"`. `GET /api/stock/reservations?project_id=:id` → a reservation for the recipe's material, `reserved_quantity` = line quantity × `quantity_per_unit` (confirmed live: 20h line, recipe `2`/unit → `reserved_quantity: "40"`). All of it landed in a single live run.

### QUO-08 — Force a failure inside the chain → nothing is written

Move a project to `completed` (via `PATCH /api/projects/:id/status`, `in_progress` then `completed`), send a quote on it, then `POST .../accept` → `400` `"Cannot accept a quote for a project in status completed"`. **Confirmed live**: the quote's `status` stayed `"sent"` (not `"accepted"`) and `GET /api/stock/reservations?project_id=:id` returned empty — the 3-module transaction actually rolled back against the real database, not just in a mock.

### QUO-09 — Refuse → project stays `prospect`

`POST .../refuse` on a `sent` quote → `status: "refused"`, `refused_at` set. `GET` the project → still `"prospect"`. Confirmed live.

### QUO-10 — Two accepted quotes on one project → their sum

Accept a second quote on the same (already `in_progress`) project → `201`, no error (the project transition is a no-op, no duplicate `project_status_history` row). `GET /api/projects/:id/invoice-coverage` → `quoted_excl_vat` equals the sum of both (confirmed live: `10.00 + 1100.00 = 1110.00`).

### QUO-11 — Role boundaries

`sales` → `POST /api/quotes` → `201`. `accountant` → same route → `403` `"No canCreate access to quotes"`. Both confirmed live.

---

## 2. Invoices

### INV-01 — No `due_date` given → defaults to `issue_date + tenants.default_payment_days`

`POST /api/invoices` with no `due_date` → `issue_date: 2026-10-06"`, `due_date: "2026-11-05"` (30 days, the tenant's default). Confirmed live.

### INV-02 — Zero lines can never be sent

Same as QUO-05: create with `"lines":[]`, `POST .../send` → `400` `"Cannot send an invoice with no lines"`.

### INV-03 — Payment ledger: partial then full, status recomputed from the view each time

On a `1210.00`-incl invoice: pay `500.00` → `status: "partially_paid"`, `balance_due: "710"`. Pay `710.00` more → `status: "paid"`, `balance_due: "0"`. Both confirmed live. **No `overdue` value exists anywhere in the schema** (`InvoiceStatus` enum has only `draft/sent/partially_paid/paid/cancelled` — checked directly in `prisma/schema.prisma`).

### INV-04 — Payment refused on a `draft` or `cancelled` invoice

`POST .../payments` on a `draft` invoice → `400` `"Cannot record a payment on a draft invoice"`. Same route on a `cancelled` invoice → `400` `"Cannot record a payment on a cancelled invoice"`. Both confirmed live (a judgment call — the step file doesn't say explicitly, but an append-only ledger against a document never sent or already voided has no accounting meaning).

### INV-05 — Cancel keeps the number, leaves a gap

`POST /api/invoices/:id/cancel` on a `sent` invoice (`INV-2026-0003`) → `status: "cancelled"`, `number` unchanged. The next invoice created → `INV-2026-0004`, never reusing `0003`. Confirmed live.

### INV-06 — Late is calculated, never stored

Create with a past `due_date`, send it. `GET /api/invoices/:id` → `status: "sent"` (unchanged), `balance.is_late: true`. `GET /api/invoices?late=true` → the invoice appears in the list (the view's `is_late`, not a stored column — filtered in-memory for this secondary query). Confirmed live.

### INV-07 — Reminder endpoint

`POST /api/invoices/:id/reminder` → `reminder_count` increments, `last_reminder_at` set to now. Confirmed live.

### INV-08 — Invoice-coverage warning, never blocking

`GET /api/projects/:id/invoice-coverage` before any invoice exists for the project → `warning: true`, `invoiced_excl_vat: "0.00"` vs the accepted-quotes total — and the quote/invoice create routes are never blocked by this. Confirmed live.

### INV-09 — Role boundaries

`accountant` → `POST /api/invoices` → `201`. `sales` → same route → `403` `"No canCreate access to invoices"`. Both confirmed live.

---

## 3. Tenant isolation

Covered automatically by `test/tenant-isolation.e2e-spec.ts` — the loop reads all 44 scoped Prisma models, `quotes`/`quote_lines`/`invoices`/`invoice_lines`/`payments`/`document_counters` included without any change to the test itself. `yarn test:e2e` → 11/11 passing after this step.

---

## 4. Known, not a bug — read before filing one

- **A negative/correcting `payments` row is not actually possible.** `doc/notes/technical/phase-05-quotes-invoices.md`'s "Overpayment" section describes a correction as "a positive top-up or a negative correction," and mentions a correction naturally reopening `paid → partially_paid`. But `payments.amount` carries a real DB `CHECK (amount > 0)` (`doc/Schema Proposal.md` § 6, `prisma/schema.prisma`), so every payment strictly reduces `balance_due` — it can never go back up. A `paid` invoice can only ever stay `paid` or go further negative (overpaid), never reopen. This is a genuine inconsistency between that note and the committed DDL, not something this step's build invented or should have silently resolved — flagged to the user, not yet added to the two open-question lists (nothing in the step's own Acceptance list exercises it, and it blocks nothing built here).
