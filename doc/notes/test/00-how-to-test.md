# Test guide — Step 01 Platform

> How to test what is built so far. Read this file first, then follow the scenario files in order.
> Business rules live in the other notes. This folder only says **what to click** and **what you must see**.

| File | What it tests |
|---|---|
| [01-tenants.md](01-tenants.md) | Companies: create, list, read, update, suspend |
| [02-admin-users.md](02-admin-users.md) | ChantierOS staff accounts |
| [03-plans.md](03-plans.md) | Plans, features, default plan, versions |
| [04-subscriptions.md](04-subscriptions.md) | Subscription of a tenant, plan change, usage |
| [05-audit-analytics-feedback.md](05-audit-analytics-feedback.md) | Audit logs, analytics events, feedback |
| [06-auth-users.md](06-auth-users.md) | Step 02 — auth, mobile login, users, invitations, roles/permissions |

---

## 1. Start everything

```bash
docker compose up -d      # Postgres :5440 and Redis :6390
yarn seed:data            # 7 roles, 3 cost types, 10 categories
yarn seed:tenants         # demo plan, 2 demo tenants, demo users
yarn start:dev            # API on http://localhost:5300
```

The terminal must show `ChantierOS API (development) running` and a green status for the database and Redis.

| What | Address |
|---|---|
| API | `http://localhost:5300/api` |
| Swagger (try every route here) | `http://localhost:5300/api/docs` |
| Browse the tables | `yarn prisma:studio` → `http://localhost:51212` |

## 2. How to send a request

**Easiest: Swagger.** Open `/api/docs`, open a route, click **Try it out**, paste the body, click **Execute**. Read the **status code** and the **response body**.

You can also use Postman, or `curl`:

```bash
curl -s http://localhost:5300/api/admin/tenants
curl -s -X POST http://localhost:5300/api/admin/tenants -H "content-type: application/json" -d '{"name":"TEST Alpha","email":"test-alpha@test.invalid"}'
```

## 3. Things that are true for every route

- **No login yet.** Every route is open. Login comes in step 02. Do not put this on a public server.
- **Keys are `snake_case`** in and out: `legal_name`, `base_price`, `created_at`.
- **Money and rates are strings.** A trailing zero is dropped: `"21"` and `"50"`, not `"21.00"`. This is normal.
- **Lists** answer `{ data, total, page, limit, total_pages }`. Query: `?page=1&limit=20`. `limit` is 1–100.
- **Errors** look like `{ "message": ..., "error": "Bad Request", "statusCode": 400 }`. For a bad body, `message` is a list.
- **Unknown fields are refused.** Sending a field the route does not know gives `400`.
- **A path id must be an integer.** `/admin/tenants/abc` gives `400`. A valid integer that does not exist gives `404`.
- **Names:** every record you create in these tests starts with `TEST`, so you can find it and clean it (§ 5).

## 4. Seed data you start with

| Thing | Value |
|---|---|
| Tenants | `Rénovation Dupont`, `Bouw Verhelst` |
| Plan | `Demo Starter` — the default plan, 6 features |
| Subscriptions | Both tenants: `trialing`, 14 days, on `Demo Starter` |
| Super-admin | `SEED_ADMIN_EMAIL` in `.env` — **not** a route test: there is no login yet |

Many scenarios say *"copy the `id`"*. Do that from the response of the previous step.

## 5. Clean up after testing

Run these in PowerShell. They only touch rows whose name starts with `TEST`.

```powershell
# 1. give the default back to the demo plan, free the test plans
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "update plans set is_default = false where name like 'TEST%'; update plans set is_default = true, is_active = true where name = 'Demo Starter' and not exists (select 1 from plans where is_default);"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "update tenant_subscriptions set pending_plan_id = null, pending_plan_effective_at = null where pending_plan_id in (select id from plans where name like 'TEST%');"

# 2. delete the test rows
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from plans where name like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from tenants where name like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from admin_users where email like 'test-%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from feedback where title like 'TEST%'; delete from analytics_events where payload->>'test' = 'true';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from audit_logs where new_value::text ilike '%TEST%' or old_value::text ilike '%TEST%';"
```

Some audit entries (a `deactivate`, a `set_default`) carry no `TEST` text, so the last command leaves them. They are harmless. On a development database you can wipe all of them:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from audit_logs;"
```

Check: `Demo Starter` is the only default plan again.

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select name, is_default, is_active from plans;"
```

If something is badly broken: `yarn seed:reset` drops the whole database and rebuilds it (ask first — it deletes everything).

## 6. How to read a result

Each scenario has an **ID**, the **steps**, and the **Expected** result. Mark it:

| Mark | Meaning |
|---|---|
| ✅ | Matches the expected result exactly |
| ❌ | Different — write down the status code, the body, and what you sent |
| ⏭ | Skipped |

A scenario is only ✅ if **every** line of *Expected* is true.
