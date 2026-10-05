# ChantierOS — Document Numbering

> Status: v1 (working draft). How quotes, invoices and purchase invoices get their number. See [[client-invoices]].

## The problem this solves

Two users click "create invoice" in the same second. Both read *"last number = 7"*. Both write `8`. The unique index rejects the second one, and the user sees a database error.

A counter row with a lock makes the second click wait, so it gets `9`.

---

## Format

| Document | Format | Example |
|---|---|---|
| Quote | `QUO-{year}-{0000}` | `QUO-2026-0001` |
| Client invoice | `INV-{year}-{0000}` | `INV-2026-0042` |
| Purchase invoice | `PUR-{year}-{0000}` | `PUR-2026-0007` |

- 4 digits, zero-padded.
- The counter **resets to 1 each January**.
- Unique per tenant: `UNIQUE (tenant_id, number)` — never `UNIQUE (number)`.
- Two different tenants can both own `INV-2026-0001`. That is correct.

---

## The `document_counters` table

| Field | Meaning |
|---|---|
| `tenant_id` | Which company |
| `document_type` | `quote` / `invoice` / `purchase_invoice` |
| `year` | e.g. 2026 |
| `last_number` | The last number given out |

Primary key: `(tenant_id, document_type, year)`.

---

## How a number is taken

Inside the same transaction that creates the document:

```sql
BEGIN;

INSERT INTO document_counters (tenant_id, document_type, year, last_number)
VALUES (:tenant, 'invoice', 2026, 1)
ON CONFLICT (tenant_id, document_type, year)
DO UPDATE SET last_number = document_counters.last_number + 1
RETURNING last_number;

-- then INSERT the invoice with number = 'INV-2026-' || lpad(last_number, 4, '0')

COMMIT;
```

`ON CONFLICT DO UPDATE` locks the counter row for the rest of the transaction. The second click blocks there, then continues with the next number. One statement, no race.

---

## Rules

- **Never `COUNT(*) + 1`.** A deleted or cancelled document would make the count reuse a number.
- **A number is given at creation**, when the row is still `draft` — not when it is sent. A sent invoice must never change number.
- **Numbers are never reused.** A cancelled invoice keeps its number and leaves a gap. That gap is normal and expected by accountants.
- The counter is taken inside the document's own transaction. If the insert fails, the whole transaction rolls back and the number is released.

---

## Related notes
- [[client-invoices]]
- [[purchase-invoices]]
- [[business-logic-overview]]
