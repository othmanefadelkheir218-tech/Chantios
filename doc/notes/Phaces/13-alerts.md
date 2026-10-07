# Step 13 — Alerts & Notifications  *(phase 12)*

> This step collects every `// TODO: step 13` marker left behind in steps 04 through 12.

## Goal

One notification table, one delivery path (WebSocket + email, always both), and every trigger wired up.

## Decide first

**None.** Fully specified.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 9.

| Table | Purpose |
|---|---|
| `notifications` | one row per alert sent to one recipient |

### Why `admin_user_id` exists on it

| Field | Notes |
|---|---|
| `tenant_id` | **nullable** — `NULL` for a platform alert |
| `user_id` | recipient when a company employee — nullable |
| `admin_user_id` | recipient when ChantierOS staff — nullable |

A check constraint enforces **exactly one** of `user_id` / `admin_user_id`.

Platform alerts — *"new tenant signed up"*, *"payment failed"*, *"support ticket opened"* — go to ChantierOS staff, who have no row in `users` and belong to no tenant. Same two-nullable-columns pattern as `refresh_tokens`.

### Delivery is always both

Every alert = **in-app notification (WebSocket) + email**, simultaneously. No SMS in v1; SMS, Telegram and WhatsApp are v2.

## Modules to create

```
src/notifications/
├── decorators/notifications.swagger.ts
├── dto/find-notifications-query.dto.ts
├── entities/notification.entity.ts
├── gateways/notifications.gateway.ts     ← one Socket.io room per user
├── handlers/find-notifications.handler.ts, mark-read.handler.ts,
│            mark-all-read.handler.ts, unread-count.handler.ts,
│            dispatch-notification.handler.ts
├── helpers/notification-recipients.helper.ts   ← who gets this type? one place
│           notification-templates.helper.ts    ← subject + body per type, per locale
├── processors/notification.processor.ts        ← BullMQ worker: socket + email
├── repositories/notification.repository.ts
└── notifications.service.ts / .controller.ts / .module.ts

src/crons/
├── late-invoices.cron.ts          step 06 — alert only, writes no status
├── purchase-due.cron.ts           step 07
├── missing-report.cron.ts         step 09 — in_progress, no report for 3 days
├── progress-stalled.cron.ts       step 09 — progress_pct unchanged 7 days
├── missing-timesheet.cron.ts      step 08 — task in_progress today, no hours
├── stalled-project.cron.ts        step 08 — in_progress, no hours for N days
├── end-of-day-reminder.cron.ts    per tenant time + timezone
├── portal-expiry.cron.ts          step 12
├── token-cleanup.cron.ts          step 02 — expired tokens older than 30 days
└── crons.module.ts
```

`dispatch-notification.handler` is the **single entry point**. Every module calls `notificationsService.dispatch(type, context)` — no module writes a `notifications` row itself or sends its own email. That is the single-source-of-truth rule applied to delivery.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/notifications` | `AuthGuard` | own only, `?is_read=` |
| `GET` | `/api/notifications/unread-count` | `AuthGuard` | the bell badge |
| `PATCH` | `/api/notifications/:id/read` | `AuthGuard` | own only |
| `PATCH` | `/api/notifications/read-all` | `AuthGuard` | |
| `GET` | `/api/admin/notifications` | `AdminAuthGuard` | platform staff |
| `PATCH` | `/api/admin/notifications/:id/read` | `AdminAuthGuard` | |

### WebSocket

| Event | Direction | Payload |
|---|---|---|
| `notification` | server → user room | the notification row |

One room per `user_id`, one per `admin_user_id`. Redis adapter, so it survives more than one API instance.

## The alert catalogue

Delivery to **tenant admin + manager** unless noted. Manager excludes billing alerts.

| `type` | Trigger | Fired from |
|---|---|---|
| `low_stock` | `on_hand <= minimum_stock` | step 05, after any movement |
| `reservation_unmet` | `available < 0` | step 05, soft, clears on purchase |
| `margin_warning` | cost reaches 80% of budget | step 10, **once** per project |
| `margin_critical` | cost reaches 95% of budget | step 10, **once** per project |
| `invoice_late` | `due_date < today AND balance_due > 0` | cron, writes no status |
| `invoice_paid` | a payment completes an invoice | step 06 |
| `purchase_due` | a purchase bill due date approaches | cron |
| `abnormal_hours` | same-day total over 12h, all projects | step 08 |
| `missing_timesheet` | task `in_progress` today, no hours | cron |
| `stalled_project` | `in_progress`, no hours for N days | cron |
| `missing_report` | `in_progress`, no report for 3 days | cron |
| `progress_stalled` | `progress_pct` unchanged 7 days | cron |
| `project_cancelled` | project → `cancelled` | step 04 — *"remember to invoice work done"* |
| `new_message` | any message in a conversation you are in | step 11 |
| `task_assigned` | assigned to a task | step 08 → the worker |
| `task_starting` | task `start_date` is tomorrow | cron → the worker |
| `end_of_day_reminder` | no hours logged today | cron → the worker |

### Platform alerts — `admin_user_id`, `tenant_id = NULL`

| `type` | Trigger |
|---|---|
| `tenant_signed_up` | a company completes registration |
| `payment_received` | a tenant subscription payment succeeds |
| `payment_failed` | a tenant payment fails |
| `tenant_status_changed` | suspended / banned / reactivated |
| `support_ticket_opened` | a tenant opens a ticket |
| `usage_spike` | storage over a threshold |

### Client alerts — email only, no row

The client has no account, so nothing is written to `notifications`.

| Trigger | Email |
|---|---|
| Quote sent | "please review" + portal link |
| Invoice sent | "please pay" |
| Invoice late | reminder |
| New portal message | "you have a reply" |

Language comes from the **tenant's** `locale` — `clients` has no `locale` column (the decision from step 02).

## Dedup — the margin rule

Margin is recomputed after every time entry, consumption and purchase invoice. Without a guard, a project at 81% emails on **every save**.

`project_margin_alerts` (step 10) holds one row per `(project_id, level)`. Check before sending; if the row exists, send nothing. If an extra accepted quote raises the budget and cost drops back under the threshold, **delete the rows** so the levels can fire again.

This is the only alert with dedup state. The others are either one-shot events or daily crons that naturally fire once a day.

## End-of-day reminder — the timezone detail

`tenants.end_of_day_reminder_time` (default `18:00`) and `tenants.timezone` (default `Europe/Brussels`) are per tenant. A single daily cron at a fixed UTC hour would fire at the wrong local time.

Run the cron **hourly**, and for each tenant send only if the local time now matches its configured hour.

## Repository methods

```ts
create(data, tx), createMany(rows, tx)
findManyForUser(userId, where, skip, take)
findManyForAdmin(adminUserId, where, skip, take)
markRead(id), markAllRead(recipient), countUnread(recipient)
deleteReadOlderThan(date)        // retention_days — only READ notifications
```

`retention_days` deletes **only** `analytics_events` and **read** `notifications`. It never deletes a project, quote, invoice, hour or photo.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `dispatch-notification.handler` | the single entry point. Resolves recipients from `notification-recipients.helper`, writes the rows, queues one BullMQ job per recipient |
| `notification.processor` | the BullMQ worker: emits the socket event, then sends the email through Resend. A failed email **must not** lose the in-app notification |
| `mark-read.handler` | own rows only. A user can never mark someone else's read |

Recipient resolution lives in **one** helper. A module must never hard-code "send to admin and manager" — role changes and `role_permissions` overrides have to be respected in one place.

## Tasks

- [x] `notifications` module, full shape
- [x] Socket.io gateway, one room per user and per admin user, Redis adapter
- [x] `notification-recipients.helper.ts` — type → recipients, one implementation
- [x] `notification-templates.helper.ts` — subject + body per type, per locale
- [x] BullMQ queue + processor: socket first, then email
- [x] `dispatch()` on the service; **no module writes a notification row directly**
- [x] `crons` module — 6 new crons here (purchase-due, stalled-project, task-starting, end-of-day, missing-timesheet, retention); the other 5 already ran in their own modules (late invoices, missing report + progress stalled, portal expiry, token cleanup, media purge) and were kept, not duplicated
- [x] End-of-day cron runs hourly and respects each tenant's timezone
- [x] Wire every `// TODO: step 13` marker from steps 04–12 — grep for it
- [x] Margin dedup check before sending, and the reset that deletes the rows
- [x] Client emails (quote sent, invoice sent, late, new message) in the tenant's locale
- [x] Retention cron: read notifications + `analytics_events` only
- [x] `grep -rn "TODO: step 13" src/` returns nothing

## Acceptance

- [x] Consume stock below `minimum_stock` → `low_stock` row **and** email
- [x] Cost crosses 80% → one `margin_warning`. Save again at 83% → **nothing new**
- [x] Cost crosses 95% → one `margin_critical`
- [x] An extra quote drops cost under 80% → the dedup rows are deleted
- [x] Log 13h in one day across two projects → `abnormal_hours` to the manager
- [x] An invoice past `due_date` with a balance → `invoice_late` fires, **no row's status changed**
- [x] A new company registers → a notification with `admin_user_id` set and `tenant_id` `NULL`
- [x] Try to insert a notification with **both** `user_id` and `admin_user_id` → rejected
- [x] Try with **neither** → rejected
- [x] A user marking another user's notification read → 403
- [x] Two tenants with different `end_of_day_reminder_time` → each fires at its own local hour
- [x] A tenant in a different timezone → fires at its local 18:00, not UTC 18:00
- [x] Break the email provider → the in-app notification still arrives
- [x] Retention cron → read notifications deleted, **projects and invoices untouched**
- [x] A client gets the quote-sent email in the tenant's locale
- [x] Tenant A never receives a notification about tenant B
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [alerts.md](../alerts.md) — the full catalogue per role, thresholds, the reminder time
- [margin-profitability.md](../margin-profitability.md) — the dedup rule
- [technical/phase-12-alerts.md](../technical/phase-12-alerts.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 9
