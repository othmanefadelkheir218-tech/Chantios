# Phase 17 — Support, Feedback, Analytics & Impersonation

> **Status: 25 PASS, 0 FAIL, 0 SKIP.** Phase 13's SUPC-01..04 also ran here (4 PASS). 

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [chat-conversations.md](../chat-conversations.md), [alerts.md](../alerts.md).
> Old reference: [../test/20-support-feedback.md](../test/20-support-feedback.md), [../test/05-audit-analytics-feedback.md](../test/05-audit-analytics-feedback.md).

## Goal

Tickets with a real conversation behind them, one-way feedback, the fire-and-forget analytics emitter, and impersonation with two audit rows.

## Before you start

- After SUP-02, go back to phase 13 section 6 (the admin support door) — it needs this ticket.

---

## 1. Support tickets

| ID | Do | Expected | Result |
|---|---|---|---|
| SUP-01 | Manager `POST /api/support/tickets` | `403` — admin only | PASS |
| SUP-02 | Owner `{ subject: "TEST Cannot export", category: "bug", priority: "high", message: "TEST first message" }` | `201`: a ticket, a `support` conversation with `support_ticket_id`, the first message — all three or none | PASS |
| SUP-03 | Platform alert | `support_ticket_opened` for the platform admins. **[CHECK EMAIL]** `othmanefadelkheir218+staff@gmail.com` | PASS |
| SUP-04 | Bad `category` / `priority`; subject over 200 chars | `400` | PASS |
| SUP-05 | DB insert of a `support` conversation with no ticket | refused `chk_support_has_ticket` | PASS |
| SUP-06 | B `GET /api/support/tickets` → none of A's; platform `GET /api/admin/support/tickets?status=&priority=&tenant_id=` → all, filtered | as stated | PASS |
| SUP-07 | `PATCH /api/admin/support/tickets/:id/assign { assigned_admin_id: <staff> }` | `assigned_admin_id` set; a `conversation_members` row for that admin | PASS |
| SUP-08 | Platform reply (`POST /api/admin/support/:ticketId/messages?tenant_id=<A>`) | the owner sees it in `GET /api/conversations/:id/messages`; audit `support_reply` | PASS |
| SUP-09 | `PATCH .../status` then `.../close` | each writes its own audit row; `closed`, `closed_at` set, the row still exists | PASS |

## 2. Feedback

| ID | Do | Expected | Result |
|---|---|---|---|
| FB-01 | Worker `POST /api/feedback { type: "feature_request", title: "TEST Export to Excel", body: "..." }` | `201`, `status new` — any role may submit | PASS |
| FB-02 | Owner adds a `complaint`; bad `type`; title over 200 | `201`; `400`; `400` | PASS |
| FB-03 | `GET /api/feedback/mine` as owner | only the caller's own submissions (rule decided 2026-10-09); a colleague's and B's are never shown | PASS |
| FB-04 | Platform `GET /api/admin/feedback?status=&type=&tenant_id=` | filtered; `?type=rant` → `400` | PASS |
| FB-05 | Platform `PATCH /api/admin/feedback/:id/status { status: "planned" }`; with `title`; `{}`; `bogus` | `200`; `400`; `400`; `400` | PASS |
| FB-06 | Owner `GET /feedback/mine` | shows `planned`; no reply route exists | PASS |

## 3. Analytics

| ID | Do | Expected | Result |
|---|---|---|---|
| AN-01 | `POST /api/analytics/track { event_name: "TEST_quote_sent", payload: { test: "true" } }` | `202 { accepted: true }` at once; the row appears a moment later | PASS |
| AN-02 | Empty `event_name`; 101 chars | `400` | PASS |
| AN-03 | Platform `GET /api/admin/analytics?event_name=&tenant_id=&from=&to=`; `?from=yesterday` | filtered; `400` | PASS |
| AN-04 | Stop Redis for a moment, `track` again | still `202` — the request never fails. Start Redis again | PASS |

## 4. Impersonation

| ID | Do | Expected | Result |
|---|---|---|---|
| IMP-01 | Platform `POST /api/admin/impersonate/<A>` | `201`, a tenant `access_token` cookie **added**; the admin's own cookies untouched | PASS |
| IMP-02 | `GET /api/auth/me` while impersonating | A's owner, not the platform admin | PASS |
| IMP-03 | `DELETE /api/admin/impersonate` | tenant cookie cleared (`/auth/me` → `401`); `GET /api/admin/support/tickets` still `200` | PASS |
| IMP-04 | `audit_logs` | exactly 2 rows, `impersonate_enter` and `impersonate_exit`, same tenant | PASS |
| IMP-05 | Impersonate `TEST Gamma` (no active admin user) | `400`, no cookie, no audit row | PASS |
| IMP-06 | Staff admin impersonates | the answer the code gives (`201` or `403`) is written down — the rule does not say which roles may | PASS |

## 5. Known, not bugs

- Platform alerts have no dedup — repeated cron runs can repeat `support_ticket_opened` / `usage_spike`.
- `usage_spike` (90 % of `storage_gb`) is a placeholder — open question 12.

## Result — 2026-10-09

**25 PASS, 0 FAIL, 0 SKIP.** Phase 13 SUPC-01..04 also run here: 4 PASS.

- SUP-01: manager → `403 Insufficient role`. SUP-02: ticket 1 → `201`; conversation 9 (`support`, `support_ticket_id 1`), message 17, one member (the owner). SUP-03: 2 `support_ticket_opened` rows (admins 1 and 2); Resend: staff `delivered`, `admin@chantieros.local` `bounced` (problem 8); the owner confirmed the email arrived.
- SUP-04: bad category, bad priority, 201-char subject → `400`. SUP-05: `chk_support_has_ticket` refused the insert.
- SUP-06: B opened ticket 2 (billing, low) so the filters had two companies. B list = ticket 2 only; A = ticket 1 only; platform = both; `tenant_id`, `priority`, `status` filters correct.
- SUP-07: `assigned_admin_id 2`, member row for admin 2, audit `assign`. SUP-08: staff reply → the owner reads it; audit `support_reply` (admin 2).
- SUP-09: `in_progress` (audit `update_status`, old and new) then `close` (audit `close`); `closed_at` set, row kept, the owner still reads it. Bogus status → `400`.
- SUPC-01: 2 reads → 2 `support_read` rows. SUPC-02: `tenant_id=2` → 404, none → 400, unknown ticket → 404, no session → 401, tenant cookie → 401; no audit row for any. SUPC-03: reply `201`, `sender_type admin`, `support_reply` row, the owner's socket got `new_message` live. SUPC-04: platform socket `join` → `{ok:true}` + `support_join` row; an internal conversation id and the wrong company → `404`.
- FB-01..06: worker `201` status `new`; complaint `201`; bad type and 201-char title `400`; `?type=rant` `400`; `planned` `200`; with `title` → `400 property title should not exist`; `{}` and bogus → `400`; no reply route (`404`). B's `/feedback/mine` is empty.
- AN-01: `202 {accepted:true}`, row present 2 s later. AN-02: `400` twice. AN-03: filters correct; `from=yesterday` → `400`.
- IMP-01: `201`, `access_token` added, both `admin_*` cookies unchanged. IMP-02: `/auth/me` = A owner. IMP-03: exit `200`, `/auth/me` `401`, admin routes `200`. IMP-04: exactly 2 rows (383, 384, tenant 1). IMP-05: new company `TEST Gamma` (id 8, no users) → `400 This company has no active admin user to impersonate`, no cookie, no audit row.
- **IMP-06 (written down): the staff admin may impersonate** → `201`, exit `200`, 2 more audit rows (386, 387, admin 2). `audit_logs` now holds 4 impersonate rows.
- AN-04: the owner stopped Redis by hand. Two `track` calls → `202 {"accepted":true}` in about 60 ms each. After Redis was started again the API worked and both events (ids 4, 5) were in `analytics_events` — none lost. (A first try with an expired cookie gave `401`; not Redis.)

Notes (no scenario fails):
- **Two business rules decided by the owner after this run (2026-10-09), fixed and re-checked live:** (1) `GET /api/feedback/mine` shows only the caller's own submissions — before, a worker saw the owner's complaint; now worker → feedback 1 only, owner → feedback 2 only, B → feedback 3 only. (2) A feedback status change writes an `update_status` audit row (company, platform admin, old and new status) — before, none; now row 388 (feedback 2, `new` → `reviewing`, admin 1). 3 new unit tests; `tsc` clean. FB-05 also expects this audit row.
- SUPC-02 "an internal conversation's id": the HTTP route takes a **ticket** id, so an internal conversation cannot be named there (an unknown ticket id → 404). The socket `join` with an internal conversation id → `404`.
- Mid-run the dev watcher restarted the API for about a minute (replies `000`); the SUP-09 calls were sent again.

Data left: tickets 1 (closed, admin 2, conversation 9) and 2 (B, open, conversation 11); feedback 1 (planned), 2 (reviewing), 3 (B); one analytics event `TEST_quote_sent`; company `TEST Gamma` (id 8, no users); 4 impersonate audit rows.
