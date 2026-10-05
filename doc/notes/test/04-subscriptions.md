# Tests — Subscriptions

> Routes: `/api/admin/subscriptions`. One row per tenant — there is no separate `subscriptions` table.
> Read [00-how-to-test.md](00-how-to-test.md) first. Rules: [subscription-plans.md](../subscription-plans.md).

| Method | Path | What |
|---|---|---|
| `GET` | `/api/admin/subscriptions` | List, filter by `status` |
| `GET` | `/api/admin/subscriptions/:tenantId` | The subscription of one tenant |
| `PATCH` | `/api/admin/subscriptions/:tenantId/plan` | Plan the move to another plan at the next renewal |
| `GET` | `/api/admin/subscriptions/:tenantId/usage` | Usage snapshots of a tenant |

> The path id is the **tenant** id, not the subscription id.

**Start state:** the two demo tenants have a `trialing` subscription on `Demo Starter`. Get their ids with `GET /api/admin/tenants`. Call them `TENANT_DUPONT` and `TENANT_VERHELST`.

You need two plans for these tests. Create them with the bodies in [03-plans.md](03-plans.md) (PLN-01): `TEST Plan A` and a second active plan. Call the active plan you will move a tenant to `PLAN_X`.

---

## SUB-01 — List

`GET /api/admin/subscriptions`

**Expected**
- `200`, a paged list with 2 rows (more if you added some).
- Each row has: `tenant_id`, `plan_id`, `status`, `period_start`, `period_end`, `pending_plan_id` (`null`), `pending_plan_effective_at` (`null`).
- `status` is `trialing`; `period_end` is about 14 days after `period_start`.

| Request | Expected |
|---|---|
| `?status=trialing` | Both demo rows |
| `?status=active` | Empty |
| `?status=past_due` | Empty |
| `?status=free` | `400` |
| `?limit=1&page=2` | One row, `page` is `2` |

## SUB-02 — Read one

`GET /api/admin/subscriptions/TENANT_DUPONT`

**Expected** `200`. `tenant_id` is Dupont's id. `plan_id` is the id of `Demo Starter`.

| Request | Expected |
|---|---|
| `/api/admin/subscriptions/abc` | `400` |
| `/api/admin/subscriptions/00000000-0000-4000-8000-000000000000` | `404`, `Subscription not found for this tenant` |
| The id of a `TEST` tenant (created through the API) | `404` — it has no subscription (known limit) |

---

## Plan a plan change

## SUB-03 — Set the pending plan

`PATCH /api/admin/subscriptions/TENANT_DUPONT/plan`

```json
{ "plan_id": "PLAN_X" }
```

**Expected**
- `200`.
- `pending_plan_id` is `PLAN_X`.
- `pending_plan_effective_at` equals `period_end` (the next renewal).
- **`plan_id` did not change.** The tenant stays on its old plan until renewal.
- `GET /api/admin/subscriptions/TENANT_DUPONT` shows the same.
- Dupont's **colleague** is untouched: `TENANT_VERHELST` still has `pending_plan_id: null`.

## SUB-04 — The plan change can be replaced

Send SUB-03 again with another active plan.

**Expected** `200`. `pending_plan_id` is the new one. Only one pending plan exists per tenant.

## SUB-05 — Refused changes (all `400` unless said)

| Request | Message / result |
|---|---|
| `plan_id` of an **inactive** plan | `This plan is closed to new customers` |
| `plan_id` = the plan the tenant is **already on** | `The tenant is already on this plan` |
| `plan_id` = `"abc"` | `plan_id must be a UUID` |
| no `plan_id` | `plan_id must be a UUID` |
| `plan_id` of a plan that does not exist (valid UUID) | **`404`** `Plan not found` |
| unknown tenant id in the path | **`404`** `Subscription not found for this tenant` |
| extra field `"status": "active"` | `property status should not exist` |

After all refusals, the tenant's data must be unchanged (`GET` it).

---

## Usage

## SUB-06 — Usage list

`GET /api/admin/subscriptions/TENANT_DUPONT/usage`

**Expected** `200`, `{ data: [], total: 0, ... }`. Snapshots are written at renewal (step 14), so the list is empty now.

Unknown tenant id → `200` with an empty list (usage has no tenant check). Bad id `abc` → `400`.

### SUB-07 — Usage with data (optional, by SQL)

Insert one snapshot by hand to see the shape:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into billing_usage_snapshots (tenant_id, period_start, period_end, feature_key, actual_count, included_allowance, overage_rate, overage_amount) select id, now() - interval '30 days', now(), 'max_workers', 7, 5, 2.00, 4.00 from tenants where name = 'Rénovation Dupont';"
```

`GET /api/admin/subscriptions/TENANT_DUPONT/usage`

**Expected** one row: `feature_key` `max_workers`, `actual_count` `"7"`, `included_allowance` `5`, `overage_rate` `"2"`, `overage_amount` `"4"`.

Remove it:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from billing_usage_snapshots where feature_key = 'max_workers' and actual_count = 7;"
```

---

## Clean up

Use § 5 of [00-how-to-test.md](00-how-to-test.md): it clears `pending_plan_id` before deleting the `TEST` plans.

## Known limits (not bugs)

- The storage downgrade check (refuse a move to a plan with less storage than the tenant uses) is **not built**. It needs `media` (step 03).
- Snapshots are written by the renewal job (step 14). There is no route that writes them.
- Nothing moves `plan_id` at renewal yet (step 14).
