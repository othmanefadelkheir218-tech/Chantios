# Tests — Subscriptions & Stripe

> Routes: `/api/billing/...`, `/api/admin/billing/...`, `/api/webhooks/stripe`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [subscription-plans.md](../subscription-plans.md), the step file [Phaces/14-subscriptions.md](../Phaces/14-subscriptions.md).

## Before you start

- **The philosophy**: every dimension except storage is billed, never blocked — the tenant can always add one more employee/client, the overage is counted and billed at the next renewal. Storage is the one exception, gated on a **downgrade request only**.
- **Stripe test mode**: `.env`'s `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` must be test-mode keys. Send a signed test event with Stripe's own `stripe.webhooks.generateTestHeaderString({ payload, secret })` (see the Node snippet in § 3) — there is no `stripe` CLI in this environment.
- **Log in first.** Tenant: `POST /api/auth/login` (`admin@dupont.test` / `Demo@12345678`). Platform admin: `POST /api/admin/auth/login`.
- Every record you create should start with `TEST`.

---

## 1. Tenant-facing routes

### SUB-01 — My subscription, usage, invoices
`GET /api/billing/subscription` → the tenant's plan, limits, period. `GET /api/billing/usage` → one row per billed dimension (`max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb` — never `retention_days`) with `actual`/`limit`/`overage_rate`/`overage_amount`, computed live (not from a snapshot). `GET /api/billing/invoices` → past `billing_usage_snapshots` for the caller's own tenant only, paginated.

### SUB-02 — `past_due` still has full access
Flip a tenant's `tenant_subscriptions.status` to `past_due` (via a `payment_intent.payment_failed` webhook, § 3, or directly in the DB). Every tenant route — including `GET /api/billing/subscription` — still answers normally. Only `cancelled` blocks (`SubscriptionGuard`, unchanged by this step — confirmed it counts nothing).

## 2. The storage downgrade gate — the one place usage is checked before an action

### SUB-03 — Refused while usage is above target
Create a plan whose `storage_gb` limit is smaller than the tenant's actual usage (`POST /api/admin/plans`). `POST /api/billing/change-plan {"plan_id": <that plan>}` → `400`, a message naming both numbers, `pending_plan_id` untouched. A target plan with an EQUAL OR LARGER storage limit skips the check entirely (no usage read at all) and sets `pending_plan_id` immediately.

### SUB-04 — Accepted once usage drops, applied only at renewal
Lower the tenant's media usage below the target, retry the same call → `200`, `pending_plan_id` set, `pending_plan_effective_at` = the CURRENT `period_end` — `plan_id` itself is untouched. `POST /api/admin/billing/run-renewal/:tenantId` (before the effective date) leaves `plan_id` alone; run it again once the new period has started (the effective date has now passed, since it equals the old `period_end`) → `plan_id` becomes the pending plan, both pending columns clear.

## 3. Stripe webhooks

A minimal Node snippet to send a correctly-signed test event (no `stripe` CLI available here):

```js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const payload = JSON.stringify({ id: 'evt_test_x', object: 'event', type: 'payment_intent.succeeded', data: { object: { id: 'pi_1', customer: 'cus_x', amount: 5400, amount_received: 5400 } } });
const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
// POST payload to /api/webhooks/stripe with header `stripe-signature: <signature>`
```

Give the target `tenant_subscriptions` row a `stripe_customer_id` first (no route for it yet — set it directly in the DB for testing, e.g. `cus_test_step14`).

### SUB-05 — Signature check
A tampered body or a signature built with the wrong secret → `400`, nothing stored, nothing processed. A missing `stripe-signature` header or missing raw body → `400`.

### SUB-06 — `payment_intent.succeeded`
→ `stripe_events` row created and marked `processed_at` (not twice — replay the exact same `id` → `200`, still exactly one row, nothing re-processed). Subscription → `active`, `period_start`/`period_end` roll forward one month. One `payment_received` platform alert per platform admin (`tenant_id` NULL, `admin_user_id` set).

### SUB-07 — `payment_intent.payment_failed`
Subscription → `past_due` (never `cancelled`). Platform admins get `payment_failed`; the tenant's own admin/manager get a NEW tenant alert type (`subscription_payment_failed`) through the normal one-door dispatch (row + socket + email).

### SUB-08 — `customer.subscription.deleted`
Subscription → `cancelled`. The next request from that tenant is blocked (`403 No active subscription` — `SubscriptionGuard`).

### SUB-09 — `invoice.upcoming`
Tenant's own admin/manager get a warning alert (`subscription_renewal_upcoming`), no platform-admin notification.

### SUB-10 — Idempotency under a real crash-and-retry shape
The event is stored (`stripe_events` row, durable) BEFORE the response is sent and before anything is queued — the only thing that is best-effort is the BullMQ enqueue step itself, so a Redis hiccup after a successful DB write never loses the event silently (it is simply not dispatched yet; it has a row with `processed_at` and `error` both NULL, findable for a manual replay).

## 4. The renewal job

### SUB-11 — Usage counted, snapshot written, overage billed, period rolled
`POST /api/admin/billing/run-renewal/:tenantId` (manual trigger, direct call + await — not fire-and-forget, for testing). Returns `{ usage, total_overage }`. One `billing_usage_snapshots` row per billed dimension (never `retention_days`), each copying `limit_value`/`overage_rate` from `plan_features` **at that moment** — changing the plan's `overage_rate` afterwards never changes an existing snapshot. `overage_amount = max(0, actual - allowance) × overage_rate`, reusing `computeOverageAmount` (the same helper the admin `/api/admin/subscriptions` usage route already used — one implementation). `period_start`/`period_end` roll forward exactly one month.

### SUB-12 — Projects never counted, `retention_days` never billed
No projects dimension exists anywhere in the usage map or the snapshot. `retention_days` produces no snapshot row at all.

### SUB-13 — The Stripe push is best-effort
With a `stripe_customer_id` that doesn't exist in Stripe (or none at all), the renewal still completes — snapshot written, period rolled, pending plan applied if due — only the Stripe invoice-item push logs an error. Overage > 0 only: with zero overage, nothing is pushed to Stripe at all.

### SUB-14 — Deactivating an employee lowers the next bill
6 active managers on a 3-manager plan → overage billed for 3. Deactivate one, run renewal again → overage billed for 2. "Active" is read at snapshot time, not from history.

## Known limits, not fixed

- `run-renewal.handler.ts` is not wrapped in a single DB transaction across snapshot-write → Stripe push → period-roll → pending-plan-apply. A BullMQ retry after the period already rolled forward is not airtight against every interleaving (flagged by the team, not engineered around this pass).
- The Stripe invoice-item push happens one combined line per renewal (summed across all 5 dimensions), not one line per dimension.
