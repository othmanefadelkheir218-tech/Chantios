# Phase 16 — Documents (PDF)

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [client-invoices.md](../client-invoices.md), [media-files.md](../media-files.md) § `is_locked`.
> Old reference: [../test/19-documents.md](../test/19-documents.md).

> **Status: 17 PASS, 0 FAIL.** DOC-05, DOC-13 and DOC-14 confirmed by the owner on 2026-10-09 (ImageKit folder and the 3 emails with the PDF attached).

## Goal

The database rows are the truth, the PDF is a rendering. A draft is rendered live and never stored. A sent document is rendered once, frozen in `media` with `is_locked = true`, attached to the client email, and never changes.

## Before you start

- PDFs downloaded during this phase are saved in the scratchpad. You can ask for any of them on Telegram.
- A has a logo since phase 05 (MED-23). B has none.
- There are no bank details on the invoice payment block (open question 11) — not a bug.

---

## 1. Draft vs sent

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-01 | `GET /api/quotes/<draft>/pdf` | `200`, `Content-Type: application/pdf`, a real PDF; **0** `media` rows for that quote | PASS |
| DOC-02 | Change a line, download again | the new quantity and total appear; still 0 media rows | PASS |
| DOC-03 | Send it | exactly **one** new media row: `entity_type quote`, `entity_id` = the quote, `is_locked true` | PASS |
| DOC-04 | `GET /api/quotes/<id>/pdf` twice | `302` to the frozen file; both downloads byte-identical (same md5) | PASS |
| DOC-05 | **[CHECK IMAGEKIT]** | the frozen PDF is in `tenant-<A>/quote/<id>/` | PASS |
| DOC-06 | `DELETE /api/media` and `/permanent` with its id | `skipped: [id]` both times; row and file kept | PASS |
| DOC-07 | Same for an invoice | one locked `invoice` row on send; `302` after | PASS |

## 2. The numbers

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-08 | Quote: 120 m² × `40.00` at 6% + 10 × `100.00` at 21%, send, open the PDF | VAT block: `6% · 4800.00 · 288.00` and `21% · 1000.00 · 210.00`, `Total VAT 498.00`; `Total incl. VAT` = `amount_incl_vat` to the cent | PASS |
| DOC-09 | Invoice PDF | `Due date` under the header and a `Payment` block with the due date and the note | PASS |

## 3. Letterhead

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-10 | B draft quote PDF (no logo) | company name as bold text, no crash | PASS |
| DOC-11 | A draft quote PDF (logo) | the image appears (the PDF holds an `/Image` object) | PASS |
| DOC-12 | A quote frozen **before** a logo change keeps its old look | frozen, never re-rendered | PASS |

## 4. Email and portal

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-13 | **[CHECK EMAIL]** `gryehirir@gmail.com` — the DOC-03 quote email | the PDF is **attached** and opens, and it matches DOC-04's file | PASS |
| DOC-14 | **[CHECK EMAIL]** the DOC-07 invoice email | the PDF is attached | PASS |
| DOC-15 | Portal: `GET /api/portal/<token>/documents/<frozen id>` | `302` to the same file, one `download` tracking row | PASS |

## 5. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-DOC-01 | B owner: `GET /api/quotes/<A quote>/pdf`, `/api/invoices/<A invoice>/pdf` | `404 Quote not found` / `404` | PASS |
| DOC-16 | `grep -rn "TODO: step 15" src/` | nothing | PASS |

## Result — 2026-10-09

**17 PASS, 0 FAIL.** DOC-05, DOC-13 and DOC-14 confirmed by the owner (2026-10-09).

- DOC-01: draft quote 24 (`QUO-2026-0023`) → `200`, `application/pdf`, starts `%PDF-`; 0 `media` rows. `pdftotext` shows lines, VAT block and totals.
- DOC-02: line 2 quantity 10 → 12 → the PDF shows `12`, `1200.00`, VAT `252.00`, `Total incl. VAT 6540.00` (= API `amount_incl_vat`); still 0 media rows.
- DOC-03: send → `201 sent`; exactly 1 media row (id 60): `quote`, entity 24, `is_locked t`.
- DOC-04: two `GET /api/quotes/24/pdf` → `302` to the same URL; both downloads md5 `6b10d707296174c64a5f43d01444bcea` (3652 bytes).
- DOC-05: the URL is `…/Chantios/tenant-1/quote/24/QUO-2026-0023_VBzMmpVUt.pdf` — waits for the owner's ImageKit look.
- DOC-06: `DELETE /api/media` and `DELETE /api/media/permanent` with `[60]` → `200 {"deleted":[],"skipped":[60]}` both times; row still there, `deleted_at` empty; the file URL still answers `200`.
- DOC-07: invoice 10 (`INV-2026-0010`): draft PDF `200`, 0 media rows; send → 1 locked `invoice` row (id 61); `GET …/pdf` → `302` to `…/tenant-1/invoice/10/INV-2026-0010_vorfPGsrs.pdf`.
- DOC-08: a new quote (id 27, `QUO-2026-0025`, 120 × 40.00 at 6% + 10 × 100.00 at 21%) sent, frozen PDF read: `6% 4800.00 288.00`, `21% 1000.00 210.00`, `Total excl. VAT 5800.00`, `Total VAT 498.00`, `Total incl. VAT 6298.00` = API `amount_incl_vat` `6298`.
- DOC-09: invoice PDF (draft and frozen) has `Due date: 2026-11-08` under the header and a `Payment` block with the due date and the note. No bank details (open question 11).
- DOC-10: B draft quote (no logo, `logo_media_id` null) → `200`, no `/Image` object, the company name `TEST Beta Bouw` on top; the PDF uses `Helvetica-Bold`.
- DOC-11: A draft quote → `200`, the PDF holds an `/Subtype /Image` object.
- DOC-12: replaced A's logo with a different PNG (media 62); a new draft PDF changed (md5 differs); the frozen quote 24 downloaded again is byte-identical to the one from DOC-04.
- DOC-15: portal link on project 4; `GET /api/portal/<token>/documents/60` → `302` to the same file as DOC-04 (same md5); tracking `downloads 0 → 1`, one `download` event.
- DOC-13 / DOC-14: 3 client emails sent (13:03 quote `QUO-2026-0023`, 13:03 invoice `INV-2026-0010`, 13:04 quote `QUO-2026-0025`). The Resend API does not show attachments, so the owner checks the inbox.
- ISO-DOC-01: B owner on A's quote 24 → `404 Quote not found`; on A's invoice 10 → `404 Invoice not found`.
- DOC-16: `grep -rn "TODO: step 15" src/` → nothing.

Notes (no scenario fails):
- DOC-08's numbers are the same as the DOC-01 draft before the edit; a second quote was used so that the frozen file of DOC-03 keeps the 12 × 100 lines.
- The text of the PDF was read with `pdftotext`; the saved PDFs are in the scratchpad (`frozen-q24.pdf`, `frozen-i10.pdf`, `d08.pdf`, …).
- A's logo is now `logo-blue.png` (media 62); the old test logo was replaced.

Data left: quotes 24 (sent, media 60), 26 (draft, A), 27 (sent, media 63), 25 (draft, B); invoice 10 (sent, media 61, from quote 24); A's logo media 62; an active portal link on project 4.
