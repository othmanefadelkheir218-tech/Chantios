# Phase 08 — Quotes & Invoices

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [client-invoices.md](../client-invoices.md), [document-numbering.md](../document-numbering.md), [entity-fields.md](../entity-fields.md) § VAT.
> Old reference: [../test/10-quotes-invoices.md](../test/10-quotes-invoices.md).

## Goal

Quotes with per-rate VAT, gap-free numbering, the acceptance chain (quote + project + stock in one transaction), invoices, the append-only payment ledger, and "late" computed, never stored.

## Before you start

- Phases 06 and 07 passed. `TEST Project Main` is `prospect`. The client is `gryehirir@gmail.com`.
- **Sending** a quote or an invoice emails the client — with the frozen PDF attached (the PDF itself is checked in phase 16).
- The database is fresh, so A's first numbers are `QUO-2026-0001` and `INV-2026-0001`.

---

## 1. Quotes

### The main quote — used again in phases 11, 12 and 14

`Q-MAIN` on `TEST Project Main`:

| Line | Service | Qty | Unit price | VAT |
|---|---|---|---|---|
| 1 | `TEST Painting` | 40 m² | `25.00` | 6% |
| 2 | `TEST Labour` | 10 h | `45.00` | 21% |

Expected totals: excl `1450.00` · VAT `60.00 + 94.50 = 154.50` · incl `1604.50`.

| ID | Do | Expected | Result |
|---|---|---|---|
| QUO-01 | Create `Q-MAIN` | `201`, `QUO-2026-0001`, `draft`, totals as above | todo |
| QUO-02 | Create a second quote (one free-text line, no `service_id`) | `QUO-2026-0002` | todo |
| QUO-03 | 3 creates at the same moment | 3 distinct consecutive numbers, no error | todo |
| QUO-04 | `PUT /api/quotes/<Q-MAIN>/lines` with Labour `12 h`, then back to `10 h` | totals follow each time | todo |
| QUO-05 | Quote with `lines: []`, then `send` | `201` with zeros; send → `400 Cannot send a quote with no lines` | todo |
| QUO-06 | `POST /api/quotes/<Q-MAIN>/send` | `200`, `sent`, `sent_at` set | todo |
| QUO-07 | **[CHECK EMAIL]** `gryehirir@gmail.com` — "please review" email, **French**, with a portal link and the PDF attached | received | todo |
| QUO-08 | `PUT .../lines` on the sent quote | `400 Lines are frozen once the quote has been sent` | todo |
| QUO-09 | `POST /api/quotes/<Q-MAIN>/accept` | `accepted`, `accepted_at` set; project → `in_progress`; history reason `quote_accepted`; reservations **Paint 6, Tape 2, Filler 0.8** (Labour has no recipe → nothing) | todo |
| QUO-10 | `GET /api/materials/<Paint>` | `reserved 6`, `available 94` | todo |
| QUO-11 | Create, send and accept a small second quote on the same project (Painting 20 m²) | `201`; project transition is a no-op (no new history row); Paint reservation is **one** row, `reserved_quantity 9` | todo |
| QUO-12 | Quote with `valid_until 2020-01-01`, send, accept | `400 This quote has expired` | todo |
| QUO-13 | Quote on `TEST Project Flow` (completed) → send → accept | `400 Cannot accept a quote for a project in status completed`; the quote stays `sent`, **no** reservation | todo |
| QUO-14 | Quote on a new `TEST Project Refuse` (prospect) → send → refuse | `refused`, `refused_at`; project stays `prospect` | todo |
| QUO-15 | Accept an already-accepted quote | `400` | todo |
| QUO-16 | `GET /api/projects/<Main>/invoice-coverage` | `quoted_excl_vat` = the sum of both accepted quotes; `warning: true` (nothing invoiced yet) | todo |

## 2. Invoices

| ID | Do | Expected | Result |
|---|---|---|---|
| INV-01 | Invoice on Project Main, one line `1000.00` at 21%, no `due_date` | `201`, `INV-2026-0001`, `draft`, `due_date` = issue date + 30 days | todo |
| INV-02 | Invoice with no lines, then send | `400 Cannot send an invoice with no lines` | todo |
| INV-03 | `POST /api/invoices/<INV-1>/payments` while `draft` | `400 Cannot record a payment on a draft invoice` | todo |
| INV-04 | Send INV-1 | `sent`. **[CHECK EMAIL]** `gryehirir@gmail.com` — "please pay" email with the PDF | todo |
| INV-05 | Pay `500.00` | `partially_paid`, `balance_due 710` | todo |
| INV-06 | Pay `710.00` | `paid`, `balance_due 0`; an `invoice_paid` notification for the owner (phase 15 checks the alert) | todo |
| INV-07 | Payment `0` or `-10` | `400` (`amount > 0`) | todo |
| INV-08 | No `PATCH` / `DELETE` route for a payment | `404` | todo |
| INV-09 | Invoice `INV-2026-0003` sent, then `POST .../cancel` | `cancelled`, number kept; payment on it → `400`; the next invoice is `0004` (gap kept) | todo |
| INV-10 | Invoice with `due_date` 10 days ago, sent | `status sent` (unchanged), `balance.is_late: true`; listed by `GET /api/invoices?late=true` | todo |
| INV-11 | `POST /api/invoices/<late>/reminder` | `reminder_count +1`, `last_reminder_at` now. **[CHECK EMAIL]** reminder email at `gryehirir@gmail.com` | todo |
| INV-12 | `GET /api/projects/<Main>/invoice-coverage` | `invoiced_excl_vat` includes INV-1; never blocks anything | todo |

## 3. Roles

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-QI-01 | Sales: create quote `201`; create invoice `403 No canCreate access to invoices` | as stated | todo |
| ROL-QI-02 | Accountant: create invoice `201`; create quote `403` | as stated | todo |
| ROL-QI-03 | Manager: `GET /api/invoices` | `403` (no invoices access by default) | todo |

## 4. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-QI-01 | B owner: A's quote and invoice by id; accept A's quote | `404` each, nothing changed | todo |
| ISO-QI-02 | B creates its first quote | `QUO-2026-0001` — every company has its own counter | todo |

## Known, not a bug

A `paid` invoice can never go back to `partially_paid`: `payments.amount` has `CHECK (amount > 0)`, so no negative correction exists, although a note describes one. See [../test/10-quotes-invoices.md](../test/10-quotes-invoices.md) § 4.
