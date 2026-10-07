# Step 15 — Documents (PDF)  *(phase 15)*

> Needs step 06 (quotes, invoices), step 01 (tenant letterhead) and step 03 (media).

## Goal

Generate the quote and invoice PDF, freeze the copy the client receives, and let both staff and the portal download it.

## Decide first

**None.** Fully specified.

## Tables

**None.** PDFs are generated on demand and stored through `media`.

## The rule that shapes this step

**The database rows are the truth; the PDF is a rendering of them.**

| State | Behaviour |
|---|---|
| `draft` | re-rendered every time it is viewed. **Nothing stored** |
| `sent` | rendered **once**, uploaded to `media` with `is_locked = true`. That file is what the client received |

A sent paper never changes. The frozen file is also what the portal serves, so the client always sees exactly what was emailed.

`media.is_locked = true` means the delete endpoint refuses that row (step 03). Without it, the legal copy of a sent invoice could be deleted like an ordinary photo.

Purchase invoices are **not** generated — the supplier sends their own PDF, uploaded at step 07.

## Totals are computed in one place

The PDF **must never** do its own arithmetic. It reads the same values the API returns, which come from `document-totals.helper.ts` (step 06) and the `invoice_balance` view.

Two places computing money is how two numbers end up disagreeing — the invoice on screen saying €4,840 and the PDF saying €4,839.99.

### The per-rate VAT block

A Belgian invoice must print the VAT breakdown **per rate**. The lines carry `vat_rate` each (step 06), and they are frozen on `sent`, so the block is read back from the lines:

| Base excl. VAT | Rate | VAT |
|---|---|---|
| €4,000.00 | 6% | €240.00 |
| €1,000.00 | 21% | €210.00 |
| **€5,000.00** | | **€450.00** |

Total incl. VAT €5,450.00. Call the same helper — do not re-group in the PDF layer.

## Modules to create

```
src/documents/                        (the module from step 06 — extend it)
├── pdf/
│   ├── layouts/letterhead.layout.ts       header, tenant block, client block, footer
│   │           document.layout.ts         the shared body: lines table + totals + VAT block
│   ├── renderers/quote.renderer.ts
│   │             invoice.renderer.ts
│   └── pdf.service.ts                     pdfmake wrapper
├── handlers/render-quote.handler.ts, render-invoice.handler.ts,
│            freeze-document.handler.ts, download-document.handler.ts
└── (existing) helpers/document-totals.helper.ts, document-number.helper.ts
```

One shared layout. A quote and an invoice differ only in the title, the number prefix and the payment block — do not write two layouts.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/quotes/:id/pdf` | `quotes:view` | `draft` → live render. `sent`+ → the frozen file |
| `GET` | `/api/invoices/:id/pdf` | `invoices:view` | same rule |
| `GET` | `/api/portal/:token/documents/:mediaId` | `PortalTokenGuard` | step 12 — the frozen file, writes a `download` tracking row |

No route generates and stores a PDF directly. Freezing happens inside step 06's `send-quote` / `send-invoice` handlers.

## What goes on the page

| Block | Source |
|---|---|
| Logo | `tenants.logo_media_id` → `media.file_url` |
| Company name, address, VAT number, registration number | `tenants` |
| Client name + address | `clients` |
| Document title + number | `quotes.number` / `invoices.number` |
| Issue date, and `valid_until` or `due_date` | the document |
| Line items: description, unit, quantity, unit price, VAT %, line total | `quote_lines` / `invoice_lines` |
| Totals: excl. VAT, the per-rate VAT block, incl. VAT | `document-totals.helper` |
| Payment terms / notes | `quotes.note` / `invoices.note` |
| Payment block (invoice only) | tenant bank details + `due_date` |

A missing logo must not break the render — fall back to the company name as text.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `render-quote.handler` | builds the pdfmake document from the row + lines. **No arithmetic of its own** |
| `render-invoice.handler` | same, plus the payment block |
| `freeze-document.handler` | called by step 06 on `send`. Renders once, uploads through step 03's media service with `entity_type = 'quote'`/`'invoice'` and **`is_locked = true`**, then attaches the file to the Resend email |
| `download-document.handler` | `draft` → render live, never store. `sent`+ → return the frozen `media` row. If the frozen file is missing (an old row), render live and log a warning rather than failing |

### Wiring into step 06

`send-quote` and `send-invoice` currently freeze totals and send a plain email. Extend them:

```
send-quote
  ├── status → 'sent', sent_at
  ├── lines + totals frozen
  ├── freeze-document  → media row, is_locked = true     ← this step
  └── email through Resend, PDF attached                   ← this step
```

Remove the `// TODO: step 15` markers left in step 06.

## Tasks

- [x] `pdf.service.ts` — the pdfmake wrapper, fonts registered
- [x] `letterhead.layout.ts` — logo, tenant block, client block, footer
- [x] `document.layout.ts` — lines table, totals, the **per-rate VAT block**
- [x] `quote.renderer.ts` and `invoice.renderer.ts` on the shared layout
- [x] Totals read from `document-totals.helper` — **no arithmetic in the PDF layer**
- [x] `GET /api/quotes/:id/pdf` and `GET /api/invoices/:id/pdf`
- [x] `freeze-document` → media upload with `is_locked = true` — as `freeze-quote-pdf.handler.ts`/`freeze-invoice-pdf.handler.ts` inside `quotes`/`invoices` (not `documents/handlers/` — see the note below)
- [x] Wire freezing into step 06's `send-quote` / `send-invoice`
- [x] Attach the PDF to the Resend email
- [x] Portal download route + the `download` tracking row (step 12) — already built, confirmed live it now serves a real frozen file
- [x] Graceful fallback when the logo is missing
- [x] `grep -rn "TODO: step 15" src/` returns nothing

**One deviation from this file's own "Modules to create" sketch, forced by the architecture, not a shortcut:** `render-*`/`freeze-*` handlers live in `src/quotes/handlers/` and `src/invoices/handlers/`, not `src/documents/handlers/`. `documents` cannot import `quotes`/`invoices`/`media`/`clients`/`tenants` back — they already import `DocumentsModule` today, so the reverse would be a real cycle. `DocumentsService` stays a leaf with exactly 2 new pure methods (`renderQuotePdf`/`renderInvoicePdf`, taking already-fetched plain data); the status check, frozen-file lookup and media upload live in the calling module, same fix already used by `ProjectBudgetHistoryController` (step 10, lives in `quotes`) and `ProjectLabourCostController` (step 08, lives in `time-entries`).

## Acceptance

All run live against a real started server (`PORT=5391 node dist/main`), the real Postgres/Redis/ImageKit/Resend — see [../test/19-documents.md](../test/19-documents.md).

- [x] `draft` quote PDF → renders, **no `media` row created**
- [x] Edit a line on the draft, download again → the new number appears
- [x] Send the quote → **one** `media` row, `entity_type = 'quote'`, `is_locked = true`
- [x] Download the sent quote → the **frozen** file, byte-identical each time
- [x] Try to delete that media row → **refused**
- [x] A quote with 6% and 21% lines → the VAT block shows two rows and they sum to `vat_amount`
- [x] The PDF total matches `amount_incl_vat` on the row **exactly**, to the cent
- [x] A tenant with no logo → renders with the company name, no crash
- [x] A tenant with a logo → the image appears
- [x] Invoice PDF shows `due_date` and the payment block
- [x] The client receives the email with the PDF attached — confirmed via the server log (`Email sent to <client>: ...`, no error from Resend); no real inbox was read to visually confirm the attachment opens, the pipeline wiring (`DispatchContext.attachment` → queue → `EmailService.send(..., attachments)`) was verified end to end instead
- [x] Portal download → the frozen file **and** a `portal_tracking` row with `event_type = 'download'`
- [x] Tenant A cannot download tenant B's document by guessing an id
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [client-invoices.md](../client-invoices.md) — what is on an invoice
- [entity-fields.md](../entity-fields.md) — § VAT, the tenant letterhead fields
- [media-files.md](../media-files.md) — `is_locked`
- [technical/phase-15-documents.md](../technical/phase-15-documents.md)
