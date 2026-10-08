# Phase 16 — Documents (PDF)

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [client-invoices.md](../client-invoices.md), [media-files.md](../media-files.md) § `is_locked`.
> Old reference: [../test/19-documents.md](../test/19-documents.md).

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
| DOC-01 | `GET /api/quotes/<draft>/pdf` | `200`, `Content-Type: application/pdf`, a real PDF; **0** `media` rows for that quote | todo |
| DOC-02 | Change a line, download again | the new quantity and total appear; still 0 media rows | todo |
| DOC-03 | Send it | exactly **one** new media row: `entity_type quote`, `entity_id` = the quote, `is_locked true` | todo |
| DOC-04 | `GET /api/quotes/<id>/pdf` twice | `302` to the frozen file; both downloads byte-identical (same md5) | todo |
| DOC-05 | **[CHECK IMAGEKIT]** | the frozen PDF is in `tenant-<A>/quote/<id>/` | todo |
| DOC-06 | `DELETE /api/media` and `/permanent` with its id | `skipped: [id]` both times; row and file kept | todo |
| DOC-07 | Same for an invoice | one locked `invoice` row on send; `302` after | todo |

## 2. The numbers

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-08 | Quote: 120 m² × `40.00` at 6% + 10 × `100.00` at 21%, send, open the PDF | VAT block: `6% · 4800.00 · 288.00` and `21% · 1000.00 · 210.00`, `Total VAT 498.00`; `Total incl. VAT` = `amount_incl_vat` to the cent | todo |
| DOC-09 | Invoice PDF | `Due date` under the header and a `Payment` block with the due date and the note | todo |

## 3. Letterhead

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-10 | B draft quote PDF (no logo) | company name as bold text, no crash | todo |
| DOC-11 | A draft quote PDF (logo) | the image appears (the PDF holds an `/Image` object) | todo |
| DOC-12 | A quote frozen **before** a logo change keeps its old look | frozen, never re-rendered | todo |

## 4. Email and portal

| ID | Do | Expected | Result |
|---|---|---|---|
| DOC-13 | **[CHECK EMAIL]** `gryehirir@gmail.com` — the DOC-03 quote email | the PDF is **attached** and opens, and it matches DOC-04's file | todo |
| DOC-14 | **[CHECK EMAIL]** the DOC-07 invoice email | the PDF is attached | todo |
| DOC-15 | Portal: `GET /api/portal/<token>/documents/<frozen id>` | `302` to the same file, one `download` tracking row | todo |

## 5. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-DOC-01 | B owner: `GET /api/quotes/<A quote>/pdf`, `/api/invoices/<A invoice>/pdf` | `404 Quote not found` / `404` | todo |
| DOC-16 | `grep -rn "TODO: step 15" src/` | nothing | todo |
