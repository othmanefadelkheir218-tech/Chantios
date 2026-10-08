# Phase 17 — Support, Feedback, Analytics & Impersonation

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
| SUP-01 | Manager `POST /api/support/tickets` | `403` — admin only | todo |
| SUP-02 | Owner `{ subject: "TEST Cannot export", category: "bug", priority: "high", message: "TEST first message" }` | `201`: a ticket, a `support` conversation with `support_ticket_id`, the first message — all three or none | todo |
| SUP-03 | Platform alert | `support_ticket_opened` for the platform admins. **[CHECK EMAIL]** `othmanefadelkheir218+staff@gmail.com` | todo |
| SUP-04 | Bad `category` / `priority`; subject over 200 chars | `400` | todo |
| SUP-05 | DB insert of a `support` conversation with no ticket | refused `chk_support_has_ticket` | todo |
| SUP-06 | B `GET /api/support/tickets` → none of A's; platform `GET /api/admin/support/tickets?status=&priority=&tenant_id=` → all, filtered | as stated | todo |
| SUP-07 | `PATCH /api/admin/support/tickets/:id/assign { assigned_admin_id: <staff> }` | `assigned_admin_id` set; a `conversation_members` row for that admin | todo |
| SUP-08 | Platform reply (`POST /api/admin/support/:ticketId/messages?tenant_id=<A>`) | the owner sees it in `GET /api/conversations/:id/messages`; audit `support_reply` | todo |
| SUP-09 | `PATCH .../status` then `.../close` | each writes its own audit row; `closed`, `closed_at` set, the row still exists | todo |

## 2. Feedback

| ID | Do | Expected | Result |
|---|---|---|---|
| FB-01 | Worker `POST /api/feedback { type: "feature_request", title: "TEST Export to Excel", body: "..." }` | `201`, `status new` — any role may submit | todo |
| FB-02 | Owner adds a `complaint`; bad `type`; title over 200 | `201`; `400`; `400` | todo |
| FB-03 | `GET /api/feedback/mine` as owner | A's submissions only; B sees none of them | todo |
| FB-04 | Platform `GET /api/admin/feedback?status=&type=&tenant_id=` | filtered; `?type=rant` → `400` | todo |
| FB-05 | Platform `PATCH /api/admin/feedback/:id/status { status: "planned" }`; with `title`; `{}`; `bogus` | `200`; `400`; `400`; `400` | todo |
| FB-06 | Owner `GET /feedback/mine` | shows `planned`; no reply route exists | todo |

## 3. Analytics

| ID | Do | Expected | Result |
|---|---|---|---|
| AN-01 | `POST /api/analytics/track { event_name: "TEST_quote_sent", payload: { test: "true" } }` | `202 { accepted: true }` at once; the row appears a moment later | todo |
| AN-02 | Empty `event_name`; 101 chars | `400` | todo |
| AN-03 | Platform `GET /api/admin/analytics?event_name=&tenant_id=&from=&to=`; `?from=yesterday` | filtered; `400` | todo |
| AN-04 | Stop Redis for a moment, `track` again | still `202` — the request never fails. Start Redis again | todo |

## 4. Impersonation

| ID | Do | Expected | Result |
|---|---|---|---|
| IMP-01 | Platform `POST /api/admin/impersonate/<A>` | `201`, a tenant `access_token` cookie **added**; the admin's own cookies untouched | todo |
| IMP-02 | `GET /api/auth/me` while impersonating | A's owner, not the platform admin | todo |
| IMP-03 | `DELETE /api/admin/impersonate` | tenant cookie cleared (`/auth/me` → `401`); `GET /api/admin/support/tickets` still `200` | todo |
| IMP-04 | `audit_logs` | exactly 2 rows, `impersonate_enter` and `impersonate_exit`, same tenant | todo |
| IMP-05 | Impersonate `TEST Gamma` (no active admin user) | `400`, no cookie, no audit row | todo |
| IMP-06 | Staff admin impersonates | the answer the code gives (`201` or `403`) is written down — the rule does not say which roles may | todo |

## 5. Known, not bugs

- Platform alerts have no dedup — repeated cron runs can repeat `support_ticket_opened` / `usage_spike`.
- `usage_spike` (90 % of `storage_gb`) is a placeholder — open question 12.
