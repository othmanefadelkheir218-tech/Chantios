# Phase 14 — Client Portal

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [client-portal.md](../client-portal.md), [client-invoices.md](../client-invoices.md).
> Old reference: [../test/16-client-portal.md](../test/16-client-portal.md).

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
- Every portal route: 60 requests per minute per address. POR-22 trips it on purpose — run it last.

---

## 1. The link (staff)

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-01 | Owner `POST /api/projects/<Portal>/portal-link {}` | `201 { token, url, expires_at, replaced_previous_link }`; `expires_at` ≈ 90 days; DB holds only the sha256, no column or audit row holds the token | todo |
| POR-02 | `{ "expires_in_days": 7 }`; `0`; `366` | `201` 7 days; `400`; `400` | todo |
| POR-03 | The project thread | exactly one `project_client` conversation, members: the client + the employee who generated it; generating again → still one | todo |
| POR-04 | `GET /api/projects/<Portal>/portal-link` | `{ active, expires_at, created_at }` — never the token | todo |
| POR-05 | No login → `401`; worker → `403`; B → `404` | as stated | todo |

## 2. The three checks, one generic answer

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-06 | `GET /api/portal/<token>` with no cookie | `200`: company name, project (name, status, city, dates), progress, photos, quote and invoice counts, `link_expires_at`; headers `Cache-Control: no-store`, `Referrer-Policy: no-referrer`; one `view` row | todo |
| POR-07 | A random token | `403 This link has expired. Please contact your company.` | todo |
| POR-08 | Generate a new link → the old token | the **byte-identical** `403`, at once | todo |
| POR-09 | `DELETE .../portal-link` → token; `DELETE` again | identical `403`; `404` | todo |
| POR-10 | Set `expires_at` in the past (DB, `is_active` still true) | identical `403`; `yarn job:expire-portal-tokens` then sets `is_active false` | todo |
| POR-11 | Generate the final link for the rest of the phase | **[CHECK EMAIL]** none expected — generating a link sends no email; the token is given by staff | todo |

## 3. What the client sees — and never sees

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-12 | `GET /api/portal/<token>/quotes` | A and B (sent) only — never the draft, never another project's quote; `can_respond true` | todo |
| POR-13 | `GET /api/portal/<token>/invoices` | `sent` and the late one only; the late one `is_late true`, `label "late"`; no draft, no cancelled | todo |
| POR-14 | Allow-list scan: put `INTERNAL` text in `clients.note`, `projects.description`, quote and invoice notes, then scan overview + quotes + invoices JSON | none of: `INTERNAL`, margin, cost, supplier, subcontractor, purchase invoice, employee name or id, hours, stock, `tenant_id`, `created_by`, `service_id`, reminder counters | todo |

## 4. Accept and refuse

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-15 | `POST /api/portal/<token>/quotes/<A>/accept` | `201`: quote `accepted` with real `accepted_at`; project `in_progress`; reservations Paint 6, Tape 2, Filler 0.8; history `changed_by NULL`; audit row `portal_accept` (client id + token id + IP) | todo |
| POR-16 | Accept A again | `400`, no second reservation | todo |
| POR-17 | Accept: a quote of another project; the draft; an unknown id | plain `404`, nothing changed | todo |
| POR-18 | `.../quotes/<B>/refuse` | `refused`, `refused_at`; project status not changed by the refusal; refuse again → `404` | todo |
| POR-19 | Compare with a staff accept (`POST /api/quotes/:id/accept` on an identical quote/project) | same project state, same reservations, same history reason `quote_accepted` — only `changed_by` differs | todo |

## 5. Progress, photos, documents, tracking

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-20 | Supervisor posts a report (35 %) with a photo | overview shows `35` and the photo (`id`, `file_name`, `file_url`, `created_at` only) | todo |
| POR-21 | A's quote lists its frozen PDF (`documents: [{ id, file_name }]`); `GET /api/portal/<token>/documents/<id>` | `302` to the file, one `download` row. A draft quote's PDF, another project's PDF, a report photo, an unknown id → `404`, no download tracked | todo |
| POR-22 | `GET /api/projects/<Portal>/portal-tracking` | `{ views, downloads, last_opened_at, events }`; client IP recorded, not shown | todo |

## 6. Messages

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-23 | Client `POST /api/portal/<token>/messages { content: "TEST question from the client" }` | `201 from: "you"`, `sender_type client`, `sender_id` from the token; `client_id` in body / empty / 5001 chars → `400` | todo |
| POR-24 | Staff sockets in the thread | get it live; the owner gets a `new_message` notification | todo |
| POR-25 | Staff replies in the thread (`POST /api/conversations/:id/messages`) | **[CHECK EMAIL]** `gryehirir@gmail.com` — "you have a reply" email, French | todo |
| POR-26 | Client `GET /api/portal/<token>/messages` | newest first, staff shown as `from: "company"` — no employee name or id; one `message_reads` row per message, none added on a second open | todo |

## 7. Isolation and rate limit

| ID | Do | Expected | Result |
|---|---|---|---|
| POR-27 | B generates its own link; with B's token try A's quote accept, A's document, A's messages | `404` each — tenant, project and client all come from the token row | todo |
| POR-28 | B staff: A's link status, tracking, revoke | `404` | todo |
| POR-29 | 75 quick requests to one portal route | `429` after 60 in the minute | todo |
