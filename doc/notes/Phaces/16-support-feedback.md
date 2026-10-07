# Step 16 — Support, Feedback & Analytics  *(phase 16)*

> The last v1 step. Needs step 01 (tenants, admin_users, audit_logs) and step 11 (a ticket carries a conversation).

## Goal

Support tickets with a real conversation behind them, one-way feedback, product analytics, and the audit writer applied everywhere.

## Decide first

**1 open question — the `media` cascade cleanup**, if it is still open from step 03. `media` has no FK, so deleting a parent leaves orphan rows. Decide whether a nightly sweep removes them. This is the natural step to build that sweep, alongside the retention cron.

If it was already decided at step 03, this step has **no blockers**.

## Tables

| Table | Created | Purpose |
|---|---|---|
| `support_tickets` | step 01 | a tenant asks the platform for help |
| `feedback` | step 01 | a tenant submits a feature request |
| `analytics_events` | step 01 | page views and feature usage |
| `audit_logs` | step 01 | this step wires the writer everywhere |

No new tables. `token_recharges` belongs to the AI layer and is **not** created.

## 1. Support tickets

A ticket is a **container**; all the talking happens in a `conversations` row of type `support` (step 11). Ticket fields hold status and routing only.

| Rule | |
|---|---|
| Only the tenant `admin` role may open a ticket | |
| Opening a ticket **auto-creates** the `support` conversation | members: the tenant's users + the assigned `admin_users` |
| A tenant sees only their own tickets | a platform admin sees all |
| Tickets are **closed, never deleted** | |

## 2. Feedback

One-way: the tenant posts, the platform reads and changes the status. It is **not** a conversation. If a reply is needed, open a support ticket.

`status`: `new` → `reviewing` → `planned` / `declined` / `shipped`.

## 3. Analytics events

| Rule | |
|---|---|
| Append-only | never updated |
| Written as a **side effect**, never blocking the request | push to BullMQ and return |
| This is **product** analytics, not billing | billing counts come from `billing_usage_snapshots` (step 14) |
| Retention follows the plan's `retention_days` | a cron deletes older rows |

If the analytics queue is down, the request must still succeed. An event is never worth failing a user action for.

## 4. Audit log writer

`@AuditLog(action)` on sensitive endpoints. Every `admin_users` action on a tenant writes: who, what, which tenant, when, old value, new value.

| Must be logged | |
|---|---|
| Every platform admin action on a tenant | step 01 already writes these |
| **Impersonation** | one row on **entry** and one on **exit** |
| A platform admin's cross-tenant read in a support conversation | step 11's escape hatch |
| Time entry corrections by a manager | step 08 |
| Project status changes | step 04 also writes `project_status_history` |

## Modules to create

```
src/
├── support/
│   ├── dto/create-ticket.dto.ts, update-ticket.dto.ts, assign-ticket.dto.ts,
│   │       find-tickets-query.dto.ts
│   ├── handlers/create-ticket.handler.ts, find-tickets.handler.ts, find-ticket.handler.ts,
│   │            set-status.handler.ts, assign-ticket.handler.ts, close-ticket.handler.ts
│   ├── repositories/support-ticket.repository.ts
│   └── support.service.ts / support.controller.ts / support-admin.controller.ts / .module.ts
├── feedback/                      (step 01 built the admin side — add the tenant side)
│   ├── dto/create-feedback.dto.ts
│   ├── handlers/create-feedback.handler.ts, find-my-feedback.handler.ts
│   └── ...
├── analytics/                     (step 01 built the read side — add the emitter)
│   ├── dto/track-event.dto.ts
│   ├── handlers/track-event.handler.ts, find-events.handler.ts
│   ├── processors/analytics.processor.ts     ← BullMQ worker, fire and forget
│   └── ...
└── audit/                         (step 01 — extend)
    ├── decorators/audit-log.decorator.ts
    ├── interceptors/audit-log.interceptor.ts
    ├── handlers/impersonate-enter.handler.ts, impersonate-exit.handler.ts
    └── ...
```

Two controllers for support, as with the portal: `support.controller.ts` for tenants, `support-admin.controller.ts` for platform staff.

## Routes

### Tenant side — `AuthGuard`

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/support/tickets` | `admin` only | auto-creates the `support` conversation |
| `GET` | `/api/support/tickets` | `AuthGuard` | own tenant only |
| `GET` | `/api/support/tickets/:id` | `AuthGuard` | with its conversation id |
| `POST` | `/api/feedback` | `AuthGuard` | any role may submit |
| `GET` | `/api/feedback/mine` | `AuthGuard` | own tenant's submissions |
| `POST` | `/api/analytics/track` | `AuthGuard` | fire and forget, returns `202` |

### Platform side — `AdminAuthGuard`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/support/tickets` | all tenants, `?status=&priority=&tenant_id=` |
| `PATCH` | `/api/admin/support/tickets/:id/status` | |
| `PATCH` | `/api/admin/support/tickets/:id/assign` | sets `assigned_admin_id` |
| `PATCH` | `/api/admin/support/tickets/:id/close` | sets `closed_at` |
| `GET` | `/api/admin/analytics` | step 01 built this |
| `GET` | `/api/admin/feedback` | step 01 built this |
| `PATCH` | `/api/admin/feedback/:id/status` | step 01 built this |
| `POST` | `/api/admin/impersonate/:tenantId` | **writes an `audit_logs` entry on entry** |
| `DELETE` | `/api/admin/impersonate` | **writes one on exit** |
| `GET` | `/api/admin/audit-logs` | step 01 built this |

## DTOs

### `create-ticket.dto.ts`
`subject` `@IsNotEmpty @MaxLength(200)`. `category` `@IsIn(['bug','question','billing','other'])`. `priority` `@IsIn(['low','normal','high'])`, default `normal`. `message` `@IsNotEmpty` — the first message, written into the conversation.

### `create-feedback.dto.ts`
`type` `@IsIn(['feature_request','improvement','complaint'])`. `title` `@IsNotEmpty @MaxLength(200)`. `body` optional.

### `track-event.dto.ts`
`event_name` `@IsNotEmpty @MaxLength(100)` — e.g. `project_created`, `quote_sent`, `portal_opened`. `payload` optional object.

## Repository methods

```ts
// support-ticket.repository.ts
create(data, tx), findById(id), findMany(where, skip, take)
findAllForAdmin(where, skip, take)        // unwrapped client — platform scope, audited
setStatus(id, status), assign(id, adminUserId), close(id, closedAt)

// feedback.repository.ts   (step 01)
create(data), findMany(where, skip, take), setStatus(id, status)

// analytics-event.repository.ts
create(data), createMany(rows), findMany(where, skip, take), deleteOlderThan(date)

// audit.repository.ts      (step 01)
write(entry), findMany(where, skip, take)
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-ticket.handler` | **`admin` role only.** One transaction: the ticket row, then step 11's conversation with `type = 'support'` and `support_ticket_id` set, then the first message. The DB check means a `support` conversation without a ticket id is impossible |
| `assign-ticket.handler` | sets `assigned_admin_id`, adds that admin to the conversation members |
| `close-ticket.handler` | `status = 'closed'`, `closed_at`. **Never deletes** |
| `track-event.handler` | pushes to BullMQ and returns `202` immediately. **Never blocks, never throws into the request** |
| `analytics.processor` | the worker that actually inserts. A failure here is logged and dropped — never retried into a storm |
| `impersonate-enter.handler` | writes `audit_logs` with `action = 'impersonate_enter'`, the tenant, the admin and the time. Issues a scoped token |
| `impersonate-exit.handler` | writes `action = 'impersonate_exit'`. **Both rows or the feature is not auditable** |

### The retention cron

`retention_days` from the tenant's plan deletes **only**:

- `analytics_events` older than the window
- **read** `notifications` older than the window

It never deletes a project, quote, invoice, hour, photo, message or ticket. Business data is kept forever, whatever the plan.

## Tasks

- [x] `support` module, both controllers
- [x] `create-ticket` as one transaction: ticket + conversation + first message
- [x] `admin`-role-only check on opening a ticket
- [x] Assign adds the admin to the conversation members
- [x] Tenant-side `feedback` endpoints
- [x] `analytics` emitter through BullMQ, returns `202` — the emitter itself already existed from step 01; only the tenant-facing route was missing
- [x] `analytics.processor` — insert, never block — already existed from step 01
- [x] `@AuditLog(action)` decorator + interceptor — already existed from step 01
- [x] Apply `@AuditLog` to every sensitive endpoint from steps 01, 04, 08 and 11 — verified all 4 were already satisfied (steps 01/04/08/11 each already call `AuditService.write()` where required); only impersonation was genuinely new
- [x] Impersonation enter / exit, both audited
- [x] Retention cron: `analytics_events` + **read** notifications only — already built in step 13, confirmed unchanged and still working
- [x] The `media` orphan sweep, if that was the decision at step 03 — it was decided **no sweep job** at step 03; nothing to build
- [x] Platform alerts: new ticket opened, usage spike (step 13's `dispatch`) — both alert types already existed in `PLATFORM_ALERT_TYPES`, added ahead of time in step 13

**One new open question found and resolved with a documented placeholder, not invented:** `alerts.md`'s `usage_spike` threshold has no number (and ties to AI tokens, which are v2). Logged as open question 12 in both lists; built as storage-only at 90% of the plan's `storage_gb` allowance, one named constant (`USAGE_SPIKE_STORAGE_THRESHOLD`).

## Acceptance

All run live against a real started server (`PORT=5391 node dist/main`), the real Postgres/Redis — see [../test/20-support-feedback.md](../test/20-support-feedback.md).

- [x] A tenant `manager` opening a ticket → **403**, `admin` only
- [x] An `admin` opens a ticket → ticket row **and** a `support` conversation **and** the first message, one transaction
- [x] A `support` conversation with no `support_ticket_id` → rejected by the DB check
- [x] Tenant A listing tickets → sees **only** their own
- [x] A platform admin → sees all tenants' tickets
- [x] Assign a ticket → `assigned_admin_id` set, that admin is a conversation member
- [x] Platform admin replies → the tenant sees it, **and** an `audit_logs` row exists
- [x] Close a ticket → `closed_at` set, the row still exists
- [x] Submit feedback → row created, status `new`
- [x] Platform admin moves it to `planned` → the tenant sees the new status, cannot reply
- [x] `POST /api/analytics/track` → `202` immediately, the row appears shortly after
- [x] Stop the analytics worker → tracking still returns `202`, **the user request still succeeds** — verified structurally (`AnalyticsService.track()` never awaits the queue, catches its own failures) rather than by literally killing Redis
- [x] Impersonate a tenant → **two** `audit_logs` rows after exiting, enter and exit — also confirmed live that the platform admin's own session survives the exit untouched
- [x] Retention cron with a 30-day window → old analytics and old **read** notifications gone; unread notifications, projects, invoices and messages **all still there** — unchanged from step 13, re-confirmed still runs cleanly
- [x] `yarn lint` and `yarn build` pass
- [x] Update `../WhereIStop/state.md` — **v1 backend complete**

## Notes to read

- [chat-conversations.md](../chat-conversations.md) — the support conversation type
- [subscription-plans.md](../subscription-plans.md) — what `retention_days` may delete
- [alerts.md](../alerts.md) — the platform alerts
- [technical/phase-16-support-feedback.md](../technical/phase-16-support-feedback.md)
