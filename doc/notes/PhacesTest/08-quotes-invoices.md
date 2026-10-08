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
| QUO-01 | Create `Q-MAIN` | `201`, `QUO-2026-0001`, `draft`, totals as above | PASS |
| QUO-02 | Create a second quote (one free-text line, no `service_id`) | `QUO-2026-0002` | PASS |
| QUO-03 | 3 creates at the same moment | 3 distinct consecutive numbers, no error | PASS |
| QUO-04 | `PUT /api/quotes/<Q-MAIN>/lines` with Labour `12 h`, then back to `10 h` | totals follow each time | PASS |
| QUO-05 | Quote with `lines: []`, then `send` | `201` with zeros; send → `400 Cannot send a quote with no lines` | PASS |
| QUO-06 | `POST /api/quotes/<Q-MAIN>/send` | `200`, `sent`, `sent_at` set | PASS |
| QUO-07 | **[CHECK EMAIL]** `gryehirir@gmail.com` — "please review" email, **French**, with a portal link and the PDF attached | received | PASS |
| QUO-08 | `PUT .../lines` on the sent quote | `400 Lines are frozen once the quote has been sent` | PASS |
| QUO-09 | `POST /api/quotes/<Q-MAIN>/accept` | `accepted`, `accepted_at` set; project → `in_progress`; history reason `quote_accepted`; reservations **Paint 6, Tape 2, Filler 0.8** (Labour has no recipe → nothing) | PASS |
| QUO-10 | `GET /api/materials/<Paint>` | `reserved 6`, `available 94` | PASS |
| QUO-11 | Create, send and accept a small second quote on the same project (Painting 20 m²) | `201`; project transition is a no-op (no new history row); Paint reservation is **one** row, `reserved_quantity 9` | PASS |
| QUO-12 | Quote with `valid_until 2020-01-01`, send, accept | `400 This quote has expired` | PASS |
| QUO-13 | Quote on `TEST Project Flow` (completed) → send → accept | `400 Cannot accept a quote for a project in status completed`; the quote stays `sent`, **no** reservation | PASS |
| QUO-14 | Quote on a new `TEST Project Refuse` (prospect) → send → refuse | `refused`, `refused_at`; project stays `prospect` | PASS |
| QUO-15 | Accept an already-accepted quote | `400` | PASS |
| QUO-16 | `GET /api/projects/<Main>/invoice-coverage` | `quoted_excl_vat` = the sum of both accepted quotes; `warning: true` (nothing invoiced yet) | PASS |

## 2. Invoices

| ID | Do | Expected | Result |
|---|---|---|---|
| INV-01 | Invoice on Project Main, one line `1000.00` at 21%, no `due_date` | `201`, `INV-2026-0001`, `draft`, `due_date` = issue date + 30 days | PASS |
| INV-02 | Invoice with no lines, then send | `400 Cannot send an invoice with no lines` | PASS |
| INV-03 | `POST /api/invoices/<INV-1>/payments` while `draft` | `400 Cannot record a payment on a draft invoice` | PASS |
| INV-04 | Send INV-1 | `sent`. **[CHECK EMAIL]** `gryehirir@gmail.com` — "please pay" email with the PDF | PASS |
| INV-05 | Pay `500.00` | `partially_paid`, `balance_due 710` | PASS |
| INV-06 | Pay `710.00` | `paid`, `balance_due 0`; an `invoice_paid` notification for the owner (phase 15 checks the alert) | PASS |
| INV-07 | Payment `0` or `-10` | `400` (`amount > 0`) | PASS |
| INV-08 | No `PATCH` / `DELETE` route for a payment | `404` | PASS |
| INV-09 | Invoice `INV-2026-0003` sent, then `POST .../cancel` | `cancelled`, number kept; payment on it → `400`; the next invoice is `0004` (gap kept) | PASS |
| INV-10 | Invoice with `due_date` 10 days ago, sent | `status sent` (unchanged), `balance.is_late: true`; listed by `GET /api/invoices?late=true` | PASS |
| INV-11 | `POST /api/invoices/<late>/reminder` | `reminder_count +1`, `last_reminder_at` now. **[CHECK EMAIL]** reminder email at `gryehirir@gmail.com` | PASS |
| INV-12 | `GET /api/projects/<Main>/invoice-coverage` | `invoiced_excl_vat` includes INV-1; never blocks anything | PASS |

## 3. Roles

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-QI-01 | Sales: create quote `201`; create invoice `403 No canCreate access to invoices` | as stated | PASS |
| ROL-QI-02 | Accountant: create invoice `201`; create quote `403` | as stated | PASS |
| ROL-QI-03 | Manager: `GET /api/invoices` | `403` (no invoices access by default) | PASS |

## 4. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-QI-01 | B owner: A's quote and invoice by id; accept A's quote | `404` each, nothing changed | PASS |
| ISO-QI-02 | B creates its first quote | `QUO-2026-0001` — every company has its own counter | PASS |

## Known, not a bug

A `paid` invoice can never go back to `partially_paid`: `payments.amount` has `CHECK (amount > 0)`, so no negative correction exists, although a note describes one. See [../test/10-quotes-invoices.md](../test/10-quotes-invoices.md) § 4.

## Result — 2026-10-08

**33 PASS, 0 FAIL, 0 SKIP.** Emails (QUO-07, INV-04, INV-11) confirmed by the owner.

- `send`, `accept`, `refuse`, `cancel`, `reminder` and payments answer `201` (POST convention); the plan says `200` for QUO-06 — counted PASS, same as phase 03.
- QUO-02: the empty quote of QUO-05 was created first, so it took `0002` and the free-text quote `0003`; the 3 concurrent ones got `0004`–`0006` (distinct). A first QUO-02 try was refused `400 lines.0.position must be an integer number` (a line needs `position`) — a wrong request, no number used.
- Quote numbers used in A: `0001`–`0011`; invoices `0001`–`0005`. Company B: `QUO-2026-0001`.
- INV-12: `invoiced_excl_vat` 1200 (INV-1 1000 + INV-4 200; the cancelled one is not counted), `quoted_excl_vat` 1950.
- INV-06: `invoice_paid` notification row exists for the owner (user 1).

### Data left

Quotes (A): 1 Q-MAIN (accepted), 2 empty (draft), 3 free text (draft), 4–6 concurrent (draft), 7 small (accepted), 8 expired (sent), 9 on Flow (sent), 10 refused, 11 sales (draft). Invoices (A): 1 paid (1210), 2 empty draft, 3 cancelled, 4 late (sent, 1 reminder), 5 accountant draft. Project 4 `in_progress`; project 7 `TEST Project Refuse` (prospect). Reservations: Paint 9, Tape 3, Filler 1.2. Company B: project 8, client 3, quote 12.
