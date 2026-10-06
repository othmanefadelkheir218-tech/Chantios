# Test guide — Step 01 Platform + Step 02 Auth

> How to test what is built so far. Read this file first, then follow the scenario files in order.
> Business rules live in the other notes. This folder only says **what to click** and **what you must see**.

| File | What it tests |
|---|---|
| [01-tenants.md](01-tenants.md) | Companies: create, list, read, update, suspend |
| [02-admin-users.md](02-admin-users.md) | ChantierOS staff accounts |
| [03-plans.md](03-plans.md) | Plans, features, default plan, versions |
| [04-subscriptions.md](04-subscriptions.md) | Subscription of a tenant, plan change, usage |
| [05-audit-analytics-feedback.md](05-audit-analytics-feedback.md) | Audit logs, analytics events, feedback |
| [06-auth-users.md](06-auth-users.md) | Step 02 — auth, mobile login, users, invitations, roles/permissions, admin guard, cleanup job, tenant isolation |
| [07-media.md](07-media.md) | Step 03 — upload, rename, soft/hard delete, trash, 30-day purge, avatar/logo replace, storage usage, tenant isolation |
| [08-clients-projects.md](08-clients-projects.md) | Step 04 — clients, projects, the status matrix, closing guard, prospect-only delete cascading to media, tenant isolation |
| [09-catalogue-stock.md](09-catalogue-stock.md) | Step 05 — categories (shared defaults), services + recipe, materials, the append-only stock ledger, reservations, tenant isolation |
| [10-quotes-invoices.md](10-quotes-invoices.md) | Step 06 — quotes, VAT per rate group, document numbering, the acceptance chain (one transaction across quotes/projects/stock), invoices, the payment ledger, late invoices, tenant isolation |
| [11-purchases.md](11-purchases.md) | Step 07 — subcontractor directory + contracts, suppliers, cost types, purchase invoices (the two rules, `PUR-` numbering), mark paid, due-soon, PDF-only media, tenant isolation |

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

You can also use Postman, or `curl` (`-b cookies.txt` sends the admin login cookie from § 2b):

```bash
curl -s -b cookies.txt http://localhost:5300/api/admin/tenants
curl -s -b cookies.txt -X POST http://localhost:5300/api/admin/tenants -H "content-type: application/json" -d '{"name":"TEST Alpha","email":"test-alpha@test.invalid"}'
```

## 2b. Log in as the super-admin (needed for every `/api/admin/...` route)

```bash
curl -s -c cookies.txt -X POST http://localhost:5300/api/admin/auth/login -H "content-type: application/json" -d '{"email":"admin@chantieros.local","password":"Admin@ChantierOS2026"}'
```

Expected: `201` and `{ "logged_in": true }`. The cookies `admin_access_token` (15 min) and `admin_refresh_token` are saved in `cookies.txt`. After 15 minutes the token expires and you get `401 Invalid or expired session` — log in again.

**In Swagger:** run the same login route in `/api/docs`. The browser keeps the cookie, so every later "Try it out" call works. **In Postman:** the cookie jar does the same.

## 3. Things that are true for every route

- **Platform routes (`/api/admin/...`) need an admin login.** Without the cookie you get `401 Not authenticated`. Log in first (§ 2b). The **tenant-side** routes (`/api/auth/me`, `/api/users`, `/api/invitations`, `/api/roles`, ...) are still open and have no guards yet. Do not put this on a public server.
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
| Super-admin | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` (the first line wins if a key is repeated) — used to log in at § 2b |

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

## 6. Automated tests (run these too)

```bash
yarn test          # unit tests — no database needed
yarn test:e2e      # real database — needs docker compose up -d
```

| Command | Expected | Notes |
|---|---|---|
| `yarn test` | `Tests: 334 passed`, 33 suites… all green | If the count is higher, new tests were added. A failure is a bug |
| `yarn test:e2e` | `Tests: 11 passed`, 44 tables checked | **Jest does not exit by itself** after the e2e run. Press Ctrl+C once it prints the result, or run `npx jest --config test/jest-e2e.json --forceExit` |
| `yarn lint` | `0 errors` (3 warnings in `auth.handlers.spec.ts` are known) | |
| `yarn build` | no output = ok | |

The e2e test prints a line like `Isolation checked on 44 tables; 2 had rows from 2+ tenants: TenantSubscription, User`. The number 44 grows when a table is added to the schema. If a table with a `tenant_id` is **not** protected, the test fails and names it (for example `Task.findUnique`).

The e2e test creates two tenants named `Isolation Test A/B` and deletes them at the end. If it was killed halfway, remove them by hand: `delete from tenants where name like 'Isolation Test%';`.

## 7. How to read a result

Each scenario has an **ID**, the **steps**, and the **Expected** result. Mark it:

| Mark | Meaning |
|---|---|
| ✅ | Matches the expected result exactly |
| ❌ | Different — write down the status code, the body, and what you sent |
| ⏭ | Skipped |

A scenario is only ✅ if **every** line of *Expected* is true.
