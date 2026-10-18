# ChantierOS — Subscription Plans (admin-configurable)

> Planning mode. Nothing here is locked — this is the working draft as agreed so far.

## The core idea

- **Fixed**: the *list of things that can be limited* (the dimensions below). Developers define these once.
- **Configurable by the super-admin, at any time**: how many plans exist, each plan's name, its price, and its value on every dimension.

A plan is a **row of data the admin manages**, not a hardcoded tier. The admin can create a new plan, edit an existing one's price/limits, or remove a plan — and once removed, new customers can no longer pick it (existing customers on it are a separate decision, see open point below).

Example: admin creates "Plan X," sells it to Customer A. Later removes "Plan X." Customer B can never see or pick it. Customer A keeps it unless the admin decides otherwise.

## The dimensions (v1)

These are the only things a plan can put a number on. Developers define this list once; the super-admin sets the values per plan.

**Projects are unlimited.** A tenant creates as many as they want — never counted, never billed.

| `feature_key` | What it counts | Counted at renewal as |
|---|---|---|
| `max_workers` | Mobile-only employees | Active `users` with the `worker` role |
| `max_managers` | Dashboard employees | Active `users` with any other role |
| `max_clients` | Client cards | `clients` where `is_active = true` |
| `max_subcontractors` | Subcontractor cards | `subcontractors` where `is_active = true` |
| `storage_gb` | Documents and photos | `SUM(media.file_size)` at that moment |
| `retention_days` | How long history is kept | Not counted — a value, not a number to bill |

The counting rule matters as much as the number. "Active" means `is_active = true` at the moment the snapshot is taken — not everything ever created. A company that deactivates an employee pays less at the next renewal.

### Retention never touches business data

`retention_days` deletes **only** `analytics_events` and read `notifications`. It never deletes a project, a quote, an invoice, an hour or a photo. Business data is kept forever, whatever the plan.

AI is not part of v1 at all — no tokens, no AI dimension.

> **v2 — Client connection channels**: Email first. Telegram/WhatsApp as future additions. Not in v1.

## Extra monetization ideas on top of the plan list

- **À la carte add-ons**: let a tenant buy more of one dimension (extra projects, extra seats, extra storage) without jumping to a whole new plan — same pattern as the AI token recharge packs already planned.
- **Annual billing discount**: e.g. 2 months free for yearly payment — improves cash flow, separate from the plan/feature model itself.

## What this means for the data model

Move away from a fixed 3-value plan enum. Instead:

- A `plans` **table**: one row per plan version (admin-created), holding its name, price and active/inactive status. Its value on each dimension lives in `plan_features`, one row per dimension.
- A `tenant_subscriptions` **table**: one row per tenant, pointing at the exact plan version they are locked to. **This is the only subscription table** — there is no separate `subscriptions` table.
- **Active/inactive, not hard delete**: removing a plan should deactivate it (stop new signups from picking it) rather than deleting the row outright — existing subscribers still reference it.
- **Price changes**: since Stripe prices are immutable, changing a plan's price means creating a new Stripe Price and pointing new signups to it (see the open decision below for existing customers).

## Decided — what a brand-new company gets

A `tenant_subscriptions` row is created **in the same transaction as the tenant**, at registration:

| Column | Value at signup |
|---|---|
| `plan_id` | The plan where `is_default = true` |
| `status` | `trialing` |
| `period_start` | `now()` |
| `period_end` | `now() + 14 days` |

`SubscriptionGuard` allows `trialing`, `active` and `past_due`. It blocks `cancelled`, and any tenant whose own status is `suspended` or `banned`.

Without this row a company that just registered would be locked out of its own app, because the guard would find no subscription to check. Pointing `plan_id` at a real plan from minute one also means billing at the end of the trial needs no special case — the renewal job counts usage the same way it always does.

**A company created by the super-admin gets the same start.** `POST /api/admin/tenants` creates, in one transaction: the `tenants` row, the trial `tenant_subscriptions` row above, and an **invitation** for the company's first `admin` user (`owner_name` + `owner_email` in the request). The boss sets their own password through the normal invitation link. The super-admin never chooses a password for anyone.

**Operational rule:** plans are never seeded, so the super-admin must create at least one plan and set `is_default = true` **before the app can accept signups**. Registration fails without a default plan, and that is correct — it is a setup error, not a user error.

## Decided — the end of the trial (grace period, then block)

Decided 2026-10-10. A trial ends; it never runs forever. **The same 7-day grace, then block, applies to a failed payment** (§ A failed payment, below).

| Day (from signup) | What happens |
|---|---|
| **11** (`period_end` − 3 days, still `trialing`) | Reminder `trial_ending` — in-app + email, sent once: "your trial ends in 3 days, add a payment method" |
| **14** (the trial's `period_end`) | The first renewal of a `trialing` subscription ends the trial: usage is counted as usual, the period rolls forward, then `status = past_due` and `grace_ends_at = old period_end + 7 days`. Alert `trial_ended`. The app still works; every page shows a banner "your trial has ended — X days left to add a payment method" |
| **21** (`grace_ends_at`) | Still `past_due` and no payment → `status = cancelled`, `grace_ends_at` cleared. Alert `subscription_blocked` (email). The company is blocked |
| **Payment** (step 3, Stripe Checkout) | `status = active`, `grace_ends_at` cleared — everything opens again at once |

**Blocked (`cancelled`) means:** people can still log in and see who they are (`/auth/me`), and the billing read routes (`GET /api/billing/subscription`, `/usage`, `/invoices`) still answer, so the company admin can see the billing page and pay. Every other company route is refused by `SubscriptionGuard` — the Field area too. **No data is ever deleted.**

Other rules that come with it:

- `grace_ends_at` exists only while the status is `past_due`. Any other status clears it.
- The banner and the blocked page say "no payment received" — the same words for both causes.
- The renewal job skips a `cancelled` subscription: a blocked company is not billed and its period does not move.
- The alerts go to the company's staff who can see `settings` (the same rule as the other subscription alerts).

### A failed payment

Decided 2026-10-10 (owner: "7 days and then a block, and ask him to pay").

- A Stripe payment failure → `status = past_due` and `grace_ends_at = now + 7 days`.
- Alert `subscription_payment_failed` asks the company to pay and gives the date: "pay before <date>, or your company will be blocked". The banner shows on every page, as after a trial.
- Day 7 with no payment → the same block as the trial (`cancelled`, alert `subscription_blocked`).
- **A second failure during the 7 days does not move the date.** The grace starts at the first unpaid event and is never extended.
- **A failure on a blocked (`cancelled`) company keeps it blocked** — it never reopens a company; only a successful payment does.
- A successful payment → `active`, `grace_ends_at` cleared.

Fast-forwarding these dates to test them: the super-admin dev tools, [Phaces/20-trial-end-dev-tools.md](Phaces/20-trial-end-dev-tools.md) — never available in production.

## Decided — paying by card (Stripe Checkout)

Decided 2026-10-15 (owner: option A).

- The tenant admin pays on a **Stripe Checkout** page (a Stripe page, not ours) and comes back to the app.
- Paying creates a **Stripe customer** (the company's account in Stripe) and a **Stripe subscription** (an automatic monthly charge of the plan's price).
- **Stripe charges the card every month.** Our app never charges a card itself.
- Our renewal job still counts usage and sends the overage to Stripe as an invoice item. Stripe adds it to an invoice.
- The 7-day grace and block rules above stay the same. Stripe never blocks a company by itself; our rules do.

Also decided 2026-10-15 (owner):

- **Paying during the trial** saves the card; the first charge is on the trial's last day. The free days are kept.
- **Overage** is added to the Stripe invoice of the same month: the renewal runs when Stripe creates that invoice.
- **Stripe owns the period dates** of a paying company; our DB copies them.
- **A plan change** of a paying company changes the Stripe price at once, with no proration, and Stripe uses it from the next invoice.
- **Card change and Stripe invoices**: the Stripe Customer Portal (update card + invoices only).
- **Cancel**: the tenant admin can cancel. The app works until the end of the paid month, **no refund**. Then `cancelled` (blocked, data kept, can pay again).
- **VAT**: not now, decided later.

- **Undo a cancel**: before the month ends, the tenant admin can click "Keep my subscription"; the next month is charged normally.
- **A blocked company pays again**: a new month starts on the payment day (blocked 1 March, pays 20 March → 20 March → 20 April).

Build: [Phaces/21-stripe-checkout.md](Phaces/21-stripe-checkout.md) § 2.

## Decided — the billing history

Decided 2026-10-16 (owner).

- The history shows **one block per finished period**: the usage counted at renewal (used / included per dimension), then **Formule + Supplément = Total payé**.
- **The money comes from Stripe**, read when the history opens. It is never recomputed by us, so it always matches the Stripe invoices.
- Stripe charges one period on two invoices: the **plan price at the start** of the period, the **overage at the end** (the invoice made at renewal). The block adds both: e.g. 10 € plan + 4 € overage = **14 €**.
- **Total à payer** instead of **Total payé** when one of those invoices is not paid yet.
- A period with nothing charged by card (the trial, or a company that never paid by card) shows **0,00 €**. If overage was counted but not charged by card, a line says so.
- If Stripe cannot be read, the usage still shows; the amounts say "unavailable".
- No new column: the amounts are not stored in our database.
- Pages count **periods**, not rows: a period is never cut in two.

## Decided — the payment email

Decided 2026-10-17 (owner).

- When Stripe says an invoice is **paid** (`invoice.paid`), the company gets a **"Paiement reçu"** email (alert `subscription_payment_received`).
- **Who:** the same people as the other subscription emails — the company's staff who can view `settings` (the admin). In the **company's language** (fr / nl / en; unknown → en).
- **What it shows:** the plan name and its price with its period (*Du … au …*), the extra usage (overage) with the month it covers, the VAT when there is some, the **total paid**, the paid date, the invoice number, and a button to the Billing page.
- Same split as the billing history: a subscription line = the plan; any other line = overage. Amounts come from the Stripe invoice, never recomputed.
- An invoice of **0 €** (the trial) sends nothing.
- All company emails show money and dates in the reader's language: `10,00 €`, `30/12/2026` (fr / nl), `€10.00` (en).
- Later (not built): a "Pay now" button in the failed / renewal emails, a link to the Stripe invoice PDF — see `ToDo/emails-and-payments.md`.

## Decided

- **Plan deactivation/repricing**: existing customers **keep their current plan and terms** — nothing changes automatically for them. The super-admin has manual control to move a specific customer to a different plan (an upgrade/downgrade action), but it's admin-initiated, never automatic.

- **No manual add-on toggle — usage-based billing instead**: there's no separate "buy/remove add-on" switch. Every dimension (employees, projects, storage...) is billed on **actual usage, checked at each renewal**: `bill = base plan price + (actual usage − base plan allowance) × per-unit overage price`, for whichever dimensions are over their base allowance.

  Worked example — employees, base plan = 5 included:

  - Tenant has 8 active employees this month → billed for 8 (5 base + 3 over).
  - They don't "remove an add-on" — they just deactivate/remove employees if they want to pay less. Nothing to toggle.
  - Current month is already paid for — no refund/proration mid-cycle, they keep all 8 seats until the period ends.
  - At next renewal, the system re-counts actual usage: still 8 active → billed for 8 again, automatically. Back down to 5 → billed for 5, automatically.

- **Going over a plan's included allowance never blocks anything.** Not creating, not editing, not existing records. The tenant can always add one more employee, project or client. The extra usage is simply counted at renewal and billed as overage.

  There is no limit check anywhere in the request pipeline. `SubscriptionGuard` checks only that the tenant is not suspended and the subscription status allows access — it never counts resources and never refuses a create.

  | Situation | What happens |
  | --- | --- |
  | Tenant on a 5-employee plan adds a 6th | Allowed. Billed 5 base + 1 overage at renewal |
  | Tenant on a 50-client plan adds client 54 | Allowed. Billed 50 base + 4 overage at renewal |
  | Tenant's subscription is `cancelled` or tenant is `suspended` | Blocked at the guard — no access at all |

  Storage is the one exception, and only on a **downgrade request** — see below. Normal storage usage over the allowance is billed, never blocked.

## Decided — the default plan is protected

A signup always needs a default plan, so the platform guards it:

- **The default plan cannot be deactivated.** The super-admin makes another plan the default first, then deactivates the old one.
- **An inactive plan cannot be made the default.** New signups could not pick it.
- **Making a plan the default clears the old default in the same transaction.** Only one row is ever `is_default`.
- **A new version of the default plan becomes the default.** The old row is deactivated and loses the flag, the new row takes it, in one transaction — signups never find the default missing.
- **A version copies what the request leaves out** (name, price, features) from the plan it replaces. The Stripe Price id is not copied: a new price needs a new Stripe Price.
- **`retention_days` always has an overage rate of 0** — it is a value, not something billed.
- **A plan change is planned, never applied now.** `pending_plan_id` is set and `pending_plan_effective_at` is the end of the current period (`period_end`). `plan_id` changes at renewal.

## What this adds to the data model

- No add-on subscription-item table needed. Instead: a **usage snapshot per tenant per billing cycle** — actual counts for each dimension (employee count, project count, storage used, etc.) at renewal time, which drives that cycle's invoice amount.
- **Effective limit** for any dimension = the base plan's included allowance; going over it doesn't block anything, it just adds billed overage at the next renewal.

## Decided — storage is a special case

- **Normal usage (no plan change)**: same philosophy as employees — pay for what's actually used. Using 30GB on a 20GB-included plan just bills the extra GB automatically, no blocking.
- **Downgrade requests are gated, unlike employees**: a customer can't move their storage allowance down while still holding more data than the new target. Before accepting a downgrade (e.g. 30GB → 20GB), the system checks actual usage first:
  - Usage already ≤ new target → downgrade accepted immediately.
  - Usage still above the new target → downgrade **refused**, customer is told to delete/reduce files down to the target first, then the change can be applied.
- **Why storage differs from employees**: deactivating an employee drops usage instantly. Storage doesn't — the files physically still exist until deleted, so the system must check *before* accepting the downgrade rather than relying on usage naturally dropping on its own.

## Public plan list — the pricing page

`GET /api/plans` — `@Public()`, no login. It feeds the public pricing page.

- Returns only plans with `is_active = true`. A new version deactivates the row it replaces, so these are exactly the current versions — old versions kept for existing subscribers never show.
- Per plan: `id`, `name`, `base_price`, `is_default`, and `features`: `[{ feature_key, limit_value, overage_rate }]`.
- Never returns `stripe_price_id`, `parent_plan_id`, or any subscriber count.
- Sorted by `base_price`, cheapest first.
- Read-only. Plans are still created and changed only through `/api/admin/plans`.

## Related notes

- \[\[business-logic-overview\]\]
- \[\[A_progress-tracker\]\]

---

# Technical Explanation

## Database Structure

### `plans` table

**Purpose:** One row per plan version. Managed by the super-admin. Never edited once tenants are subscribed to it — changes create a new version row instead.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | PK |
| `name` | varchar | "Pro", "Starter"… |
| `is_active` | boolean | false = no new signups allowed |
| `is_default` | boolean | **The plan a new signup lands on.** Only one row may be true |
| `parent_plan_id` | integer (nullable) | FK → plans.id — points to the previous version this was created from |
| `base_price` | decimal | Monthly base price |
| `stripe_price_id` | varchar | Stripe Price ID for this version — **auto-created, never input** (see below) |
| `created_at` | timestamp |  |

> Plans are **immutable once in use**. Changing a plan (price, limits) = deactivate old row + create new row with `parent_plan_id` pointing to the old one. Existing tenants stay on the old row automatically.

**Decision (2026-10-05): `stripe_price_id` is managed by the app, not typed in by the super-admin.**
The admin has no reason to know Stripe's object model, so `POST /api/admin/plans` and `POST /api/admin/plans/:id/version` no longer accept `stripe_price_id` as input. On create, the handler calls Stripe to create one Product + one recurring **monthly** Price **in EUR** (the only currency used anywhere else in this app — tenants, invoices, quotes) and stores the returned id. Creating a version mints a **new** Stripe Price the same way (Stripe Prices are immutable too, matching this table's own versioning rule) and archives the parent's old Price. Deactivating a plan (`PATCH /:id/deactivate`) also archives its Stripe Price. "Archive" (`active: false`) is Stripe's equivalent of this table's `is_active` — Stripe has no hard delete for a Price either, and archiving does not affect tenants already subscribed to it, exactly like `is_active` here.
Archiving is **best-effort**: a Stripe failure here is logged, never blocks the deactivation/version-replace in our own database — it is a sync action, not a data-integrity one. Creating the Price on a brand-new plan is the opposite: if Stripe fails there, the whole plan creation fails, because a plan with no real Price can never actually be billed later.
The Stripe calls live in `src/stripe/` (`CreatePlanPriceHandler`, `ArchivePlanPriceHandler`), not in `src/subscriptions/`, to avoid a circular module dependency — `subscriptions` already imports `plans`.

---

### `plan_features` table

**Purpose:** Stores the limit and overage rate for each dimension, per plan. Separate from `plans` so new features can be added without a schema migration — just insert new rows.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | PK |
| `plan_id` | integer | FK → plans.id |
| `feature_key` | varchar | One of the fixed keys listed above — `"max_workers"`, `"max_clients"`, `"storage_gb"`… |
| `limit_value` | int | Included allowance (e.g. 5 employees) |
| `overage_rate` | decimal | Price per extra unit beyond the limit |

> `retention_days` has no overage rate — you either have it or not.

**Decision (2026-10-05): all 6 feature keys are required on every plan, no more, no fewer.** `POST /api/admin/plans` and `POST /api/admin/plans/:id/version` (when `features` is sent — omitting it still copies the parent, which already satisfies this) refuse a list that doesn't contain exactly the 6 fixed keys. Reason: the renewal job bills a plan by looking up `(plan_id, feature_key)` — a plan missing a dimension has no value to bill against, and that gap would only surface at renewal time, in production, months after the plan was created. Enforced in application code (`plan.helper.ts`), not a DB constraint — the existing duplicate-key check already lived at that layer, this is the same kind of rule.

**Decision (2026-10-05): `overage_rate: "0"` means unlimited for that dimension, at no extra cost.** This was already true by the billing formula — `bill = base_price + Σ max(0, actual − allowance) × overage_rate` — a `0` rate contributes nothing no matter how far over the `limit_value` actual usage goes, so a tenant with 5 included workers and 500 actual workers pays the same base price either way. Writing it down so it isn't re-derived from the formula each time; same spirit as the existing `retention_days` carve-out, just explicit now instead of implicit.

**Decision (2026-10-05): no feature-translation table.** `feature_key` stays a plain code on the wire — the API never returns a display label. The 6 keys are fixed and only need 3 locales (`fr`/`en`/`nl`), so this is static UI copy, not data: whichever frontend consumes `GET /api/admin/plans` maps `feature_key` → its own i18n bundle for the label, the same way it would for any other fixed enum. Revisit only if the backend itself ever needs to render the label server-side (a server-rendered billing page, a PDF, an email) — nothing does today.

---

### `tenant_subscriptions` table

**Purpose:** One row per tenant. Tracks which exact plan version the tenant is on, their Stripe subscription, and any pending plan change.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | PK |
| `tenant_id` | integer | FK → tenants.id |
| `plan_id` | integer | FK → plans.id — the exact row the tenant is locked to |
| `stripe_subscription_id` | varchar | Stripe Subscription ID |
| `stripe_price_id` | varchar | The Stripe Price at time of signup — may differ from `plans.stripe_price_id` after a plan version change |
| `status` | enum | `trialing` · `active` · `past_due` · `cancelled` |
| `period_start` | timestamp | Current billing period start |
| `period_end` | timestamp | Current billing period end / next renewal |
| `pending_plan_id` | integer (nullable) | FK → plans.id — new plan to apply at next renewal |
| `pending_plan_effective_at` | timestamp (nullable) | When the pending change takes effect |

---

### `billing_usage_snapshots` table

**Purpose:** A snapshot of actual usage per tenant per billing cycle, taken at renewal. This is what drives the invoice calculation — not the plans table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | PK |
| `tenant_id` | integer | FK → tenants.id |
| `period_start` | timestamp |  |
| `period_end` | timestamp |  |
| `snapshot_taken_at` | timestamp |  |
| `feature_key` | varchar | One row per dimension (e.g. `"max_workers"`) |
| `actual_count` | int / decimal | Real usage at renewal time |
| `included_allowance` | int | Copied from plan_features at snapshot time |
| `overage_rate` | decimal | Copied from plan_features at snapshot time |
| `overage_amount` | decimal | `max(0, actual - allowance) × overage_rate` |
| `stripe_invoice_id` | varchar |  |

> Rates and limits are **copied at snapshot time** so historical invoices stay accurate even if the plan changes later.

---

### Operational tables (`users`, `projects`, `clients`…)

**Purpose:** The real business data. These are the tables the system counts at renewal to produce the snapshot. **There is no `workers` table** — employees are rows in `users` with `role_id` pointing at the `worker` role.

Example: counting workers

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | PK |
| `tenant_id` | integer | FK → tenants.id |
| `name` | varchar |  |
| `role_id` | smallint | FK → roles.id — the 7 seeded roles are fixed 1-7, a different column type than the auto-increment integer `id` used elsewhere |
| `is_active` | boolean | Only active rows are counted at renewal |

```sql
-- max_workers usage at renewal
SELECT COUNT(*) FROM users
WHERE tenant_id = :tenant
  AND is_active = true
  AND role_id = (SELECT id FROM roles WHERE name = 'worker');
```

> The `plans` and `tenant_subscriptions` tables **never store counts**. Usage lives here.

---

## Scenarios

### Scenario 1 — Full lifecycle: create plan → subscribe → add seat → change plan

**Step 1: Admin creates "Pro" plan**

`plans`:

| id | name | base_price | is_active | parent_plan_id |
| --- | --- | --- | --- | --- |
| plan_001 | Pro | 50€ | true | null |

`plan_features`:

| plan_id | feature_key | limit_value | overage_rate |
| --- | --- | --- | --- |
| plan_001 | max_workers | 5 | 2.00 |
| plan_001 | max_clients | 50 | 0.20 |
| plan_001 | storage_gb | 20 | 0.50 |

---

**Step 2: Tenant A subscribes**

`tenant_subscriptions`:

| id | tenant_id | plan_id | status | period_start | period_end |
| --- | --- | --- | --- | --- | --- |
| sub_001 | tenant_A | plan_001 | active | 2026-09-01 | 2026-09-30 |

---

**Step 3: Tenant A adds 2 seats (now has 7 active employees)**

No change to `plans` or `tenant_subscriptions`. The 2 new employees are saved in `users`:

`users` (role = `worker`):

| id | tenant_id | name | is_active |
| --- | --- | --- | --- |
| ou_1 | tenant_A | Youssef | true |
| ou_2 | tenant_A | Karim | true |
| ou_3 | tenant_A | Ahmed | true |
| ou_4 | tenant_A | Omar | true |
| ou_5 | tenant_A | Samir | true |
| ou_6 | tenant_A | Hassan | true ← new |
| ou_7 | tenant_A | Mehdi | true ← new |

At renewal, system counts 7 active `worker` users → computes overage:

```
bill = 50€ + (7 - 5) × 2€ = 54€
```

`billing_usage_snapshots` (created at renewal):

| tenant_id | feature_key | actual_count | included_allowance | overage_amount |
| --- | --- | --- | --- | --- |
| tenant_A | max_workers | 7 | 5 | 4.00€ |

---

**Step 4: Admin changes "Pro" price from 50€ → 60€**

Admin does NOT edit `plan_001`. Creates a new version:

`plans`:

| id | name | base_price | is_active | parent_plan_id |
| --- | --- | --- | --- | --- |
| plan_001 | Pro | 50€ | **false** | null |
| plan_002 | Pro | 60€ | **true** | plan_001 |

`tenant_subscriptions` — **unchanged**:

| id | tenant_id | plan_id | status |
| --- | --- | --- | --- |
| sub_001 | tenant_A | **plan_001** | active |

- Tenant A → still on plan_001 → still pays 50€ base ✅
- New Tenant B → goes to plan_002 → pays 60€ base ✅

---

**Step 5: Admin manually moves Tenant A to new plan**

`tenant_subscriptions`:

| id | tenant_id | plan_id | pending_plan_id | pending_plan_effective_at |
| --- | --- | --- | --- | --- |
| sub_001 | tenant_A | plan_001 | plan_002 | 2026-10-01 (next renewal) |

At next renewal → `plan_id` is updated to `plan_002` → Tenant A now pays 60€ base.