# Phase 15 — Documents (PDF)

> Depends on Phase 05 (quotes + invoices) and Phase 01 (tenant letterhead data).

## Tables

None. PDFs are generated on demand and stored through `media`.

## Key rules

### Generated, not stored as the source of truth
- The database rows are the truth; the PDF is a rendering of them
- A `draft` document re-renders every time it is viewed — nothing is kept
- A `sent` document's PDF is uploaded once to `media` and that file is what the client receives, so the paper never changes after it was sent

### Which documents

| Document | Media `entity_type` | When the file is frozen |
|---|---|---|
| Quote | `quote` | On `sent` |
| Client invoice | `invoice` | On `sent` |

The frozen row is written with `media.is_locked = true`, so the delete endpoint refuses it. See [[media-files]].

Purchase invoices are **not** generated — the supplier sends their own PDF, which is uploaded in Phase 06.

### What goes on the page

| Block | Source |
|---|---|
| Logo, company name, address, VAT number | `tenants` (`logo_media_id` and address fields) |
| Client name + address | `clients` |
| Document number and dates | `quotes` / `invoices` |
| Line items | `quote_lines` / `invoice_lines` |
| Totals excl VAT, VAT amount, total incl VAT | Computed from the lines and `vat_rate` |
| Payment terms / notes | `quotes.note` / `invoices.note` |

### Totals are computed in one place
The PDF must never recompute totals with its own arithmetic. It reads the same values the API returns, which come from the DB-computed line totals and the `invoice_balance` view. Two places computing money is how two numbers end up disagreeing.

### Library
`pdfmake`. One shared layout module; a quote and an invoice differ only in title, number prefix and the payment block.

## What to build

- Shared letterhead layout (logo, tenant block, client block, footer)
- Quote PDF renderer
- Invoice PDF renderer
- "Download PDF" endpoint for staff
- On `sent`: render once → upload to `media` → attach to the email (Resend)
- Portal PDF download (reads the frozen `media` file, writes a `portal_tracking` row with `event_type = 'download'`)

## Dependencies

- Phase 01 (tenant letterhead fields: logo, address, VAT number)
- Phase 05 (quotes, invoices, lines)
- Phase 09 (media, to store the frozen file)
- `pdfmake`, Resend

## See also
- [[client-invoices]]
- [[entity-fields]]
- [[document-numbering]]
- [[client-portal]]
