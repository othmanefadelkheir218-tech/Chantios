# ChantierOS — Subscription Plans (admin-configurable)

> Planning mode. Nothing here is locked — this is the working draft as agreed so far.

## The core idea

- **Fixed**: the *list of things that can be limited* (the dimensions below). Developers define these once.
- **Configurable by the super-admin, at any time**: how many plans exist, each plan's name, its price, and its value on every dimension.

A plan is a **row of data the admin manages**, not a hardcoded tier. The admin can create a new plan, edit an existing one's price/limits, or remove a plan — and once removed, new customers can no longer pick it (existing customers on it are a separate decision, see open point below).

Example: admin creates "Plan X," sells it to Customer A. Later removes "Plan X." Customer B can never see or pick it. Customer A keeps it unless the admin decides otherwise.

## The 8 agreed dimensions

1. Number of projects per plan
2. Number of "mini employees" (`ouvrier` — task + pointage only)
3. Number of managers (admin-dashboard access)
4. Number of clients
5. Number of subcontractors
6. Document & photo storage quota
7. History/data retention length
8. Client connection channels (Email now; Telegram/WhatsApp as future additions)

AI features are deliberately excluded from this list for now — handled separately, later.

## Extra monetization ideas on top of the plan list

- **À la carte add-ons**: let a tenant buy more of one dimension (extra projects, extra seats, extra storage) without jumping to a whole new plan — same pattern as the AI token recharge packs already planned.
- **Annual billing discount**: e.g. 2 months free for yearly payment — improves cash flow, separate from the plan/feature model itself.

## What this means for the data model

Move away from a fixed 3-value plan enum. Instead:

- A **`plans` table**: one row per plan (admin-created), holding its name, price, active/inactive status, and a value for each of the 8 dimensions.
- **Active/inactive, not hard delete**: removing a plan should deactivate it (stop new signups from picking it) rather than deleting the row outright — existing subscribers still reference it.
- **Price changes**: since Stripe prices are immutable, changing a plan's price means creating a new Stripe Price and pointing new signups to it (see the open decision below for existing customers).

## Decided

- **Plan deactivation/repricing**: existing customers **keep their current plan and terms** — nothing changes automatically for them. The super-admin has manual control to move a specific customer to a different plan (an upgrade/downgrade action), but it's admin-initiated, never automatic.

- **No manual add-on toggle — usage-based billing instead**: there's no separate "buy/remove add-on" switch. Every dimension (employees, projects, storage...) is billed on **actual usage, checked at each renewal**: `bill = base plan price + (actual usage − base plan allowance) × per-unit overage price`, for whichever dimensions are over their base allowance.

  Worked example — employees, base plan = 5 included:
  - Tenant has 8 active employees this month → billed for 8 (5 base + 3 over).
  - They don't "remove an add-on" — they just deactivate/remove employees if they want to pay less. Nothing to toggle.
  - Current month is already paid for — no refund/proration mid-cycle, they keep all 8 seats until the period ends.
  - At next renewal, the system re-counts actual usage: still 8 active → billed for 8 again, automatically. Back down to 5 → billed for 5, automatically.

- **Being over a plan's included allowance never blocks or force-deactivates anything that already exists.** It only stops *creating new* ones of that resource once usage is at/above the allowance — the overage itself just gets billed, not blocked. (Storage might need its own read on this — flagged below.)

## What this adds to the data model

- No add-on subscription-item table needed. Instead: a **usage snapshot per tenant per billing cycle** — actual counts for each dimension (employee count, project count, storage used, etc.) at renewal time, which drives that cycle's invoice amount.
- **Effective limit** for any dimension = the base plan's included allowance; going over it doesn't block anything, it just adds billed overage at the next renewal.

## Decided — storage is a special case

- **Normal usage (no plan change)**: same philosophy as employees — pay for what's actually used. Using 30GB on a 20GB-included plan just bills the extra GB automatically, no blocking.
- **Downgrade requests are gated, unlike employees**: a customer can't move their storage allowance down while still holding more data than the new target. Before accepting a downgrade (e.g. 30GB → 20GB), the system checks actual usage first:
  - Usage already ≤ new target → downgrade accepted immediately.
  - Usage still above the new target → downgrade **refused**, customer is told to delete/reduce files down to the target first, then the change can be applied.
- **Why storage differs from employees**: deactivating an employee drops usage instantly. Storage doesn't — the files physically still exist until deleted, so the system must check *before* accepting the downgrade rather than relying on usage naturally dropping on its own.

## Related notes
- [[business-logic-overview]]
- [[A_progress-tracker]]

---

# Technical Explanation

## Database Structure

### `plans` table
**Purpose:** One row per plan version. Managed by the super-admin. Never edited once tenants are subscribed to it — changes create a new version row instead.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | varchar | "Pro", "Starter"… |
| `is_active` | boolean | false = no new signups allowed |
| `parent_plan_id` | uuid (nullable) | FK → plans.id — points to the previous version this was created from |
| `base_price` | decimal | Monthly base price |
| `stripe_price_id` | varchar | Stripe Price ID for this version |
| `created_at` | timestamp | |

> Plans are **immutable once in use**. Changing a plan (price, limits) = deactivate old row + create new row with `parent_plan_id` pointing to the old one. Existing tenants stay on the old row automatically.

---

### `plan_features` table
**Purpose:** Stores the limit and overage rate for each dimension, per plan. Separate from `plans` so new features can be added without a schema migration — just insert new rows.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `plan_id` | uuid | FK → plans.id |
| `feature_key` | varchar | `"max_ouvriers"`, `"max_projects"`, `"storage_gb"`… |
| `limit_value` | int | Included allowance (e.g. 5 employees) |
| `overage_rate` | decimal | Price per extra unit beyond the limit |

> `retention_days` and `client_channels` have no overage rate (binary — you either have it or not).

> **Open: feature translation** — `feature_key` is a code. Display names and translations (FR/AR/EN) need a separate lookup, not stored here.

---

### `tenant_subscriptions` table
**Purpose:** One row per tenant. Tracks which exact plan version the tenant is on, their Stripe subscription, and any pending plan change.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | FK → tenants.id |
| `plan_id` | uuid | FK → plans.id — the exact row the tenant is locked to |
| `stripe_subscription_id` | varchar | Stripe Subscription ID |
| `stripe_price_id` | varchar | The Stripe Price at time of signup — may differ from `plans.stripe_price_id` after a plan version change |
| `status` | varchar | `active`, `cancelled`, `past_due`… |
| `period_start` | timestamp | Current billing period start |
| `period_end` | timestamp | Current billing period end / next renewal |
| `pending_plan_id` | uuid (nullable) | FK → plans.id — new plan to apply at next renewal |
| `pending_plan_effective_at` | timestamp (nullable) | When the pending change takes effect |

---

### `billing_usage_snapshots` table
**Purpose:** A snapshot of actual usage per tenant per billing cycle, taken at renewal. This is what drives the invoice calculation — not the plans table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | FK → tenants.id |
| `period_start` | timestamp | |
| `period_end` | timestamp | |
| `snapshot_taken_at` | timestamp | |
| `feature_key` | varchar | One row per dimension (e.g. `"max_ouvriers"`) |
| `actual_count` | int / decimal | Real usage at renewal time |
| `included_allowance` | int | Copied from plan_features at snapshot time |
| `overage_rate` | decimal | Copied from plan_features at snapshot time |
| `overage_amount` | decimal | `max(0, actual - allowance) × overage_rate` |
| `stripe_invoice_id` | varchar | |

> Rates and limits are **copied at snapshot time** so historical invoices stay accurate even if the plan changes later.

---

### Operational tables (e.g. `ouvriers`, `projects`, `clients`…)
**Purpose:** The real business data. These are the tables the system counts at renewal to produce the snapshot.

Example: `ouvriers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tenant_id` | uuid | FK → tenants.id |
| `name` | varchar | |
| `is_active` | boolean | Only active rows are counted at renewal |

> The `plans` and `tenant_subscriptions` tables **never store counts**. Usage lives here.

---

## Scenarios

### Scenario 1 — Full lifecycle: create plan → subscribe → add seat → change plan

**Step 1: Admin creates "Pro" plan**

`plans`:
| id | name | base_price | is_active | parent_plan_id |
|---|---|---|---|---|
| plan_001 | Pro | 50€ | true | null |

`plan_features`:
| plan_id | feature_key | limit_value | overage_rate |
|---|---|---|---|
| plan_001 | max_ouvriers | 5 | 2.00 |
| plan_001 | max_projects | 10 | 5.00 |
| plan_001 | storage_gb | 20 | 0.50 |

---

**Step 2: Tenant A subscribes**

`tenant_subscriptions`:
| id | tenant_id | plan_id | status | period_start | period_end |
|---|---|---|---|---|---|
| sub_001 | tenant_A | plan_001 | active | 2026-09-01 | 2026-09-30 |

---

**Step 3: Tenant A adds 2 seats (now has 7 active employees)**

No change to `plans` or `tenant_subscriptions`. The 2 new employees are saved in `ouvriers`:

`ouvriers`:
| id | tenant_id | name | is_active |
|---|---|---|---|
| ou_1 | tenant_A | Youssef | true |
| ou_2 | tenant_A | Karim | true |
| ou_3 | tenant_A | Ahmed | true |
| ou_4 | tenant_A | Omar | true |
| ou_5 | tenant_A | Samir | true |
| ou_6 | tenant_A | Hassan | true ← new |
| ou_7 | tenant_A | Mehdi | true ← new |

At renewal, system counts 7 active ouvriers → computes overage:
```
bill = 50€ + (7 - 5) × 2€ = 54€
```

`billing_usage_snapshots` (created at renewal):
| tenant_id | feature_key | actual_count | included_allowance | overage_amount |
|---|---|---|---|---|
| tenant_A | max_ouvriers | 7 | 5 | 4.00€ |

---

**Step 4: Admin changes "Pro" price from 50€ → 60€**

Admin does NOT edit `plan_001`. Creates a new version:

`plans`:
| id | name | base_price | is_active | parent_plan_id |
|---|---|---|---|---|
| plan_001 | Pro | 50€ | **false** | null |
| plan_002 | Pro | 60€ | **true** | plan_001 |

`tenant_subscriptions` — **unchanged**:
| id | tenant_id | plan_id | status |
|---|---|---|---|
| sub_001 | tenant_A | **plan_001** | active |

- Tenant A → still on plan_001 → still pays 50€ base ✅
- New Tenant B → goes to plan_002 → pays 60€ base ✅

---

**Step 5: Admin manually moves Tenant A to new plan**

`tenant_subscriptions`:
| id | tenant_id | plan_id | pending_plan_id | pending_plan_effective_at |
|---|---|---|---|---|
| sub_001 | tenant_A | plan_001 | plan_002 | 2026-10-01 (next renewal) |

At next renewal → `plan_id` is updated to `plan_002` → Tenant A now pays 60€ base.
