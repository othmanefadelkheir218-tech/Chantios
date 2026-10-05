# Phase 12 — Alerts & Notifications

> Depends on almost all phases — wires up the alert triggers.

## Tables

- `notifications` — one row per alert sent to a user

## Key rules

### Delivery: always dual
- Every alert = WebSocket push + email simultaneously
- No SMS in v1

### Dedup — margin alerts fire once per level
Margin is recomputed after every time entry, consumption and purchase invoice. Without a guard, a project at 81% emails on every save.

`project_margin_alerts` (Phase 08) holds one row per `(project_id, level)`. Check it before sending; if the row exists, send nothing. If an extra accepted quote raises the budget and the cost drops back under the threshold, delete the rows so the levels can fire again.

### Notification fields

| Field | Notes |
|---|---|
| `tenant_id` | Scope — **nullable**, `NULL` for a platform alert |
| `user_id` | Recipient, when it is a company employee — nullable |
| `admin_user_id` | Recipient, when it is ChantierOS platform staff — nullable |
| `type` | e.g. `low_stock`, `late_invoice`, `margin_warning` |
| `payload` | JSON with context (project name, amounts, etc.) |
| `is_read` | Boolean — `is_` prefix, per [[naming-conventions]] |
| `created_at` | |

A check constraint enforces that **exactly one** of `user_id` / `admin_user_id` is set.

**Why `admin_user_id` is needed:** the platform alerts in [[alerts]] — "new tenant signed up", "payment failed", "support ticket opened" — go to ChantierOS staff. A platform admin has no row in `users` and belongs to no tenant, so `user_id` + `tenant_id` alone cannot address them. This is the same two-nullable-columns pattern already used by `refresh_tokens` and `one_time_codes`.

### Alert types by role

**Platform Admin:**
- New payment received
- Payment failed (Stripe)

**Tenant Admin + Manager:**
- Invoice late (`due_date < today AND balance_due > 0` — calculated, never a stored status)
- Invoice payment received
- Low stock (`material_stock_live.on_hand ≤ materials.minimum_stock`)
- Stock reservation not covered (soft alert)
- Margin warning (costs at 80% of budget) — **once** per project, see dedup below
- Margin critical (costs at 95% of budget) — **once** per project
- Abnormal hours (an employee's same-day total across all projects over 12h)
- Missing site report (project `in_progress`, no report for 3 days)
- Progress stalled (`progress_pct` unchanged for 7 days)
- Purchase bill due soon
- Project cancelled — reminder to invoice
- End-of-day time entry reminder (configurable time, default 18:00)
- New message in any conversation

**Employee (worker):**
- End-of-day time entry reminder

**Client (via portal):**
- Invoice sent
- Message received (project_client chat)

## What to build

- `notifications` table + CRUD
- WebSocket emitter (Socket.io room per user)
- Email sender integration (Resend)
- Trigger hooks (called from other modules):
  - After `purchase_invoices` saved → check margin
  - After `stock_movements` saved → check low stock + reservation coverage
  - After `time_entries` saved → check margin
  - Daily cron → find late invoices and alert (writes no status)
  - Daily cron → end-of-day reminder (time from tenant config)
  - After payment recorded → send receipt notification
- Mark as read endpoint

## Dependencies

- All phases (triggers come from everywhere)
- Socket.io (Phase 01 setup)
- Resend (Phase 02 setup)
- BullMQ (for delayed/scheduled jobs)

## See also
- [[alerts]]
- [[margin-profitability]]
- [[client-invoices]]
