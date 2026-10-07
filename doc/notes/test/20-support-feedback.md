# Tests — Support, Feedback, Analytics & Impersonation

> Routes: `/api/support/tickets`, `/api/admin/support/tickets`, `/api/admin/support/:ticketId/messages` (step 11), `/api/feedback`, `/api/admin/feedback`, `/api/analytics/track`, `/api/admin/impersonate/:tenantId`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [chat-conversations.md](../chat-conversations.md), [alerts.md](../alerts.md), the step file [Phaces/16-support-feedback.md](../Phaces/16-support-feedback.md).

## Before you start

- **A ticket is a container.** All the talking happens in its `support` conversation (step 11). Ticket fields hold status/routing only.
- **The admin support routes need `?tenant_id=`.** Same already-decided escape-hatch pattern as step 11: `POST /api/admin/support/:ticketId/messages?tenant_id=<id>` — the ticket must belong to that tenant or it's not found.
- **Feedback is one-way.** The tenant posts, the platform changes status. There is no reply endpoint — if a reply is needed, open a support ticket instead.
- **Impersonation sets a SECOND cookie, not a swap.** The platform admin's own `admin_access_token`/`admin_refresh_token` stay untouched; a tenant `access_token` cookie is added alongside them. Exiting clears only the tenant cookie — the admin's own session survives.
- Log in as `admin@dupont.test` / `Demo@12345678` (tenant), `manager@dupont.test` (same password, for the role check), `admin@chantieros.local` (platform — see `00-how-to-test.md` § 2b).
- Every record you create should start with `TEST`.

## 1. Support tickets

### SUP-01 — Only `admin` may open one
`manager@dupont.test` → `POST /api/support/tickets` → `403`. `admin@dupont.test` → `201`: a `support_tickets` row, a `conversations` row (`type = 'support'`, `support_ticket_id` set), and the first message — all in **one transaction** (confirm by checking the DB directly: all three exist, or none do).

### SUP-02 — The DB refuses a ticketless support conversation
`INSERT INTO conversations (tenant_id, type) VALUES (<id>, 'support')` directly → rejected by `chk_support_has_ticket`.

### SUP-03 — Tenant isolation, platform sees everything
`GET /api/support/tickets` as `admin@verhelst.test` → never shows Dupont's ticket. `GET /api/admin/support/tickets` (platform admin) → shows every tenant's.

### SUP-04 — Assign adds the admin to the conversation
`PATCH /api/admin/support/tickets/:id/assign {"assigned_admin_id": <id>}` → `assigned_admin_id` set, and a `conversation_members` row for that `admin_user_id` appears on the ticket's conversation.

### SUP-05 — The reply chain + audit
Platform admin replies (`POST /api/admin/support/:ticketId/messages?tenant_id=<id>`) → the tenant sees it on `GET /api/conversations/:id/messages`, and an `audit_logs` row (`action = 'support_reply'`) exists. `PATCH .../status` and `.../close` each write their own explicit audit row too (not the generic `@AuditLog` interceptor — those routes have no `tenant_id` in their params, so it's written by hand off the ticket's own `tenant_id`).

### SUP-06 — Closing never deletes
`PATCH /api/admin/support/tickets/:id/close` → `status: 'closed'`, `closed_at` set, the row still there.

## 2. Feedback

### FB-01 — Submit and read back
`POST /api/feedback {"type": "feature_request", "title": "TEST ...", "body": "..."}` → `201`, `status: 'new'`. `GET /api/feedback/mine` lists it.

### FB-02 — The platform changes status, the tenant sees it, no reply exists
`PATCH /api/admin/feedback/:id/status {"status": "planned"}` → the tenant's `GET /api/feedback/mine` shows the new status immediately. There is no route for the tenant to reply.

## 3. Analytics

### AN-01 — Fire and forget
`POST /api/analytics/track {"event_name": "TEST_quote_sent", "payload": {...}}` → `202` immediately (`{"accepted": true}`). The row appears in `analytics_events` a moment later, once the BullMQ worker picks it up. Structurally guaranteed never to block the caller or fail the request even if the queue/worker is down (`AnalyticsService.track()` is fire-and-forget with its own `.catch()` — checked in code, not by literally killing Redis).

## 4. Impersonation

### IMP-01 — Enter, act, exit — exactly two audit rows
`POST /api/admin/impersonate/:tenantId` → `201`, a new `access_token` cookie is added (the admin's own `admin_access_token` is untouched — both exist in the cookie jar at once). `GET /api/auth/me` while impersonating returns the TENANT'S OWN admin user, not the platform admin. `DELETE /api/admin/impersonate` → the tenant cookie is cleared (`GET /api/auth/me` → `401`), the platform admin's own session still works (`GET /api/admin/support/tickets` → `200`). Exactly two `audit_logs` rows exist: `impersonate_enter` and `impersonate_exit`, both naming the same tenant.

### IMP-02 — No active admin user to impersonate
A tenant with no active `admin`-role user → `400`, no cookie set, no audit row (checked in code: the row is written only after the admin lookup succeeds).

## 5. Known limitations, not bugs

- **Platform alerts have no dedupe.** `DispatchNotificationHandler.toPlatform()` never calls the dedupe step that tenant-staff alerts get — `support_ticket_opened` and `usage_spike` can in principle fire more than once for the same thing on repeated cron runs. Confirmed by reading the dispatch code, not patched with a second mechanism this step.
- **The usage-spike threshold (90% of `storage_gb`) is a placeholder**, same shape as `STALLED_PROJECT_DAYS` — see open question 12 in both lists. AI-token usage isn't checked at all (v2).
- **3 pre-existing leftover tenants in this dev DB have no subscription row** (ids vary, all named "Rénovation Dupont" — residue from early registration tests in steps 01/02, not from this session). The usage-spike and retention crons correctly skip them (per-tenant try/catch in `TenantRunner`) rather than crashing — this is a live demonstration of that isolation working, not a new bug. Matches the already-logged open question 8 ("tenant created by the super-admin ... does it also create the trial subscription row").
