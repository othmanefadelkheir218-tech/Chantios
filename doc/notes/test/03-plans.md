# Tests — Plans

> Routes: `/api/admin/plans`. A plan is a row of data the super-admin manages.
> Read [00-how-to-test.md](00-how-to-test.md) first. Rules: [subscription-plans.md](../subscription-plans.md) (read § "the default plan is protected").

| Method | Path | What |
|---|---|---|
| `POST` | `/api/admin/plans` | Create a plan with its features |
| `GET` | `/api/admin/plans` | List, search, filter by `is_active` |
| `GET` | `/api/admin/plans/:id` | One plan with its features |
| `PATCH` | `/api/admin/plans/:id/deactivate` | Close to new signups |
| `PATCH` | `/api/admin/plans/:id/default` | Make it the default plan |
| `POST` | `/api/admin/plans/:id/version` | New version (never edit a plan in use) |

**Start state:** one default plan, `Demo Starter`. Run the scenarios in order — later ones need earlier results.

The 6 allowed `feature_key` values: `max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb`, `retention_days`.

---

## PLN-01 — Create a plan with 6 features

`POST /api/admin/plans`

```json
{
  "name": "TEST Plan A",
  "base_price": "50.00",
  "features": [
    { "feature_key": "max_workers", "limit_value": 5, "overage_rate": "2.00" },
    { "feature_key": "max_managers", "limit_value": 3, "overage_rate": "5.00" },
    { "feature_key": "max_clients", "limit_value": 50, "overage_rate": "0.20" },
    { "feature_key": "max_subcontractors", "limit_value": 20, "overage_rate": "0.20" },
    { "feature_key": "storage_gb", "limit_value": 20, "overage_rate": "0.50" },
    { "feature_key": "retention_days", "limit_value": 365, "overage_rate": "9.99" }
  ]
}
```

**Expected**
- Status `201`. `features` has **6** rows, sorted by `feature_key`.
- `is_default` is `false`, `is_active` is `true`, `parent_plan_id` is `null`.
- `base_price` is `"50"`.
- **`retention_days` has `overage_rate` `"0"`** even though you sent `9.99` (it is a value, not billed).
- **`stripe_price_id` looks like `price_...` and is a real Stripe object** — you never sent one. See PLN-15.

Copy the `id`: it is `PLAN_A`.

Check all 6 rows are in the database:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select feature_key, limit_value, overage_rate from plan_features where plan_id = 'PLAN_A' order by 1;"
```

## PLN-02 — A plan can be minimal, but never partial

All 6 keys are **always** required (see PLN-03) — "small" means low or zero limits/rates, not fewer features.

Create `TEST Plan Min` with all 6 features, most at `"limit_value": 0` and `"overage_rate": "0"` — e.g. `max_clients` the only one with a real allowance: `{ "feature_key": "max_clients", "limit_value": 10 }`, no `overage_rate` sent for it. Every other key: `{ "feature_key": "...", "limit_value": 0, "overage_rate": "0" }`.

**Expected**
- `201`, 6 features.
- `max_clients`'s `overage_rate` is `"0"` (the default when you don't send one).
- **`overage_rate: "0"` on any dimension means unlimited for it, at no extra cost** — see `subscription-plans.md` § "overage_rate: 0 means unlimited".

## PLN-03 — Invalid plans leave nothing behind

Each is **`400`**:

| Body | Why |
|---|---|
| 6 features, one key sent twice (so a 6th real key is consequently missing — e.g. `max_workers` twice, no `storage_gb`) | `Duplicate feature_key: max_workers` — checked **before** the missing-key check |
| only 5 of the 6 keys, no duplicate (any one left out — e.g. no `retention_days`) | `All 6 features are required. Missing: retention_days` (names the actual missing key) |
| 7 features — with only 6 possible keys this always means a repeat | same duplicate-key message |
| a feature with `"feature_key": "max_planets"` | not one of the 6 keys |
| `"features": []` | `features must contain at least 1 elements` |
| no `features` | must be a list |
| `"base_price": "abc"` or `"-5"` or `"1.234"` | not a valid amount |
| `"limit_value": -1` | must not be less than 0 |
| `"limit_value": 1.5` | must be an integer |
| no `name` | name is required |
| `"tenant_id": "x"` | property should not exist |
| `"stripe_price_id": "string"` | property should not exist — it is created automatically, never sent (see PLN-15) |

The exact-6 rule lives in `plan.helper.ts`, not in the DTO — the DTO only checks `features` is a non-empty array of well-shaped items. That is deliberate: a DTO-level size check would reject a short list with a generic "must contain at least N elements" and never show which key is missing.

Then check no ghost plan was written:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select name from plans order by created_at;"
```

**Expected** only `Demo Starter`, `TEST Plan A` and `TEST Plan Min`.

## PLN-04 — Read

| Request | Expected |
|---|---|
| `GET /api/admin/plans` | `200`, paged, features included, newest first |
| `GET /api/admin/plans?search=test plan` | Only the `TEST` plans |
| `GET /api/admin/plans?is_active=true` | Every item has `is_active: true` |
| `GET /api/admin/plans?is_active=false` | Empty for now |
| `GET /api/admin/plans?is_active=maybe` | `400` |
| `GET /api/admin/plans/PLAN_A` | `200`, with 6 features |
| `GET /api/admin/plans/abc` | `400` |
| `GET /api/admin/plans/999999999` | `404`, `Plan not found` |

---

## The default plan

## PLN-05 — Only one default

1. `PATCH /api/admin/plans/PLAN_A/default` → **`200`**, `is_default: true`.
2. `GET /api/admin/plans` → **only `TEST Plan A`** has `is_default: true`. `Demo Starter` is now `false`.
3. Repeat step 1 → `200` again (nothing changes, no error).

Check:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select name from plans where is_default;"
```

**Expected** exactly one row.

## PLN-06 — Create a plan as default in one step

`POST /api/admin/plans` with `"name": "TEST Plan B"`, `"base_price": "60.00"`, `"is_default": true` and all 6 features (reuse PLN-01's list with different numbers if you like).

**Expected**
- `201`, `is_default: true`.
- `TEST Plan A` is now **not** default. Still exactly one default in the table.

Copy the `id`: `PLAN_B`.

## PLN-07 — The default plan cannot be deactivated

`PATCH /api/admin/plans/PLAN_B/deactivate` (it is the default now).

**Expected**
- `400`, message: `This is the default plan. Make another plan the default first, then deactivate this one.`
- `PLAN_B` is still active.

## PLN-08 — Deactivate a normal plan

1. `PATCH /api/admin/plans/PLAN_A/deactivate` → **`200`**, `is_active: false`.
2. The same call again → `200` (nothing breaks).
3. `GET /api/admin/plans?is_active=false` lists `TEST Plan A`.
4. `GET /api/admin/plans/PLAN_A` still works — the row is kept.

Unknown id → `404`.

## PLN-09 — An inactive plan cannot be the default

`PATCH /api/admin/plans/PLAN_A/default` (it is inactive now).

**Expected** `400`. The default is still `PLAN_B`.

---

## Versions

## PLN-10 — A version of a normal plan

Make `TEST Plan Min` active and not default (it is). Copy its `id`: `PLAN_MIN`.

`POST /api/admin/plans/PLAN_MIN/version`

```json
{ "base_price": "15.00" }
```

**Expected**
- `201`. The new plan has `parent_plan_id` = `PLAN_MIN`, `base_price` `"15"`.
- The **name and the features are copied** from `TEST Plan Min` (you did not send them).
- `PLAN_MIN` is now `is_active: false`.
- The new version is **not** default (its parent was not).
- The new version has its own `id` — copy it: `PLAN_MIN_V2`.

## PLN-11 — A version can change the features

A sent `features` list **replaces** the copy — but it must still contain all 6 keys (PLN-03's rule applies here too).

`POST /api/admin/plans/PLAN_MIN_V2/version`

```json
{
  "name": "TEST Plan Min v3",
  "features": [
    { "feature_key": "max_workers", "limit_value": 2, "overage_rate": "3.00" },
    { "feature_key": "max_managers", "limit_value": 0, "overage_rate": "0" },
    { "feature_key": "max_clients", "limit_value": 10, "overage_rate": "0" },
    { "feature_key": "max_subcontractors", "limit_value": 0, "overage_rate": "0" },
    { "feature_key": "storage_gb", "limit_value": 5, "overage_rate": "0" },
    { "feature_key": "retention_days", "limit_value": 90, "overage_rate": "9.99" }
  ]
}
```

**Expected** `201`. The features are exactly this new list of 6 (the list replaces the copy, it doesn't merge with it). `PLAN_MIN_V2` becomes inactive.

Sending only `{ "features": [{ "feature_key": "max_workers", "limit_value": 2 }] }` (one key) instead → `400`, `All 6 features are required. Missing: ...`.

## PLN-12 — A version of the default plan becomes the default

1. `POST /api/admin/plans/PLAN_B/version` with `{ "base_price": "65.00" }` (PLAN_B is the default).

**Expected**
- `201`, the new version has `is_default: true`, `parent_plan_id` = `PLAN_B`.
- `PLAN_B` is `is_active: false` **and** `is_default: false`.
- Exactly **one** default in the table. The default never disappears.

## PLN-13 — A replaced plan cannot be versioned again

`POST /api/admin/plans/PLAN_MIN/version` with `{}` (it was replaced in PLN-10).

**Expected** `400`, message: `This plan is already replaced. Create the new version from the active one.`

Unknown id → `404`. Invalid features (like PLN-03) → `400`.

## PLN-14 — Tenants keep their old plan

The two demo tenants are on `Demo Starter`. Do **not** version `Demo Starter` unless you want to (it changes the demo data).

If you did: `GET /api/admin/subscriptions` → both tenants still show the **old** `plan_id`. Nothing moves by itself.

---

## Stripe Price — created and archived automatically

See [subscription-plans.md](../subscription-plans.md) § "stripe_price_id is managed by the app". Checking the Stripe side needs the Stripe Dashboard (test mode) or a direct API call — there is no route here that reads from Stripe.

## PLN-15 — Create: a real Stripe Price is minted

Create any plan (e.g. redo PLN-01). **Expected**
- `stripe_price_id` in the response is a real Stripe Price id (`price_...`), not something you sent — the field is not acceptable in the request body at all (PLN-03).
- In Stripe: a Product named after the plan, and a Price under it — `currency: eur`, `recurring.interval: month`, `unit_amount` = `base_price` × 100, `active: true`.
- If Stripe is unreachable (bad `STRIPE_SECRET_KEY`, network down), plan creation itself fails with `502`, `Failed to create the Stripe price for this plan` — **no plan row is written** (check `select name from plans` has nothing new).

## PLN-16 — Version: new Price minted, parent's old Price archived

Create a version of any active plan (e.g. redo PLN-10/PLN-11 style).

**Expected**
- The new version's `stripe_price_id` is a **different** Stripe Price than the parent's, also `active: true`.
- The **parent's** `stripe_price_id` (same one as before — the column is not cleared, only the plan row's `is_active` changes) is now `active: false` in Stripe.
- This also always happens on PLN-12 (default plan version) — check the old default's old Stripe Price is archived too.

## PLN-17 — Deactivate: the Stripe Price is archived

`PATCH /api/admin/plans/:id/deactivate` on any active, non-default plan (e.g. redo PLN-08).

**Expected**
- `200` as before.
- In Stripe, that plan's `stripe_price_id` is now `active: false`.
- This is **best-effort**: if Stripe is unreachable, the plan still deactivates normally (`is_active: false` in the response) — only the Stripe side silently stays out of sync until retried. The route never returns an error for this.

---

## Clean up

Use § 5 of [00-how-to-test.md](00-how-to-test.md). It gives `Demo Starter` back its default flag. Check one default plan exists again.
