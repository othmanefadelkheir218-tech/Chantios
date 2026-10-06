# Tests — Client Portal

> Routes: staff — `/api/projects/:id/portal-link`, `/api/projects/:id/portal-tracking`; client — `/api/portal/:token/...` (no login). Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [client-portal.md](../client-portal.md), [client-invoices.md](../client-invoices.md), [chat-conversations.md](../chat-conversations.md), the step file [Phaces/12-client-portal.md](../Phaces/12-client-portal.md).

## Before you start

- **Two surfaces, kept apart.** Staff routes are `@TenantAuth()` + `@Module('projects')` (`admin`, `manager`, `supervisor`, `leader`; a `worker` gets `403`). Client routes carry **no cookie and no JWT** — the URL is the key, and `PortalTokenGuard` is their only gate.
- **Log in first (staff).** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`. Client calls use **no** `-b jar.txt`: `curl http://localhost:5391/api/portal/<token>`. Login is rate-limited (5 per minute) — space the logins.
- **No new migration this step** — `portal_tokens`, `portal_tracking` and the partial unique index `idx_portal_one_active` already existed from step 01.
- **The token:** 32 random bytes, 43 URL-safe characters. Only its sha256 is stored. `PORTAL_BASE_URL` (already ending in `/portal`) + `/<token>` is the URL you give the client.
- **Prerequisites:** a client, a project, a **sent** quote (a line with a service gives reservations on accept), and invoices in several statuses (steps 04–06). A project only takes a site report (step 09) once it is `in_progress`.
- Every record you create should start with `TEST`.
- **Rate limit:** every portal route allows 60 requests a minute per address. The last scenario trips it on purpose — run it last.

---

## 1. Generate the link (staff)

### POR-01 — Generate → the raw token once, only the hash stored

`POST /api/projects/:id/portal-link` `{}` as `admin` → `201`, `{ token, url, expires_at, replaced_previous_link }`. In the database `portal_tokens.token_hash` is the **sha256** of the token and no column holds the token itself; neither does any `audit_logs` row. `expires_at` is about 90 days away (the **column**, so a per-tenant setting later is not a migration); `{"expires_in_days":7}` is honoured (1–365). Confirmed live.

### POR-02 — Who can

No login → `401`. A `worker` → `403`. Another tenant's staff on this project → `404`. Confirmed live.

### POR-03 — The project thread is opened (idempotent)

Generating a link calls chat's `ensureProjectConversation`: exactly **one** `project_client` conversation exists for the project, with the client (`client_id`) and the generating employee as members. Generating again reuses it — still one. Confirmed live.

### POR-04 — The status, never the token

`GET /api/projects/:id/portal-link` → `{ active, expires_at, created_at }`. The token cannot be shown again (only its hash exists): lose it and you generate a new one. Confirmed live.

---

## 2. The three checks, and one generic answer

### POR-05 — The overview, with no login

`GET /api/portal/<token>` with no cookie → `200`: `company_name`, `project` (name, status, city, dates), `progress` (the **newest** site report's %), `photos`, `quotes` and `invoices` counts, `link_expires_at`. The response carries `Cache-Control: no-store` and `Referrer-Policy: no-referrer` (the token is in the URL, so it ends up in logs and history). Opening it writes one `view` row. Confirmed live.

### POR-06 — Every failure is the SAME answer

| Case | Result |
|---|---|
| a random token | `403` `This link has expired. Please contact your company.` |
| a link replaced by a newer one | the **identical** `403`, on the very next request |
| a revoked link | the **identical** `403`, on the very next request |
| `expires_at` set in the past (while `is_active` is still `true`) | the **identical** `403` |

The body is byte-for-byte the same, so nothing tells a probe which check failed. Confirmed live.

### POR-07 — Regenerate, revoke, expire

`POST …/portal-link` again → the previous URL fails at once, the new one works, still exactly one active link per project (the database refuses a second: `idx_portal_one_active`). `DELETE …/portal-link` → `200`, the URL fails on the next request; again → `404`. `yarn job:expire-portal-tokens` marks links past `expires_at` inactive (daily at 07:00 for real; the guard already refuses them either way). Confirmed live.

---

## 3. What the client sees — and never sees

### POR-08 — Quotes and invoices: only the visible statuses

| List | Shown | Never shown |
|---|---|---|
| `GET /api/portal/<token>/quotes` | `sent`, `accepted` | `draft`, `refused`, another project's quote |
| `GET /api/portal/<token>/invoices` | `sent`, `partially_paid`, `paid` | `draft`, `cancelled` |

A late invoice carries `is_late: true` and `label: "late"` (calculated from the `invoice_balance` view, never a stored status); a paid one shows nothing due. A quote shows `can_respond` (`sent` and not past `valid_until`). Confirmed live.

### POR-09 — The allow-list

Every portal payload is built field by field in `portal-view.helper.ts` — never an entity with fields stripped afterwards, so a new column cannot leak by accident. A scan of the overview, quotes and invoices JSON finds **none** of: internal notes (`clients.note`, `projects.description`, `quotes.note`, invoice notes), margins, costs, suppliers, subcontractors, purchase invoices, employee names or ids, hours, stock, `tenant_id`, `created_by`, `service_id`, reminder counters. Confirmed live (the test data carried `INTERNAL …` text in every one of those fields). A unit test scans a full payload the same way.

---

## 4. Accept and refuse — one code path, two doors

### POR-10 — The client accepts

`POST /api/portal/<token>/quotes/<id>/accept` → `201`: the quote is `accepted` with a real `accepted_at`, the project moves to `in_progress`, and the **reservations are created** from the recipes (Paint 6, Tape 2 for 40 m²). It calls the very `AcceptQuoteHandler` staff use; the client acts as `{ userId: null, tenantId }`, so `project_status_history.changed_by` is `NULL` and the audit row is `portal_accept` (client id + token id + IP). Accepting again → `400` (the staff handler refuses an already-accepted quote), no second reservation. Confirmed live.

### POR-11 — What is refused

A quote of **another project** through this token, a **draft**, a **refused** one, an unknown id → all a plain `404` (nothing confirms the quote exists), and nothing changes (still `prospect`, no reservation). Confirmed live.

### POR-12 — Staff accepts the same way → identical result

A staff member accepting an equivalent quote (`POST /api/quotes/:id/accept`) leaves the project in the identical state: `in_progress`, the same reservations and quantities, the same history reason `quote_accepted`. The only difference is who it is recorded against (`NULL` for the client, the employee for staff). Confirmed live.

### POR-13 — The client refuses

`POST …/quotes/<id>/refuse` → quote `refused` with `refused_at`, the project **stays `prospect`**. Refusing again → `404` (a refused quote is no longer visible). Confirmed live.

---

## 5. Progress, photos, documents, tracking

### POR-14 — Progress and photos come from the site reports

A report on a `prospect` project is refused (step 09) — it must be `in_progress`. After accepting, a supervisor posts 35 % and a photo: the portal overview shows `35` and the photo (`id`, `file_name`, `file_url`, `created_at` — nothing else). Confirmed live.

### POR-15 — The frozen PDF

Staff upload the PDF with `POST /api/media` (`entity_type = quote | invoice`; step 15 will generate them). The quote lists its documents (id + name); `GET /api/portal/<token>/documents/<mediaId>` → `302` to the file and one `download` row. A document is served only if its owner is a quote or invoice of **this token's project** that the client may see. A draft quote's PDF, another project's PDF, a report photo, an unknown id → `404`, and **no** download is tracked. Confirmed live.

### POR-16 — Tracking

Two opens → 2 `view` rows; one download → 1 `download` row. `GET /api/projects/:id/portal-tracking` → `{ views, downloads, last_opened_at, events }` — "opened 4 times, downloaded once", over every link the project ever had. The client's IP is recorded, never shown. A tracking failure never breaks the client's request. Confirmed live.

---

## 6. Messages

### POR-17 — The client talks to the company

`POST /api/portal/<token>/messages` `{"content":"…"}` → `201`, `from: "you"`. It is stored as `sender_type = 'client'`, `sender_id` = the **token's** client (a `client_id` or any sender in the body → `400`; empty → `400`; over 5000 characters → `400`). Staff who joined the thread's socket room receive it **live**, and see it in the dashboard thread. Confirmed live.

### POR-18 — The client reads the answer

`GET /api/portal/<token>/messages` → newest first, staff shown as `from: "company"` — **no** employee name, id or `sender_*` field. Opening it writes the client's `message_reads` row (one per message, the client's own messages excluded); opening again adds none. Confirmed live.

---

## 7. Isolation and rate limit

### POR-19 — A valid token cannot reach another tenant

Tenant B has its own project and link. Its token opens tenant B's portal only; used on tenant A's data it cannot accept tenant A's quote (`404`), download tenant A's document (`404`) or see tenant A's messages or quotes. The tenant comes from the token row, written into `nestjs-cls` by the guard before any query; the project and client come from the same row, so a route can never be talked into another project. Tenant B's staff get `404` on tenant A's link status, tracking and revoke. Confirmed live.

### POR-20 — Rate limit

75 quick requests to one portal route → the first ones `403` (probe tokens), then `429` once the 60-per-minute limit is hit. Confirmed live.
