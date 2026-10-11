# Phase 14 — Client Portal

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [client-portal.md](../client-portal.md), [client-invoices.md](../client-invoices.md).
> Old reference: [../test/16-client-portal.md](../test/16-client-portal.md).

> **Status: 29 PASS, 0 FAIL, 0 waiting (POR-11 and POR-25 PASS on 2026-10-09).** POR-15 failed first (the audit row hid the link id as `[redacted]`); fixed the same day at the owner's request and re-run: PASS. Waiting: **POR-25 [CHECK EMAIL]** (`gryehirir@gmail.com`, the French "you have a reply" email) and **POR-11** (the owner confirms that generating a link sent no email).

## Goal

A read-only page the client opens with no login — the URL is the key. Only a hash is stored, a link can be replaced, revoked or expired, the client sees an allow-list of fields only, and accept / refuse go through the **same** handlers as staff.

## Before you start

- New project `TEST Project Portal` (prospect) for `TEST Client Main` (`gryehirir@gmail.com`), with:
  - `Q-PORTAL-A`: Painting 40 m², **sent** (to be accepted by the client)
  - `Q-PORTAL-B`: one free-text line, **sent** (to be refused by the client)
  - `Q-PORTAL-DRAFT`: draft
  - invoices: one `draft`, one `sent`, one `sent` with a past due date, one `cancelled`
- Client calls use **no** cookie: `curl http://localhost:5300/api/portal/<token>`.
- There is no frontend, so the portal is tested through the API. The URL in the email (`PORTAL_BASE_URL/<token>`) is checked for its token only.
- Every portal route: 60 requests per minute per address. POR-29 trips it on purpose — run it last.

---

## 1. The link (staff)

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-01 | Owner `POST /api/projects/<Portal>/portal-link {}` | `201 { token, url, expires_at, replaced_previous_link }`; `expires_at` ≈ 90 days; DB holds only the sha256, no column or audit row holds the token | PASS |
| POR-02 | `{ "expires_in_days": 7 }`; `0`; `366` | `201` 7 days; `400`; `400` | PASS |
| POR-03 | The project thread | exactly one `project_client` conversation, members: the client + the employee who generated it; generating again → still one | PASS |
| POR-04 | `GET /api/projects/<Portal>/portal-link` | `{ active, expires_at, created_at }` — never the token | PASS |
| POR-05 | No login → `401`; worker → `403`; B → `404` | as stated | PASS |

## 2. The three checks, one generic answer

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-06 | `GET /api/portal/<token>` with no cookie | `200`: company name, project (name, status, city, dates), progress, photos, quote and invoice counts, `link_expires_at`; headers `Cache-Control: no-store`, `Referrer-Policy: no-referrer`; one `view` row | PASS |
| POR-07 | A random token | `403 This link has expired. Please contact your company.` | PASS |
| POR-08 | Generate a new link → the old token | the **byte-identical** `403`, at once | PASS |
| POR-09 | `DELETE .../portal-link` → token; `DELETE` again | identical `403`; `404` | PASS |
| POR-10 | Set `expires_at` in the past (DB, `is_active` still true) | identical `403`; `yarn job:expire-portal-tokens` then sets `is_active false` | PASS |
| POR-11 | Generate the final link for the rest of the phase | **[CHECK EMAIL]** none expected — generating a link sends no email; the token is given by staff | PASS (owner saw only "Nouveau message de …" in `gryehirir@gmail.com`, no link email, 2026-10-09) |

## 3. What the client sees — and never sees

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-12 | `GET /api/portal/<token>/quotes` | A and B (sent) only — never the draft, never another project's quote; `can_respond true` | PASS |
| POR-13 | `GET /api/portal/<token>/invoices` | `sent` and the late one only; the late one `is_late true`, `label "late"`; no draft, no cancelled | PASS |
| POR-14 | Allow-list scan: put `INTERNAL` text in `clients.note`, `projects.description`, quote and invoice notes, then scan overview + quotes + invoices JSON | none of: `INTERNAL`, margin, cost, supplier, subcontractor, purchase invoice, employee name or id, hours, stock, `tenant_id`, `created_by`, `service_id`, reminder counters | PASS |

## 4. Accept and refuse

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-15 | `POST /api/portal/<token>/quotes/<A>/accept` | `201`: quote `accepted` with real `accepted_at`; project `in_progress`; reservations Paint 6, Tape 2, Filler 0.8; history `changed_by NULL`; audit row `portal_accept` (client id + token id + IP) | PASS (fixed 2026-10-09, re-run) |
| POR-16 | Accept A again | `400`, no second reservation | PASS |
| POR-17 | Accept: a quote of another project; the draft; an unknown id | plain `404`, nothing changed | PASS |
| POR-18 | `.../quotes/<B>/refuse` | `refused`, `refused_at`; project status not changed by the refusal; refuse again → `404` | PASS |
| POR-19 | Compare with a staff accept (`POST /api/quotes/:id/accept` on an identical quote/project) | same project state, same reservations, same history reason `quote_accepted` — only `changed_by` differs | PASS |

## 5. Progress, photos, documents, tracking

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-20 | Supervisor posts a report (35 %) with a photo | overview shows `35` and the photo (`id`, `file_name`, `file_url`, `created_at` only) | PASS |
| POR-21 | A's quote lists its frozen PDF (`documents: [{ id, file_name }]`); `GET /api/portal/<token>/documents/<id>` | `302` to the file, one `download` row. A draft quote's PDF, another project's PDF, a report photo, an unknown id → `404`, no download tracked | PASS |
| POR-22 | `GET /api/projects/<Portal>/portal-tracking` | `{ views, downloads, last_opened_at, events }`; client IP recorded, not shown | PASS |

## 6. Messages

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-23 | Client `POST /api/portal/<token>/messages { content: "TEST question from the client" }` | `201 from: "you"`, `sender_type client`, `sender_id` from the token; `client_id` in body / empty / 5001 chars → `400` | PASS |
| POR-24 | Staff sockets in the thread | get it live; the owner gets a `new_message` notification | PASS |
| POR-25 | Staff replies in the thread (`POST /api/conversations/:id/messages`) | **[CHECK EMAIL]** `gryehirir@gmail.com` — "you have a reply" email, French | PASS (owner received it in `gryehirir@gmail.com`, 2026-10-09) |
| POR-26 | Client `GET /api/portal/<token>/messages` | newest first, staff shown as `from: "company"` — no employee name or id; one `message_reads` row per message, none added on a second open | PASS |

## 7. Isolation and rate limit

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-27 | B generates its own link; with B's token try A's quote accept, A's document, A's messages | `404` each — tenant, project and client all come from the token row | PASS |
| POR-28 | B staff: A's link status, tracking, revoke | `404` | PASS |
| POR-29 | 75 quick requests to one portal route | `429` after 60 in the minute | PASS |

---

## Result — 2026-10-09

**29 PASS, 0 FAIL, 0 waiting (POR-11, POR-25 PASS 2026-10-09).** POR-15 failed first, then was fixed and re-run (see below).

Data left: project 14 `TEST Project Portal` (`in_progress`, 35 %, report 7, photo media 56), client 1. Quotes: 19 `Q-PORTAL-A` accepted by the client, 20 `Q-PORTAL-B` refused by the client, 21 draft (with a draft PDF, media 57). Invoices: 6 draft, 7 sent, 8 sent and late, 9 cancelled. Reservations for project 14: Paint 6, Tape 2, Filler 0.8. Project 15 `TEST Project Portal Staff` with quote 22 accepted by staff (the POR-19 comparison). One active link on project 14 (the earlier links are inactive in the DB); company B project 8 has its own active link. Conversation 6 (`project_client`: owner + client 1) holds messages 14–16.

- POR-01: `201`, 43-char token, `expires_at` = now + 90 days, `replaced_previous_link false`; the DB holds the sha256 only; the audit row `generate / portal_token` does not contain the token (the whole row was searched).
- POR-02: `7` → `201` (7.00 days); `0` → `400 expires_in_days must not be less than 1`; `366` → `400 … greater than 365`.
- POR-03: one `project_client` conversation (6); members = user 1 (the owner who generated it) + client 1; generating again kept it at one.
- POR-05: no login `401`, worker `403 No canCreate access to projects`, B `404 Project not found` — same on `GET`.
- POR-06: `200` with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; one new `view` row.
- POR-07/08/09/10: the same `403` body, byte for byte, for a random token, a replaced link, a revoked link and an expired one. `DELETE` again → `404 This project has no active portal link`. With `expires_at` in the past and `is_active` still `t`, `yarn job:expire-portal-tokens` marked 1 link inactive.
- POR-12/13: quotes = A and B only (`can_respond true`, each with its frozen PDF); invoices = the sent one and the late one (`is_late true`, `label late`); no draft, no cancelled; quote 8 of project 1 (also `sent`) not shown.
- POR-14: client note, project description, quote notes and invoice notes all held `INTERNAL …`; the three payloads hold none of INTERNAL, margin, cost, supplier, subcontractor, purchase, employee, hours, stock, tenant_id, created_by, service_id, reminder, user_id, email, phone, vat_number. The full key list is only the allow-list.
- **POR-15 (first FAIL, now fixed — see the end of this list)**: everything is as stated — `201`, `accepted` with `accepted_at` = the real time, project `in_progress`, reservations Paint 6 / Tape 2 / Filler 0.8, history `prospect→in_progress` with `changed_by NULL` and reason `quote_accepted`, audit `portal_accept` with the client id and the IP `::1` — **except the token id**: `new_value = {"client_id": 1, "portal_token_id": "[redacted]"}`. The audit helper redacts every key with `token` in its name, so the id of the link is never recorded (same for `portal_refuse`). 
- **POR-15 fix, 2026-10-09 (owner asked, exception to the no-code-change rule)**: the two portal handlers now write the key `portalLinkId` (stored `portal_link_id`) instead of `portalTokenId`, so the redaction rule (any key with "token") no longer hides it; the rule itself is unchanged and the secret is still never stored. 1 unit assert updated (46/46 pass), `tsc` clean. Live re-run: a client refuse wrote `{"client_id": 1, "portal_link_id": 9}`, IP `::1`, and 9 is the active link. (This re-run left quote 23, refused, on project 14, and a new active link.)
- POR-16: `400 Cannot accept a quote from status accepted`, reservations unchanged. POR-17: another project's quote, the draft, an unknown id → `404 Quote not found`, nothing changed. POR-18: `201 {id 20, status refused}`, `refused_at` set, project still `in_progress`; again → `404`.
- POR-19: project 15 / quote 22, staff accept: same quote state, same project state, same 3 reservations (6 / 2 / 0.8, all `active`), same history reason; `changed_by` is `NULL` for the portal and `1` for staff.
- POR-20: the report (35 %) with a PNG → the overview shows `progress_pct 35` and the photo with `id`, `file_name`, `file_url`, `created_at` only.
- POR-21: media 50 → `302` to the ImageKit file and 1 `download` row; the draft quote's PDF (57), the PDF of another project's quote (55), the report photo (56) and an unknown id → `404 Document not found`, still 1 row. (A sent invoice's PDF, 52 → `302`, a 2nd row, as expected.)
- POR-22: `{ project_id, views 4, downloads 2, last_opened_at, events[6] }`; no IP in the response, `ip_address ::1` in the table. The counts equal the table.
- POR-23: `201 {from: "you"}`; DB `sender_type client`, `sender_id 1` (the client of the token); `client_id` or `sender_id` in the body → `400 property … should not exist`; empty, missing, 5001 chars → `400`; the bad ones added no message.
- POR-24: the owner's socket (joined the thread) got `new_message` at once, snake_case keys; the owner's `new_message` notifications went 2 → 3 (preview, sender name `TEST Client Main`).
- POR-26: `200`, newest first, the staff reply is `from: "company"` with no name or id. The client has **1** read row (message 16, the staff reply) — the client's own messages never get a row (step 11 decision); a second open added none.
- POR-27: B's link (project 8): A's quotes 8, 19, 20 and A's documents 50, 53 → `404`; nothing of A changed. **Note on the wording**: `GET /messages` has no id, so it cannot answer `404` — with B's token it returns `200` with B's own (empty) thread, no message of A. B's quotes and invoices lists are empty.
- POR-28: B staff on A's project 14: link status, tracking, revoke → `404 Project not found`; A's link is still active and working.
- POR-29: after a 61 s wait, 75 requests in 0.9 s on `/quotes`: 60 × `200`, then 15 × `429 ThrottlerException: Too Many Requests` (`Retry-After: 60`), the first `429` at request 61.

Notes (no scenario fails):
- The `403` answers of the portal guard carry no `Cache-Control: no-store` header; only the `200` answers do. POR-06 asks for the headers on the `200` only. **FIXED 2026-10-09:** `PortalTokenGuard` now sets `Cache-Control: no-store` and `Referrer-Policy: no-referrer` first (shared `setPortalHeaders`), so a `403` has them too. Live: unknown token → `403` with both headers.
- The setup hit PRJ-01 again: `POST /api/projects` with date-only dates → `500` (full ISO dates used).
- The header of this file said "POR-22 trips [the rate limit]"; it is POR-29 (corrected).
