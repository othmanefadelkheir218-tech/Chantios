# ChantierOS — Client Invoices (`invoices`)

> Status: v1 (working draft). See [[business-logic-overview]] and [[qa-project-quote-stock-invoices]] for context.

## What is a `invoice`?

Money the **client pays the company**. Created inside the app by staff, sent to the client.

One project can have **multiple invoices** — the company decides how many and how to split them. No fixed rule (deposit only, 3 installments, 5 installments — all valid).

> **Soft rule**: the system warns if the total of all invoices for a project doesn't match the quote amount — but it is not blocked. Staff is responsible for the final numbers.

---

## Statuses

| Status | Meaning | Set by |
|---|---|---|
| `draft` | Being prepared, not sent yet | Staff |
| `sent` | Sent to client | Staff |
| `partially_paid` | Some payments received, not full amount | Auto (from `payments`) |
| `paid` | Fully paid | Auto (from `payments`) |
| `cancelled` | Dropped — keeps its number, leaves a gap | Staff |

### Why `due_date` cannot be empty

Nothing in the app tells you an invoice is late. It is **calculated**, every time, from `due_date`:

```
late = due_date < today AND balance_due > 0
```

An invoice with no `due_date` can therefore never be late. It would never appear in the late list, never get a reminder, and never be chased — it would just sit unpaid and invisible. So `due_date` is `NOT NULL`.

To keep that painless, it is pre-filled from `tenants.default_payment_days` (30 by default, the owner can change it in Settings) and staff can still override it on any single invoice.

### Late is calculated, never stored

There is **no `overdue` status.** Status answers one question only: how much has been paid.

Late is a second, independent question, answered live:

```
late = due_date < today AND balance_due > 0
```

A `sent` invoice and a `partially_paid` invoice can both be late. One stored status cannot hold both answers at once — a partial payment on a late invoice would have to erase the fact that it is late. So the screen shows the status plus a red "late" label, and no cron writes anything.

The daily cron still runs, but only to **send** the reminder alert. It changes no row.

---

## Tables involved

### `invoices` — the invoice header

The three money columns are **stored**: `amount_excl_vat`, `vat_amount`, `amount_incl_vat`. The service recalculates them on every line change while the invoice is `draft`; once it is `sent`, lines and totals are frozen together. A sent paper never changes. Same rule as `quotes` — see [[entity-fields]].

| Field | Meaning |
|---|---|
| `client_id` | Who pays (required) |
| `project_id` | Which project (required) |
| `quote_id` | Linked quote (optional — not every invoice needs one) |
| `number` | Invoice number (unique per tenant) |
| `status` | `draft` / `sent` / `partially_paid` / `paid` / `cancelled` |
| `issue_date` | Issue date |
| `due_date` | **Required.** The day the client must pay by. Pre-filled as `issue_date + tenants.default_payment_days` (30), editable per invoice |
| `default_vat_rate` | VAT pre-fill for new lines — the real rate is per line |
| `amount_excl_vat` / `vat_amount` / `amount_incl_vat` | The three stored totals |
| `note` | Payment terms, free text printed on the PDF |
| `reminder_count` | How many payment reminders sent |
| `last_reminder_at` | Date of last reminder |

### `invoice_lines` — the line items

One row per line. Total is always DB-computed (`quantity × unit_price_excl_vat`).

| Field | Meaning |
|---|---|
| `invoice_id` | Which invoice |
| `description` | Description (e.g. "Plumbing — sanitary installation") |
| `quantity` | Quantity |
| `unit_price_excl_vat` | Unit price without VAT |
| `vat_rate` | **The rate for this line** — 6 or 21, see [[entity-fields]] § VAT |
| `total_excl_vat` | Computed: `quantity × unit_price_excl_vat` |

### `payments` — the payment ledger

One row per payment received. Never a running total — always a ledger.

| Field | Meaning |
|---|---|
| `invoice_id` | Which invoice |
| `amount` | Amount of this payment |
| `method` | `transfer` / `cheque` / `cash` / `stripe` |
| `reference` | Payment reference (optional) |
| `payment_date` | Date received |
| `created_by` | Staff who recorded it |

### `invoice_balance` — live balance view (never stored)

Calculated fresh every time:

```
amount_paid  = SUM(payments.amount)
balance_due  = invoices.amount_incl_vat − amount_paid
late         = due_date < today AND balance_due > 0
```

`amount_incl_vat` is read from the stored column, not recomputed from the lines. The view only answers "how much is still owed, and is it late".

VAT is rounded **once per rate group**, never per line then summed — see [[entity-fields]] § VAT.

---

## Full scenario — Mr. Dubois, bathroom renovation

**Quote accepted**: €10,000 excl VAT. Project → `in_progress`.

Staff decides to split into **3 invoices**.

---

### Invoice 1 — Deposit (30%)

`invoices` row:
| number | project_id | quote_id | status | due_date | vat_rate |
|---|---|---|---|---|---|
| INV-001 | Dubois | QUO-001 | `sent` | 2026-10-15 | 21% |

`invoice_lines`:
| description | quantity | unit_price_excl_vat | total_excl_vat |
|---|---|---|---|
| Deposit — bathroom renovation | 1 | €3,000 | €3,000 |

Mr. Dubois pays in full on 2026-10-14:

`payments`:
| invoice_id | amount | method | payment_date |
|---|---|---|---|
| INV-001 | €3,630 | transfer | 2026-10-14 |

`invoice_balance` view:
```
amount_incl_vat   = €3,000 × 1.21 = €3,630
amount_paid  = €3,630
balance_due = €0  → status auto → paid ✅
```

---

### Invoice 2 — Mid-project (40%)

`invoices` row:
| number | status | due_date |
|---|---|---|
| INV-002 | `sent` | 2026-11-01 |

`invoice_lines`:
| description | total_excl_vat |
|---|---|
| Progress payment — demolition + tiling | €4,000 |

Mr. Dubois pays only €2,000 on 2026-11-01:

`payments`:
| invoice_id | amount | method | payment_date |
|---|---|---|---|
| INV-002 | €2,420 | cheque | 2026-11-01 |

`invoice_balance` view:
```
amount_incl_vat   = €4,000 × 1.21 = €4,840
amount_paid  = €2,420
balance_due = €2,420  → status → partially_paid
```

Due date passes with balance remaining → status stays `partially_paid`, the screen shows a red **late** label, and the reminder alert fires to the tenant admin.

---

### Invoice 3 — Final (30%)

`invoices` row:
| number | status | due_date |
|---|---|---|
| INV-003 | `draft` | 2026-11-30 |

Still being prepared — not sent yet.

---

### Warning check

```
Total invoiced excl VAT = €3,000 + €4,000 + €3,000 = €10,000
Quote total excl VAT    = €10,000
→ ✅ match — no warning
```

If staff had set INV-003 to €2,500 instead:
```
Total invoiced = €9,500 ≠ €10,000
→ ⚠️ warning: "invoices don't cover the full quote amount"
→ still allowed — staff decides
```

---

## Client sees invoices via portal

Via their portal link (`portal_tokens`) — read-only. They see:
- Each invoice with its status, and a late label when it is late
- Amount due and amount paid
- Due dates

They never see the company's internal costs (subcontractors, margins, stock).

---

## Reminders

When an invoice is late:
- Staff sends a reminder manually
- `reminder_count` increments by 1
- `last_reminder_at` is updated to today
- Alert fires to tenant admin (see [[alerts]])

---

## Related notes
- [[business-logic-overview]]
- [[qa-project-quote-stock-invoices]]
- [[alerts]]
- [[subcontracting]]
