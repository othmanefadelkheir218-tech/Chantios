# Step 12 — Client Portal  *(phase 10)*

> Needs step 06 (quotes, invoices), step 09 (progress %) and step 11 (chat) in place.

## Goal

A read-only page the client opens with no login. The URL itself is the key. The one thing they can change is accepting or refusing a quote.

## Decide first

**None.** Fully specified.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 9.

| Table | Purpose |
|---|---|
| `portal_tokens` | one **active** token per project |
| `portal_tracking` | one row per open or download |

A partial unique index enforces one active link per project: generating a new one deactivates the old.

### The token

The raw token is **never stored** — only `token_hash` (sha256). Lookup is by hash, so a database leak gives nobody portal access.

Three checks on every request:

1. sha256 of the URL token matches a `token_hash` row
2. `is_active = true`
3. `expires_at` has not passed

Any failure → *"This link has expired. Please contact your company."* No detail about which check failed.

### Creation is manual

Staff clicks **"Generate link"** on the project page. **Never automatic on project creation** — that would open a client chat for every `prospect` the company never wins.

### Expiry

90 days, held in the `expires_at` **column**, not a constant — so making it per-tenant later is a settings change, not a migration.

## The tenant problem — read this before coding

Portal routes have **no JWT**, so `AuthGuard` and `TenantGuard` do not run. The Prisma extension still needs a `tenant_id`.

**The token row supplies it.** The validator middleware looks up `portal_tokens` by hash, then writes that row's `tenant_id` into `nestjs-cls` **before any other query runs**. Skip this and the extension has no tenant at all.

This is the single most important detail in the step. See [technical/build-order.md](../technical/build-order.md) § 1b.

## Modules to create

```
src/portal/
├── decorators/portal.swagger.ts
├── dto/generate-token.dto.ts, portal-message.dto.ts
├── entities/portal-view.entity.ts
├── guards/portal-token.guard.ts       ← the 3 checks + puts tenant_id into CLS
├── handlers/generate-token.handler.ts, revoke-token.handler.ts,
│            find-tracking.handler.ts, portal-overview.handler.ts,
│            portal-quotes.handler.ts, portal-invoices.handler.ts,
│            portal-accept-quote.handler.ts, portal-refuse-quote.handler.ts,
│            portal-messages.handler.ts, portal-send-message.handler.ts,
│            track-event.handler.ts, expire-tokens.handler.ts
├── repositories/portal-token.repository.ts, portal-tracking.repository.ts
└── portal.service.ts / portal.controller.ts / portal-admin.controller.ts / portal.module.ts
```

Two controllers on purpose: `portal-admin.controller.ts` for staff (behind `AuthGuard`) and `portal.controller.ts` for the client (behind `PortalTokenGuard`). Mixing them makes it too easy to leak a staff route into the public surface.

## Routes

### Staff side — `AuthGuard`

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/projects/:id/portal-link` | `projects:edit` | returns the raw token **once** |
| `GET` | `/api/projects/:id/portal-link` | `projects:view` | status, expiry — **never the token** |
| `DELETE` | `/api/projects/:id/portal-link` | `projects:edit` | `is_active = false`, instant |
| `GET` | `/api/projects/:id/portal-tracking` | `projects:view` | "opened 3 times, downloaded once" |

### Client side — `PortalTokenGuard`, no JWT

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/portal/:token` | overview: project, progress %, counts. Writes a `view` event |
| `GET` | `/api/portal/:token/quotes` | `sent` and `accepted` only |
| `POST` | `/api/portal/:token/quotes/:id/accept` | **the client's only write** |
| `POST` | `/api/portal/:token/quotes/:id/refuse` | |
| `GET` | `/api/portal/:token/invoices` | `sent`, `partially_paid`, `paid` only |
| `GET` | `/api/portal/:token/documents/:mediaId` | the frozen PDF. Writes a `download` event |
| `GET` | `/api/portal/:token/messages` | the `project_client` thread |
| `POST` | `/api/portal/:token/messages` | `sender_type = 'client'` |

All client routes are `@Public()` at the Nest level — the `PortalTokenGuard` is their only gate. Rate-limit them: the token is in the URL and will end up in logs and browser history.

## What the client sees

| Section | Visible | Condition |
|---|---|---|
| Quote | yes | status `sent` or `accepted` — **never `draft`, never `refused`** |
| Invoices | yes | `sent`, `partially_paid`, `paid` — **not `draft`**, not `cancelled`. A late one shows a red label |
| Progress % | yes | newest `reports` row (step 09) |
| Photos | yes | `media` with `entity_type = 'report'` |
| Messages | yes | the `project_client` thread |

**Never visible:** margins, costs, subcontractors, suppliers, purchase invoices, employee names, hours, stock, internal notes (`clients.note`, `projects.description` if internal).

Build the portal response from an explicit **allow-list** of fields. Never serialise an entity and strip fields afterwards — the next person who adds a column leaks it.

## DTOs

### `generate-token.dto.ts`
No body needed. Optionally `expires_in_days` `@IsInt @Min(1) @Max(365)`, default 90.

### `portal-message.dto.ts`
`content` `@IsNotEmpty @MaxLength(5000)`.

## Repository methods

```ts
// portal-token.repository.ts
create(data, tx), findByHash(hash)          // no tenant filter — this call ESTABLISHES the tenant
findActiveByProject(projectId), deactivateByProject(projectId, tx)
revoke(id), findExpired()

// portal-tracking.repository.ts
create(data), findByToken(portalTokenId), countByTypeForProject(projectId)
```

`findByHash` is the one query that cannot be tenant-filtered — it runs **before** any tenant is known. Put it on the unwrapped client explicitly and comment why, exactly like `users.findByEmail` in step 02.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `generate-token.handler` | random token → sha256 stored, raw returned **once**. Deactivates the previous active token. `expires_at = now + 90 days`. Then calls step 11's `ensure-project-conversation` — idempotent, so regenerating never makes a second thread. Builds the URL from `PORTAL_BASE_URL` |
| `revoke-token.handler` | `is_active = false`. Instant, no cache, no grace period |
| `portal-overview.handler` | the allow-listed payload. Writes a `view` tracking row |
| `portal-accept-quote.handler` | calls **step 06's `accept-quote` handler** — the same code a staff member hits. So project → `in_progress`, reservations created, `accepted_at` real. Only a `sent` quote on this project |
| `portal-refuse-quote.handler` | step 06's `refuse-quote`. Project stays `prospect` |
| `portal-send-message.handler` | step 11's `send-message` with `sender_type = 'client'`, `sender_id = client_id` from the token |
| `track-event.handler` | one row per `view` / `download` |
| `expire-tokens.handler` | daily cron, marks passed tokens `is_active = false` |

### Accept / Refuse — one code path, two doors

The client in the portal and a staff member answering the phone **call the same handler**. That is why `accepted_at` is always real and the reservation chain can never be skipped. Do not write a second acceptance implementation here.

## Tasks

- [x] `PortalTokenGuard` — the 3 checks, **and** `tenant_id` into `nestjs-cls` before any query
- [x] `findByHash` on the unwrapped client, with a comment explaining why
- [x] Two controllers: staff and client, kept separate
- [x] `generate-token` → raw token returned once, only the hash stored
- [x] Generating again deactivates the previous token
- [x] `ensure-project-conversation` called on generation (step 11)
- [x] `PORTAL_BASE_URL` read from env (added in step 02)
- [x] Allow-listed portal responses — no entity serialisation
- [x] Accept / Refuse calling step 06's handlers, not a copy
- [x] Portal messaging through step 11's `send-message`
- [x] `portal_tracking` on view and download
- [x] Tracking read endpoint for staff
- [x] Daily expiry cron
- [x] Rate limit every `/api/portal/*` route

## Acceptance

- [x] Generate a link → raw token returned once; the database holds only a hash
- [x] Open the URL → overview loads with project, progress %, invoice list
- [x] Generate a new link → the old URL stops working immediately
- [x] Revoke → the URL fails on the very next request
- [x] Set `expires_at` in the past → the URL fails
- [x] A random token → the same generic expired message, no detail
- [x] A `draft` quote → **not** in the portal
- [x] A `draft` or `cancelled` invoice → **not** in the portal
- [x] A late invoice → shows the late label
- [x] The portal payload contains **no** margin, cost, subcontractor, supplier, employee or stock field
- [x] Client clicks Accept → quote `accepted`, project `in_progress`, **reservations created**
- [x] Staff accepts the same way → identical result
- [x] Accept a quote belonging to **another** project through this token → refused
- [x] Client sends a message → staff sees it in the dashboard thread
- [x] Opening the portal twice → 2 `view` rows; a download → 1 `download` row
- [x] A portal request cannot read another tenant's data, even with a valid token
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [client-portal.md](../client-portal.md) — the token, expiry, revocation, what the client sees
- [client-invoices.md](../client-invoices.md) — which invoices appear
- [technical/phase-10-client-portal.md](../technical/phase-10-client-portal.md)
- [technical/build-order.md](../technical/build-order.md) — § 1b the CLS detail
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 9
