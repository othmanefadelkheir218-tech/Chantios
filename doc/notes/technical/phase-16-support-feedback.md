# Phase 16 — Support, Feedback & Platform Analytics

> Depends on Phase 01 (tenants, admin_users) and Phase 11 (chat — a support ticket carries a conversation).

## Tables

- `support_tickets` — a tenant asks the platform for help
- `feedback` — a tenant submits a feature request
- `analytics_events` — page views and feature usage per tenant
- `audit_logs` — already created in Phase 01; this phase wires the writer everywhere

## Key relations

```
tenants ──── support_tickets ──── conversations (type = 'support')
        └─── feedback
        └─── analytics_events
admin_users ──── audit_logs
```

## 1. Support tickets

| Field | Notes |
|---|---|
| `tenant_id` | Who opened it |
| `opened_by` | FK → `users.id` — must hold the `admin` role |
| `subject` | Short title |
| `category` | `bug` / `question` / `billing` / `other` |
| `priority` | `low` / `normal` / `high` |
| `status` | `open` / `in_progress` / `waiting_tenant` / `closed` |
| `assigned_admin_id` | FK → `admin_users.id` — nullable |
| `closed_at` | Nullable |

### Rules
- Only the tenant `admin` role can open a ticket
- Opening a ticket auto-creates a `conversations` row with `type = 'support'`; all the talking happens there, not in ticket fields
- Members of that conversation: the tenant's users + the assigned `admin_users`
- A tenant sees only their own tickets. A platform admin sees all of them
- Tickets are closed, never deleted

## 2. Feedback

| Field | Notes |
|---|---|
| `tenant_id` | Who submitted it |
| `submitted_by` | FK → `users.id` |
| `type` | `feature_request` / `improvement` / `complaint` |
| `title` | — |
| `body` | Free text |
| `status` | `new` / `reviewing` / `planned` / `declined` / `shipped` |

Feedback is one-way: the tenant posts, the platform reads and changes the status. It is not a conversation. If a reply is needed, open a support ticket.

## 3. Analytics events

| Field | Notes |
|---|---|
| `tenant_id` | Which company |
| `user_id` | Nullable — some events are tenant-level |
| `event_name` | e.g. `project_created`, `quote_sent`, `portal_opened` |
| `payload` | JSON with context |
| `created_at` | — |

### Rules
- Append-only, never updated
- Written as a **side effect**, never blocking the request. Push to BullMQ and return
- This is product analytics, not billing. Billing counts come from `billing_usage_snapshots` (Phase 01)
- Retention follows the tenant's plan `retention_days` — a cron deletes older rows

## 4. Token recharges — v2

`token_recharges` belongs to the AI layer, which is not in v1. The table is not created in the first migration.

## 5. Audit log writer

- `@AuditLog(action)` decorator, applied to sensitive endpoints
- Every `admin_users` action on a tenant writes a row: who, what, which tenant, when, old value, new value
- Impersonation (a platform admin viewing a tenant) writes a row on entry **and** exit
- Cross-tenant reads by a platform admin in support conversations are logged here too

## What to build

- `support_tickets` CRUD + auto-create the support conversation
- `feedback` CRUD (tenant posts, admin changes status)
- Analytics event emitter (fire-and-forget through BullMQ)
- Retention cron for `analytics_events`
- `@AuditLog()` decorator + impersonation enter/exit logging
- Platform admin alerts: new ticket opened, unusual usage spike

## Dependencies

- Phase 01 (tenants, admin_users, audit_logs)
- Phase 02 (roles — only `admin` may open a ticket)
- Phase 11 (conversations)
- Phase 12 (alerts to the platform admin)
- BullMQ

## See also
- [[chat-conversations]]
- [[alerts]]
- [[subscription-plans]]
