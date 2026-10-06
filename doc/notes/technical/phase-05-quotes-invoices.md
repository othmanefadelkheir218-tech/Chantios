# Phase 05 — Quotes & Invoices (Client Money)

> Depends on Phase 03 (clients + projects) and Phase 04 (catalogue for line items).

## Tables

- `quotes` — quote header
- `quote_lines` — quote line items
- `invoices` — client invoice header
- `invoice_lines` — invoice line items
- `payments` — payment ledger (one row per payment received)
- `document_counters` — per tenant, per document type, per year sequence

## Key relations

```
clients ──── quote ──── quote_lines ──── services
        └─── invoices ──── invoice_lines
projects ──── quote
        └─── invoices ──── payments
quote ──── invoices (optional link)
```

## Key rules

### Quote statuses

| Status | Meaning |
|---|---|
| `draft` | Being built |
| `sent` | Sent to client |
| `accepted` | Client accepted → triggers project `in_progress` + stock reservation |

A `sent` quote is visible in the client portal with **Accept** and **Refuse** buttons. The client answers there; staff can also answer for a client who phones. Both paths write the same columns — see [[client-portal]].
| `refused` | Client rejected → project stays `prospect` |

### The quote transition matrix — decided 2026-10-06

```
draft    → sent
sent     → draft (edit & resend), accepted, refused
accepted → nothing (terminal)
refused  → nothing (terminal)
```

- **`sent → draft` is allowed** — lets staff fix a price before the client replies. The PDF already sent stays locked forever in `media` (`is_locked`); reverting the quote never touches it, and a later re-send creates a new locked PDF, not an overwrite.
- **`valid_until` blocks acceptance, hard.** Once `valid_until` has passed, `accept` is refused (`400`) — material/labour costs may have moved since the quote was priced. Unlike a soft stock-reservation alert, honoring a stale price is a real financial risk, so this is a real block, not a warning. Staff re-sends the quote (bumping `valid_until`) before it can be accepted again.
- **`accepted` cannot be undone directly** — it is terminal, same philosophy as a project's `cancelled`. If the deal falls through after acceptance, the fix is cancelling the *project* (already releases its stock reservations, step 05) rather than an "unaccept" path that would duplicate that logic.
- **`refused` is also terminal** — same reasoning as projects: a client who changes their mind gets a **new** quote, not a reopened one.

### Invoice statuses

| Status | Meaning |
|---|---|
| `draft` | Being prepared |
| `sent` | Sent to client |
| `partially_paid` | Some payments received |
| `paid` | Fully paid |
| `cancelled` | Dropped — keeps its number, leaves a gap |

There is **no `overdue` status.** Status answers only "how much is paid". Late is a second question, calculated live: `due_date < today AND balance_due > 0`. One column cannot hold both answers — a partial payment on a late invoice would erase the fact that it is late.

### Document numbering
- Format: `QUO-2026-0001`, `INV-2026-0042` — 4 digits, counter resets each January
- `UNIQUE (tenant_id, number)` — never `UNIQUE (number)`
- The number is taken from `document_counters` with `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, **inside the document's own transaction**. The row lock makes a simultaneous second click wait and get the next number
- Never `COUNT(*) + 1` — a deleted row would make a number repeat
- A number is assigned at creation, while still `draft`. A sent document never changes number
- Cancelled documents keep their number and leave a gap — that is normal
- Full rules in [[document-numbering]]

### `accepted_at` on quotes
- `quotes` carries `sent_at`, `accepted_at`, `refused_at`
- `accepted_at` is what makes budget history free — no `project_budget_history` table is needed
- Project budget = `SUM(amount_excl_vat)` of accepted quotes, computed in `project_margin_live`, never stored

### Line totals and document totals
- `total_excl_vat = quantity × unit_price_excl_vat` — DB-computed, never client JS, rounded to 2 decimals
- `quotes` and `invoices` **store** `amount_excl_vat`, `vat_amount`, `amount_incl_vat`. The service recalculates all three on every line change while the document is `draft`
- Once the document is `sent`, lines and totals are frozen together. A sent paper never changes its total
- **`vat_rate` is a column on the LINE**, not on the document. One Belgian job mixes 6% labor and 21% supplies. The document carries `default_vat_rate` only as a pre-fill for new lines
- VAT is grouped by rate, rounded **once per rate group**, then summed — never per line. See [[entity-fields]] § VAT

### Invoice splitting
- One project → many invoices (company decides how many)
- Soft warning if total invoices ≠ sum of accepted quotes (not blocked)

### Payment ledger
- Every payment = one row in `payments`
- `invoice_balance` view: `invoices.amount_incl_vat − SUM(payments)` = balance (always live). It reads the stored total, it does not recompute from the lines
- Status auto-updates based on balance:
  - balance = 0 → `paid`
  - balance < total → `partially_paid`

### Overpayment — decided 2026-10-06
- **No new status for a negative `balance_due`.** `invoice_status` stays `paid` once `balance_due ≤ 0` — the negative number itself is the signal that the client overpaid. Adding an `overpaid` enum value is a schema change for an edge case the existing status already covers well enough.
- **`payments` is append-only, same philosophy as `stock_movements`.** No edit route, no delete route, ever. A wrong entry (typo'd amount, a refund) is corrected with a **new** payment row — a positive top-up or a negative correction — never a mutation of the original. The full history of what came in, and what corrected it, always stays visible.
- **Invoice status is recomputed from the ledger on every payment write**, not advanced one-way. So a correcting (negative) payment that pushes `balance_due` back above `0` naturally reopens `paid → partially_paid` — there is no special "reopen" code path, it is the exact same status-from-balance rule applied again.

### Late invoices
- A daily cron finds `sent` / `partially_paid` invoices where `due_date < today AND balance_due > 0` and **fires the alert**
- It writes no status. Nothing in the database changes — late is always calculated

## What to build

- `quotes` CRUD + line items
- Quote acceptance handler (sets `accepted_at`, flips project to `in_progress`, walks the recipe to create reservations)
- Number allocator on `document_counters` (shared by quotes, invoices, purchase invoices)
- `invoices` CRUD + line items
- Payment recorder (creates `payments` row + recalculates status)
- `invoice_balance` view (raw SQL in migration)
- Late-invoice cron (daily — sends alerts only, writes no status)
- Reminder counter update (`reminder_count`, `last_reminder_at`)

## Dependencies

- Phase 03 (clients + projects)
- Phase 04 (catalogue for line items)
- BullMQ / @nestjs/schedule (cron for the late-invoice alert)

## See also
- [[client-invoices]]
- [[document-numbering]]
- [[entity-fields]]
- [[qa-project-quote-stock-invoices]]
- [[alerts]]
