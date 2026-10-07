# Tests — Documents (PDF)

> Routes: `GET /api/quotes/:id/pdf`, `GET /api/invoices/:id/pdf`. The portal's `GET /api/portal/:token/documents/:mediaId` already existed (step 12) — nothing new to test there beyond confirming it now serves a real frozen file. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [client-invoices.md](../client-invoices.md), [entity-fields.md](../entity-fields.md) § VAT / tenant letterhead, [media-files.md](../media-files.md) § `is_locked`, the step file [Phaces/15-documents.md](../Phaces/15-documents.md).

## Before you start

- **The rule**: the database rows are the truth, the PDF is a rendering of them. `draft` → re-rendered live every time, nothing stored. `sent`+ → rendered once, frozen into `media` with `is_locked = true` — that file never changes again, even if the quote/invoice is later edited (a re-sent quote gets a NEW frozen file; the old one stays, locked, forever).
- **No bank details on the invoice payment block** — `tenants` has no IBAN/bank-name field anywhere in the schema (open question 11, both lists). The payment block shows `due_date` and `invoices.note` only. Not a bug.
- **Log in first.** `admin@dupont.test` / `Demo@12345678`. For the isolation scenario, also `admin@verhelst.test` (same password).
- A competing `yarn start:dev`/`nest start --watch` instance on the SAME Redis will silently steal the queued "please review"/"please pay" email job before your own server's `EmailService` ever logs it — same trap as step 13's notifications. Stop any other running instance first if you want to see the "Email sent to…" log line yourself.
- Every record you create should start with `TEST`.

## 1. The draft/sent split

### DOC-01 — Draft renders live, nothing stored
`GET /api/quotes/:id/pdf` on a `draft` quote → `200`, a real PDF (`file <path>` reports `PDF document`), `Content-Type: application/pdf`. Zero `media` rows for that quote. Edit a line (`PUT /:id/lines`), download again → the new quantity/total appears on the new render immediately, still zero `media` rows.

### DOC-02 — Sending freezes exactly one file, before the status change can be seen
`POST /:id/send` → `201`. Exactly one new `media` row: `entity_type = 'quote'` (or `'invoice'`), `entity_id = <the quote/invoice id>`, `is_locked = true`. `GET /:id/pdf` now answers `302` to that file's CDN URL instead of rendering. Downloading twice gives byte-identical files (same URL, same bytes — checked with `md5`/`md5sum`).

### DOC-03 — The frozen file cannot be deleted
`DELETE /api/media` and `DELETE /api/media/permanent` with that file's id in the batch → `{ deleted: [], skipped: [<id>] }` either way. The row (and the real ImageKit file) survive.

## 2. The numbers on the page

### DOC-04 — Mixed VAT rates, the per-rate block, no PDF-layer arithmetic
A quote with a 6% line (e.g. 120 m² × €40 = €4,800 excl.) and a 21% line (10 × €100 = €1,000 excl.): the VAT block prints two rows — `6% · 4800.00 EUR · 288.00 EUR` and `21% · 1000.00 EUR · 210.00 EUR` — and `Total VAT` is their sum (498.00). `Total incl. VAT` on the PDF matches `amount_incl_vat` on the API row **exactly, to the cent** (the PDF never recomputes — it prints the already-stored, already-frozen columns).

### DOC-05 — Invoice: due date and the payment block
`GET /api/invoices/:id/pdf` shows `Due date: <due_date>` under the header and a `Payment` block repeating it plus `invoices.note` if set — no bank details line (see "Before you start").

## 3. The letterhead

### DOC-06 — No logo: company name as text, no crash
A tenant with `logo_media_id = NULL` (the seed default) → the top-left of the page shows the company name as bold text. No error, no blank space that looks broken.

### DOC-07 — With a logo: the image appears
`POST /api/media/tenant-logo` (multipart, sets `tenants.logo_media_id`) with any small image, then render any draft quote/invoice for that tenant → the image is embedded (the PDF bytes contain a `/Image` object, and opening the file shows it in place of the text fallback). A `sent`+ document frozen BEFORE the logo was added keeps showing no logo — it's frozen, not re-rendered.

## 4. Email and the portal

### DOC-08 — The client email carries the attachment
On `send`, the existing `client_quote_sent`/`client_invoice_sent` dispatch (step 13's "one door") now carries the frozen PDF as a base64 attachment end to end: `DispatchContext.attachment` → the BullMQ job → `EmailService.send(..., attachments)` → Resend. Confirmed live by watching the server log for `[EmailService] Email sent to <client>: ...` with no error — see the competing-instance trap above if this line never appears.

### DOC-09 — Portal download now serves a real file
Generate a portal link for the project, `GET /api/portal/:token/quotes` lists each sent quote's `documents: [{ id, file_name }]` (the frozen media row). `GET /api/portal/:token/documents/:mediaId` → `302` to the same frozen CDN URL staff get, plus one `portal_tracking` row with `event_type = 'download'`. This route itself was built in step 12 — step 15 is what makes it actually have something real to serve.

## 5. Isolation

### DOC-10 — Another tenant cannot guess an id
As `admin@verhelst.test`, `GET /api/quotes/<a Dupont quote id>/pdf` → `404 Quote not found` (same message `FindQuoteHandler` already gives for an unknown id — no distinguishing information leaked).

## Known, not-yet-decided gap

Tenant bank details for the invoice payment block have no home in the schema — see open question 11 in `doc/notes/A_progress-tracker.md` and `doc/Schema Proposal.md`. Not blocking; the payment block just doesn't print them today.
