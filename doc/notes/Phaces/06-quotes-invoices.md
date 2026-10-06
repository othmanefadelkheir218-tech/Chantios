# Step 06 — Quotes & Invoices  *(phase 05)*

> Client money in. The step with the most money rules.

## Goal

Quotes with per-line VAT, client invoices, the payment ledger, safe document numbering, and the quote-acceptance chain.

## Decide first

**Both decided 2026-10-06.** Nothing blocking.

1. **Decided 2026-10-06 — quote transitions.** `draft → sent`; `sent → draft` (edit & resend, the old sent PDF stays locked), `accepted`, or `refused`; `accepted` and `refused` are both terminal. `valid_until` hard-blocks acceptance once passed (`400`) — staff must re-send first. An accepted quote is never "undone" directly — cancel the project instead (already releases its reservations). Full writeup: [technical/phase-05-quotes-invoices.md](../technical/phase-05-quotes-invoices.md) § "The quote transition matrix".
2. **Decided 2026-10-06 — overpayment.** No new status for a negative `balance_due` — `paid` already covers it. `payments` is append-only (same rule as `stock_movements`): no edit, no delete, ever; a mistake gets a correcting row. Invoice status is recomputed from the ledger on every payment write, so a correcting payment can naturally reopen `paid → partially_paid`. Full writeup: [technical/phase-05-quotes-invoices.md](../technical/phase-05-quotes-invoices.md) § "Overpayment".

Ticked off in [A_progress-tracker.md](../A_progress-tracker.md).

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 6.

| Table | Purpose |
|---|---|
| `document_counters` | PK `(tenant_id, document_type, year)` — the row lock |
| `quotes` | 3 stored totals + `default_vat_rate` |
| `quote_lines` | **`vat_rate` per line**, `tenant_id` + composite FK |
| `invoices` | same shape. `due_date` **NOT NULL** |
| `invoice_lines` | **`vat_rate` per line** |
| `payments` | the ledger. One row per payment received |

### VAT is on the LINE

A Belgian renovation document mixes **6% labour** and **21% supplies**. One `vat_rate` column on the document cannot hold two numbers.

```
for each distinct vat_rate on the lines:
    group_excl_vat = SUM(total_excl_vat) of the lines at that rate
    group_vat      = round(group_excl_vat × vat_rate / 100, 2)

amount_excl_vat = SUM(group_excl_vat)
vat_amount      = SUM(group_vat)
amount_incl_vat = amount_excl_vat + vat_amount
```

Rounded **once per rate group**, never per line then summed. Put this in `document-totals.helper.ts` — quotes, invoices and the step 15 PDF all call it. One implementation.

`quotes.default_vat_rate` / `invoices.default_vat_rate` are only the pre-fill for a new line, copied from `tenants.default_vat_rate` (or `services.default_vat_rate` when the line comes from the catalogue).

### Document numbering — the row lock

```sql
INSERT INTO document_counters (tenant_id, document_type, year, last_number)
VALUES (:tenant, 'invoice', 2026, 1)
ON CONFLICT (tenant_id, document_type, year)
DO UPDATE SET last_number = document_counters.last_number + 1
RETURNING last_number;
```

Inside the **document's own transaction**. `ON CONFLICT DO UPDATE` locks the counter row, so a simultaneous second click waits and gets the next number.

| Rule | Why |
|---|---|
| Never `COUNT(*) + 1` | a deleted row would reuse a number |
| Number assigned at creation, while `draft` | a sent document must never change number |
| Numbers never reused | a cancelled document keeps its number and leaves a gap. Accountants expect that |
| `UNIQUE (tenant_id, number)` | two tenants may both own `INV-2026-0001` |

Formats: `QUO-2026-0001`, `INV-2026-0042`, `PUR-2026-0007`. 4 digits, counter resets each January (the `year` is part of the key, so nothing to reset by hand).

### Freezing on `sent`

While `draft`, the service recalculates the three totals on **every** line change. On `sent`, lines and totals freeze together. A sent paper never changes its total.

## Modules to create

```
src/
├── documents/          (shared, no controller)
│   ├── helpers/document-number.helper.ts     ← the counter, used by 3 document types
│   │            document-totals.helper.ts    ← per-rate VAT grouping
│   ├── repositories/document-counter.repository.ts
│   └── documents.service.ts / .module.ts
├── quotes/
│   ├── dto/create-quote.dto.ts, update-quote.dto.ts, quote-line.dto.ts,
│   │       find-quotes-query.dto.ts
│   ├── handlers/create-quote.handler.ts, find-quotes.handler.ts, find-quote.handler.ts,
│   │            update-quote.handler.ts, set-lines.handler.ts, send-quote.handler.ts,
│   │            accept-quote.handler.ts, refuse-quote.handler.ts
│   ├── repositories/quote.repository.ts      (quotes + quote_lines)
│   └── quotes.service.ts / .controller.ts / .module.ts
└── invoices/
    ├── dto/create-invoice.dto.ts, invoice-line.dto.ts, record-payment.dto.ts,
    │       find-invoices-query.dto.ts
    ├── handlers/create-invoice.handler.ts, find-invoices.handler.ts, find-invoice.handler.ts,
    │            update-invoice.handler.ts, set-lines.handler.ts, send-invoice.handler.ts,
    │            cancel-invoice.handler.ts, record-payment.handler.ts,
    │            send-reminder.handler.ts, late-invoices.handler.ts
    ├── repositories/invoice.repository.ts, payment.repository.ts
    └── invoices.service.ts / .controller.ts / .module.ts
```

`documents/` exists so the counter and the VAT maths are written once. `purchase_invoices` (step 07) uses the same counter.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/quotes` | `quotes:create` | number taken now, status `draft` |
| `GET` | `/api/quotes` | `quotes:view` | `?project_id=&client_id=&status=` |
| `GET` | `/api/quotes/:id` | `quotes:view` | with lines and the per-rate breakdown |
| `PATCH` | `/api/quotes/:id` | `quotes:edit` | `draft` only |
| `PUT` | `/api/quotes/:id/lines` | `quotes:edit` | replaces lines, recalculates totals. `draft` only |
| `POST` | `/api/quotes/:id/send` | `quotes:edit` | freezes, emails, PDF at step 15 |
| `POST` | `/api/quotes/:id/accept` | `quotes:edit` | staff accepting by phone |
| `POST` | `/api/quotes/:id/refuse` | `quotes:edit` | |
| `POST` | `/api/invoices` | `invoices:create` | |
| `GET` | `/api/invoices` | `invoices:view` | `?project_id=&status=&late=true` |
| `GET` | `/api/invoices/:id` | `invoices:view` | with `invoice_balance` |
| `PATCH` | `/api/invoices/:id` | `invoices:edit` | `draft` only |
| `PUT` | `/api/invoices/:id/lines` | `invoices:edit` | `draft` only |
| `POST` | `/api/invoices/:id/send` | `invoices:edit` | freezes |
| `POST` | `/api/invoices/:id/cancel` | `invoices:edit` | keeps the number, leaves a gap |
| `POST` | `/api/invoices/:id/payments` | `invoices:create` | ledger row, status recomputed |
| `GET` | `/api/invoices/:id/payments` | `invoices:view` | |
| `POST` | `/api/invoices/:id/reminder` | `invoices:edit` | bumps `reminder_count` |
| `GET` | `/api/projects/:id/invoice-coverage` | `invoices:view` | the soft warning below |

The portal's own accept/refuse routes are step 12. **Both paths call the same handler** here, so `accepted_at` is always real.

## DTOs

### `quote-line.dto.ts`
`service_id` optional integer (`null` = free-text line). `description` required. `unit` optional. `quantity` `@IsNumberString`, not zero. `unit_price_excl_vat` `@IsNumberString @Min(0)`. `vat_rate` `@IsNumberString` — **required**, pre-filled by the client from the service or the tenant default. `position` `@IsInt`.

### `create-quote.dto.ts`
`client_id`, `project_id` both `@IsInt` **required**. `issue_date` optional. `valid_until` optional. `note` optional. `lines` — array of `quote-line.dto`.

### `create-invoice.dto.ts`
`client_id`, `project_id` required. `quote_id` optional. `due_date` optional — defaults to `issue_date + tenants.default_payment_days`. `note` optional. `lines`.

### `record-payment.dto.ts`
`amount` `@IsNumberString @Min(0.01)`. `method` `@IsIn(['transfer','cheque','cash','stripe'])`. `reference` optional. `payment_date` optional ISO date.

## Repository methods

```ts
// quote.repository.ts
create(data, lines, number, tx): Promise<Quote>
findById(id), findMany(where, skip, take), update(id, data)
replaceLines(quoteId, lines, tx), findLines(quoteId)
setTotals(quoteId, totals, tx), setStatus(quoteId, status, timestamps, tx)
sumAcceptedByProject(projectId)           // the budget — step 10

// invoice.repository.ts
create(data, lines, number, tx), findById(id), findMany(where, skip, take)
replaceLines(invoiceId, lines, tx), setTotals(...), setStatus(...)
findWithBalance(id)                        // $queryRaw on invoice_balance, tenant_id passed
findLate()                                 // the daily cron
sumByProject(projectId)                    // the coverage warning
bumpReminder(id)

// payment.repository.ts
create(data, tx), findByInvoice(invoiceId), sumByInvoice(invoiceId)

// document-counter.repository.ts
nextNumber(documentType, year, tx): Promise<number>   // the ON CONFLICT statement
```

`nextNumber` **must** take the transaction client. Called outside the document's transaction it loses the lock and the race comes back.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-quote.handler` | `nextNumber` + insert in **one transaction**. Status `draft`. `default_vat_rate` copied from the tenant. Each line's `vat_rate` from `services.default_vat_rate` or the tenant default. Totals computed per rate group |
| `set-lines.handler` | `draft` only. Replaces lines, recomputes the 3 totals in the same transaction |
| `send-quote.handler` | `draft → sent`, `sent_at` set. **Lines and totals locked from here.** Emails the client; step 15 attaches the frozen PDF |
| `accept-quote.handler` | **The chain.** `sent → accepted`, `accepted_at = now`. Refuses a quote with **zero lines**. Project must be `prospect` or `in_progress`. Then: project → `in_progress` via step 04's `change-status`, and reservations created via step 05's `create-reservations`. **One transaction** |
| `refuse-quote.handler` | `sent → refused`, `refused_at`. Project stays `prospect` |
| `create-invoice.handler` | `nextNumber` + insert in one transaction. `due_date` defaults from `tenants.default_payment_days` |
| `send-invoice.handler` | `draft → sent`, `sent_at`. Freezes. Refuses with **no client** or zero lines |
| `cancel-invoice.handler` | `status = 'cancelled'`. Keeps the number. The gap is expected |
| `record-payment.handler` | writes the ledger row, reads `invoice_balance`, sets status: balance `0` → `paid`, `0 < balance < total` → `partially_paid`. **Never writes `overdue`** |
| `late-invoices.handler` | daily cron. Finds `sent`/`partially_paid` with `due_date < today AND balance_due > 0` and **fires alerts only**. Writes no status |
| `invoice-coverage.handler` | soft warning when total invoiced ≠ sum of accepted quotes. **Never blocks** |

### Late is calculated, never stored

There is **no `overdue` status**. Status answers one question: how much has been paid. Late is a second question, answered live by the `invoice_balance` view. A `sent` invoice and a `partially_paid` invoice can both be late; one column cannot hold both answers. The cron sends the reminder and changes **no row**.

### The acceptance chain — one transaction

```
accept-quote
  ├── quotes.status = 'accepted', accepted_at = now
  ├── projects.status → 'in_progress'   (step 04 service, through the matrix)
  ├── project_status_history row
  └── stock_reservations upserted from the recipe   (step 05 service)
```

If any part fails, all of it rolls back. A quote accepted without its reservations is a silent stock bug.

## Tasks

- [x] `invoice_balance` view as raw SQL in a migration — already existed from step 01's init migration, nothing new to write
- [x] `documents` module: `document-number.helper.ts`, `document-totals.helper.ts`
- [x] Concurrency test: two simultaneous creates get different numbers
- [x] `quotes` module + lines + the per-rate totals
- [x] `send` freezes lines and totals; later edits refused
- [x] `accept-quote` as one transaction wiring steps 04 and 05
- [x] Remove the `// TODO: step 06` marker in step 04 — no literal marker existed; `project-status.helper.ts`'s `canTransition` was already written to be called from here, and now is
- [x] `invoices` module + lines
- [x] `payments` ledger + automatic status
- [x] `invoice_balance` read through `$queryRaw` with `tenant_id`
- [x] Late-invoice daily cron — alerts only, writes nothing
- [x] Reminder endpoint: `reminder_count`, `last_reminder_at`
- [x] Coverage warning endpoint
- [x] Decide the 2 open questions, then finish status handling

## Acceptance

- [x] Create a quote → `QUO-2026-0001`; the next one is `0002`
- [x] Two parallel creates → two different numbers, no error
- [x] A quote with a 6% line and a 21% line → `vat_amount` equals the two groups rounded **separately** and summed
- [x] Edit lines while `draft` → totals change. After `send` → refused
- [x] Accept a quote with zero lines → refused
- [x] Accept a quote → project `in_progress`, history row written, reservations created. **All in one transaction**
- [x] Force a failure inside the chain → nothing is written, quote still `sent`
- [x] Accept a quote on a `completed` project → refused
- [x] Refuse a quote → project stays `prospect`
- [x] Two accepted quotes on one project → `sumAcceptedByProject` is their sum
- [x] Invoice with no `due_date` given → defaults to `issue_date + 30`
- [x] Pay part → `partially_paid`. Pay the rest → `paid`
- [x] Past `due_date` with a balance → `late` true in the view, **status unchanged**
- [x] No row anywhere has status `overdue`
- [x] Cancel an invoice → number kept, gap visible, nothing renumbered
- [x] Invoices totalling less than the accepted quotes → warning returned, create still allowed
- [x] A `sales` user can create a quote but only **view** invoices
- [x] An `accountant` can do invoices but **not** quotes
- [x] Update `../WhereIStop/state.md`

All run live against a real started server and a real Postgres database on 2026-10-06 — see [../test/10-quotes-invoices.md](../test/10-quotes-invoices.md) for the exact requests and results. One real finding surfaced during review, not invented: `payments.amount` carries a DB `CHECK (amount > 0)`, which makes a "negative correction reopening `paid → partially_paid`" (described in [technical/phase-05-quotes-invoices.md](../technical/phase-05-quotes-invoices.md) § Overpayment) structurally unreachable as currently built. Flagged to the user, not yet resolved — see that test file § 4.

## Notes to read

- [client-invoices.md](../client-invoices.md) — statuses, the ledger, why `due_date` is required
- [entity-fields.md](../entity-fields.md) — § VAT, the quote fields
- [document-numbering.md](../document-numbering.md) — the counter and the lock
- [technical/phase-05-quotes-invoices.md](../technical/phase-05-quotes-invoices.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 6, § 10
