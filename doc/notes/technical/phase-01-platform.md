# Phase 01 — Platform Level

> Build this first. Everything else depends on `tenants` and `admin_users`.

## Tables

- `tenants` — one row per company
- `admin_users` — ChantierOS platform staff (separate from tenant users)
- `plans` + `plan_features` — admin-managed plan catalog
- `tenant_subscriptions` — tenant's current plan + pending changes
- `billing_usage_snapshots` — usage at renewal time, drives invoice amount
- `audit_logs` — every sensitive platform action logged here
- `analytics_events` — page views, feature usage per tenant
- `feedback` — tenants submit feature requests

## Key relations

```
tenants ──── tenant_subscriptions ──── plans ──── plan_features
        └─── billing_usage_snapshots
        └─── audit_logs
        └─── analytics_events
        └─── feedback

admin_users ──── audit_logs
```

## Key rules

- `tenants.status` = `active` / `suspended` / `banned`
- A suspended tenant can't log in — checked at auth
- `admin_users` are platform staff only — never mixed with tenant `users`
- Every sensitive action by an `admin_user` writes to `audit_logs`
- `plans` are immutable once in use — price/limit change = new row with `parent_plan_id`
- `billing_usage_snapshots` copies rates at snapshot time — history never shifts

## Billing table ownership

This phase owns the **plan catalog and the subscription record**: `plans`, `plan_features`, `tenant_subscriptions`, `billing_usage_snapshots`. Phase 13 owns only the Stripe integration (webhooks, `stripe_events`, `SubscriptionGuard`). There is **no `subscriptions` table** — `tenant_subscriptions` is the single subscription record per tenant.

## What to build

- `admin_users` CRUD (internal, no public endpoint)
- `tenants` CRUD — create, suspend, ban, reactivate
- `plans` + `plan_features` management (super-admin only)
- Billing usage snapshot job (runs at renewal)
- Audit log writer (used by other modules as a side effect)

## Dependencies

None — this is the foundation layer.

## See also
- [[subscription-plans]]
- [[roles-permissions]]
