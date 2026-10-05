# Phase 13 — Subscriptions & Billing

> Depends on Phase 01, which already created `plans`, `plan_features`, `tenant_subscriptions` and `billing_usage_snapshots`. This phase adds only the Stripe layer on top.

## Tables

- `stripe_events` — log of all Stripe webhooks received (the only new table in this phase)

## Key relations

```
tenants ──── tenant_subscriptions ──── plans ──── plan_features
        └─── billing_usage_snapshots
        └─── stripe_events
```

## Key rules

### One subscription record per tenant
- `tenant_subscriptions` is the single subscription record — there is no `subscriptions` table
- It points at the exact `plans` row (plan version) the tenant is locked to
- Plans are **admin-created, never seeded**. There are no built-in tiers like Free/Pro/Enterprise — the super-admin creates every plan as data

### Guard: SubscriptionGuard
- Runs after `AuthGuard` + `TenantGuard`
- Checks **two things only**: the tenant is not `suspended`/`banned`, and the subscription status allows access
- Allowed statuses: `trialing`, `active`, `past_due`. Blocked: `cancelled`
- It does **not** count resources and does **not** check plan limits. Going over an allowance never blocks a create — the extra usage is billed as overage at renewal (see [[subscription-plans]])

### A new tenant always has a subscription row
Registration creates the `tenant_subscriptions` row **in the same transaction as the tenant**: the `is_default` plan, `status = 'trialing'`, `period_end = now() + 14 days`. Without it the guard would find nothing to check and a brand-new company would be locked out of its own app.

Since plans are never seeded, the super-admin must create one plan with `is_default = true` before signups work.

### The dimensions, and how each is counted
| `feature_key` | Counted at renewal as |
|---|---|
| `max_workers` | Active `users` with the `worker` role |
| `max_managers` | Active `users` with any other role |
| `max_clients` | `clients` where `is_active = true` |
| `max_subcontractors` | `subcontractors` where `is_active = true` |
| `storage_gb` | `SUM(media.file_size)` at that moment |
| `retention_days` | Not counted — a value, no overage |

**Projects are unlimited** — never counted, never billed.

"Active" means `is_active = true` when the snapshot is taken, not everything ever created. Deactivating an employee lowers the next bill.

`retention_days` deletes **only** `analytics_events` and read `notifications`. It never deletes a project, quote, invoice, hour or photo.

### Usage & overage
- At renewal, a job counts actual usage per dimension and writes one `billing_usage_snapshots` row per dimension
- `bill = base plan price + Σ max(0, actual − allowance) × overage_rate`
- Limits and rates are **copied into the snapshot** so past invoices never shift

### Storage downgrade gate
- The only place usage is checked **before** an action
- Downgrade to a smaller storage allowance is refused while actual usage is still above the new target

### Stripe webhook events to handle

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark subscription paid → notify platform admin |
| `payment_intent.payment_failed` | Mark subscription past_due → notify platform admin |
| `customer.subscription.deleted` | Mark subscription cancelled |
| `invoice.upcoming` | Warning email to tenant admin |

### Stripe events log
- Every incoming webhook saved as a row in `stripe_events`
- Never re-process a webhook with the same `stripe_event_id`

## What to build

- `SubscriptionGuard` NestJS guard (status check only — no limit counting)
- Renewal job: count usage per dimension → write `billing_usage_snapshots` → push overage to Stripe
- Storage downgrade gate (refuse while usage > new target)
- Stripe webhook endpoint + signature verification
- Event handlers for the 4 events above
- Alert on payment success + failure (to platform admin)
- Tenant admin email: upcoming renewal + payment failure

## Dependencies

- Phase 01 (tenants)
- Phase 02 (auth — platform admin receives alerts)
- Stripe SDK
- BullMQ (retry failed webhook processing)

## See also
- [[subscription-plans]]
- [[alerts]]
