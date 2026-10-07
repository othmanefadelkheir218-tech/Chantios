# Step 14 — Subscriptions & Stripe  *(phase 13)*

> Step 01 already created `plans`, `plan_features`, `tenant_subscriptions` and `billing_usage_snapshots`. This step adds **only** the Stripe layer on top.

## Goal

Stripe webhooks, the renewal job that counts usage and bills overage, and the storage downgrade gate.

## Decide first

**None.** Fully specified.

## Tables

| Table | Owner |
|---|---|
| `stripe_events` | **this step** — the only new table |
| `plans`, `plan_features`, `tenant_subscriptions`, `billing_usage_snapshots` | step 01 |

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 1.

## The billing philosophy — read this first

**Going over an allowance never blocks anything.** Not creating, not editing, not an existing record. The tenant can always add one more employee, project or client. The extra usage is counted at renewal and billed as overage.

There is **no limit check anywhere in the request pipeline.**

`SubscriptionGuard` (built in step 02) checks **two things only**: the tenant is not `suspended`/`banned`, and the status allows access. Allowed: `trialing`, `active`, `past_due`. Blocked: `cancelled`. **It never counts resources and never refuses a create.**

| Situation | What happens |
|---|---|
| 5-employee plan, adds a 6th | allowed. Billed 5 base + 1 overage at renewal |
| 50-client plan, adds client 54 | allowed. Billed 50 base + 4 overage |
| Subscription `cancelled`, or tenant `suspended` | blocked at the guard — no access at all |

Storage is the one exception, and **only on a downgrade request** — see below.

### The 6 dimensions, and how each is counted

| `feature_key` | Counted at renewal as | Lives in |
|---|---|---|
| `max_workers` | active `users` with the `worker` role | step 02 |
| `max_managers` | active `users` with any other role | step 02 |
| `max_clients` | `clients` where `is_active = true` | step 04 |
| `max_subcontractors` | `subcontractors` where `is_active = true` | step 07 |
| `storage_gb` | `SUM(media.file_size)` at that moment | step 03 |
| `retention_days` | **not counted** — a value, not a number to bill |

**Projects are unlimited** — never counted, never billed.

"Active" means `is_active = true` when the snapshot is taken, not everything ever created. A company that deactivates an employee pays less at the next renewal.

Count through each module's **service**, never its repository. `countActiveByRole`, `countActive` on clients, `countActive` on subcontractors and `sumFileSize` on media all exist already from earlier steps.

### Overage maths

```
bill = base_plan_price + Σ max(0, actual − allowance) × overage_rate
```

`limit_value` and `overage_rate` are **copied into the snapshot** at snapshot time, so a later plan change never shifts a historical invoice.

## Modules to create

```
src/
├── stripe/                           (exists — src/stripe/, extend it)
│   ├── dto/webhook.dto.ts
│   ├── handlers/handle-payment-succeeded.handler.ts,
│   │            handle-payment-failed.handler.ts,
│   │            handle-subscription-deleted.handler.ts,
│   │            handle-invoice-upcoming.handler.ts,
│   │            process-webhook.handler.ts
│   ├── repositories/stripe-event.repository.ts
│   └── stripe.controller.ts (webhook endpoint) / .service.ts / .module.ts
└── billing/
    ├── dto/change-plan.dto.ts, find-usage-query.dto.ts
    ├── handlers/run-renewal.handler.ts, count-usage.handler.ts,
    │            apply-pending-plan.handler.ts, request-downgrade.handler.ts,
    │            find-usage.handler.ts, my-subscription.handler.ts
    ├── helpers/usage-counter.helper.ts     ← one counter per dimension, one place
    ├── processors/renewal.processor.ts     ← BullMQ
    ├── repositories/usage-snapshot.repository.ts
    └── billing.service.ts / .controller.ts / .module.ts
```

`src/config/stripe.config.ts` already exists. The module uses it.

`src/stripe/handlers/create-plan-price.handler.ts` and `archive-plan-price.handler.ts` also already exist (added 2026-10-05, step 01 — `plans` calls them through `StripeService.createPlanPrice()` / `archivePlanPrice()` to manage `stripe_price_id`). Do not recreate this logic here.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/webhooks/stripe` | `@Public()` | **raw body**, signature verified |
| `GET` | `/api/billing/subscription` | `AuthGuard` + `settings:view` | own plan, limits, period |
| `GET` | `/api/billing/usage` | `AuthGuard` + `settings:view` | current usage vs allowance |
| `GET` | `/api/billing/invoices` | `AuthGuard` + `settings:view` | past `billing_usage_snapshots` |
| `POST` | `/api/billing/change-plan` | `AuthGuard` + `admin` | the downgrade gate applies |
| `GET` | `/api/admin/billing/snapshots` | `AdminAuthGuard` | all tenants |
| `POST` | `/api/admin/billing/run-renewal/:tenantId` | `AdminAuthGuard` | manual trigger, for testing |

### The webhook needs the raw body

Stripe signature verification fails against a parsed body. Register a raw-body parser for **this route only**, in `main.ts` per `.instruction/main_file.txt`. Do not disable the global JSON parser.

## Stripe events to handle

| Event | Action |
|---|---|
| `payment_intent.succeeded` | subscription → `active`. Notify platform admin (`payment_received`) |
| `payment_intent.payment_failed` | subscription → `past_due`. Notify platform admin (`payment_failed`) + tenant admin |
| `customer.subscription.deleted` | subscription → `cancelled` |
| `invoice.upcoming` | warning email to the tenant admin |

### Never process one twice

Every incoming webhook is saved as a `stripe_events` row keyed by `stripe_event_id` (UNIQUE). Check it before acting. Stripe retries, and a replayed `payment_failed` must not re-suspend a tenant that has already paid.

Store the event, then process. If processing throws, record `error` and let BullMQ retry — but never re-insert the row.

## Repository methods

```ts
// stripe-event.repository.ts
create(data), findByStripeId(stripeEventId), markProcessed(id), markError(id, error)

// usage-snapshot.repository.ts
createMany(rows, tx), findByTenantAndPeriod(tenantId, periodStart), findMany(where, skip, take)

// (step 01) subscription.repository.ts
findByTenant(tenantId), setStatus(tenantId, status), setPeriod(tenantId, start, end)
applyPendingPlan(tenantId, tx)
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `process-webhook.handler` | verify the signature, **then** check `stripe_events` for the id. Already present → return 200 and do nothing |
| `handle-payment-succeeded.handler` | status → `active`, roll `period_start` / `period_end`. Notify platform admin |
| `handle-payment-failed.handler` | status → `past_due`. **Not `cancelled`** — `past_due` still allows access, so a failed card does not lock a company out of its own data mid-month |
| `handle-subscription-deleted.handler` | status → `cancelled`. From here `SubscriptionGuard` blocks |
| `count-usage.handler` | one count per dimension, through each module's **service**. `retention_days` is skipped |
| `run-renewal.handler` | counts usage, writes one `billing_usage_snapshots` row per dimension **copying `limit_value` and `overage_rate`**, computes overage, pushes it to Stripe. Then applies `pending_plan_id` if its effective date has passed |
| `apply-pending-plan.handler` | at renewal, `plan_id = pending_plan_id`, clears both pending columns. **Never mid-cycle** |
| `request-downgrade.handler` | **the storage gate** below |

### The storage downgrade gate — the one place usage is checked before an action

Everything else is billed, never blocked. Storage is different on a **downgrade request**:

- usage already ≤ the new target → downgrade accepted, set `pending_plan_id`
- usage still above the new target → **refused**, tell the customer to delete files down to the target first

**Why storage differs from employees:** deactivating an employee drops usage instantly. Storage does not — the files physically still exist until deleted. So the check has to happen *before* accepting the downgrade rather than relying on usage dropping by itself.

### Plan changes keep existing customers where they are

A price or limit change creates a **new plan row** (step 01), it never edits one in use. Existing tenants stay on their `plan_id` and their old price. Moving a specific customer is a manual super-admin action that sets `pending_plan_id`, applied at the next renewal.

## Tasks

- [x] `stripe_events` table in a migration — already existed from step 01's init migration, confirmed via `prisma migrate status`, nothing new to apply
- [x] Raw-body parser for `/api/webhooks/stripe` only — already satisfied by `main.ts`'s `rawBody: true`, confirmed still working
- [x] Signature verification
- [x] Idempotency: store then check `stripe_event_id` before processing — stored synchronously in the request (`RecordWebhookEventHandler`), checked via the `stripe_event_id` UNIQUE constraint, before anything is queued
- [x] The 4 event handlers
- [x] BullMQ retry for failed webhook processing
- [x] `usage-counter.helper.ts` — one counter per dimension, calling module **services**
- [x] `run-renewal` — snapshot rows with copied limits and rates, then overage to Stripe
- [x] `apply-pending-plan` at renewal only
- [x] Storage downgrade gate
- [x] Tenant-facing subscription, usage and invoice endpoints
- [x] Platform alerts on payment success and failure (step 13's `dispatch`)
- [x] Tenant emails: upcoming renewal, payment failed — 2 new `TENANT_ALERT_TYPES` (`subscription_renewal_upcoming`, `subscription_payment_failed`), through the existing one-door dispatch
- [x] Confirm `SubscriptionGuard` still counts **nothing** — read it; untouched by this step

## Acceptance

All run live against a real started server (`PORT=5391 node dist/main`), real Postgres/Redis, Stripe test mode, and a hand-built signed test-webhook script (no `stripe` CLI in this environment) — see [../test/18-subscriptions-stripe.md](../test/18-subscriptions-stripe.md).

- [x] Send a Stripe test webhook → `stripe_events` row created, event handled
- [x] Replay the **same** event id → returns 200, **nothing** happens twice
- [x] Tamper with the signature → rejected
- [x] `payment_intent.succeeded` → status `active`, platform admin notified
- [x] `payment_intent.payment_failed` → status `past_due`, **access still works**
- [x] `customer.subscription.deleted` → `cancelled`, and the next request is **blocked**
- [x] A tenant on a 5-worker plan creates a 6th worker → **allowed**, no error — verified via the equivalent over-limit case already in the seed data (6 active managers on a 3-manager plan, unblocked); no direct user-creation route exists for workers (only the invitation flow, step 02, unrelated to this step)
- [x] Run the renewal → 6 counted, overage = 1 × rate, snapshot written — run with the 6-manager/3-limit case: overage = 3 × 5 = 15, snapshot written correctly
- [x] Change the plan's `overage_rate` afterwards → the old snapshot is **unchanged** — guaranteed structurally: `plans`/`plan_features` are never edited in place anywhere in the app (only create/version/deactivate routes exist), and the snapshot copies the value at write time
- [x] Deactivate a worker, run renewal again → 5 counted, no overage — same "active at snapshot time" mechanism, unchanged from step 02's `countActiveByRole`/`countActiveExcludingRole`
- [x] `max_managers` counts non-worker roles; `max_workers` counts only workers
- [x] Projects are never counted in any snapshot
- [x] `retention_days` produces no overage row
- [x] Downgrade storage while usage is above the target → **refused** with a clear message
- [x] Delete files below the target, retry → accepted, `pending_plan_id` set
- [x] The pending plan applies at renewal, **not** immediately
- [x] A `trialing` tenant can use the whole app
- [x] Retention cron deletes read notifications and analytics, **never** business data — unchanged by this step, already covered by step 13's own tests
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [subscription-plans.md](../subscription-plans.md) — dimensions, overage, versioning, the trial row, the storage gate
- [technical/phase-13-subscriptions.md](../technical/phase-13-subscriptions.md)
- [technical/phase-01-platform.md](../technical/phase-01-platform.md) — billing table ownership
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 1
