# Where I Stop — current build state

> **Read this first in every new conversation.** It says exactly where the work stopped and what to do next.
> Update it at the end of every session. Keep it short and true.

---

## Current position

| | |
|---|---|
| **Step** | 02 — Auth & users (next). Step 01 — Platform is **DONE** |
| **File to follow** | [../Phaces/02-auth-users.md](../Phaces/02-auth-users.md) |
| **Status** | Step 01 finished and accepted by hand (64/64 checks). Step 02 not started |
| **Last updated** | 2026-10-05 |

## Next action

Start step 02: read `02-auth-users.md`, then build `auth`, `users`, `invitations`, `roles`, the guards and the Prisma tenant extension (`nestjs-cls` is not installed yet — add it).

**Before anything else in step 02, lock down the step 01 routes.** Every controller in `tenants`, `admin-users`, `plans`, `subscriptions`, `audit`, `analytics`, `feedback` carries `@Public() // TODO: step 02`. Replace it with `AdminAuthGuard` + the role in each route's swagger summary (super_admin or admin staff). Do not ship to a public host before that.

The migration, the seed and the Prisma schema are finished — **do not redo them**.

## What is already done

- **Docs:** finished and consistent. `doc/Schema Proposal.md` is the DDL source. The notes win if they disagree.
- **Prisma schema:** `prisma/schema.prisma` — all 52 v1 tables for steps 01–16, 27 enums. `prisma validate` passes, **zero drift** against the database.
- **Migration:** one file, `prisma/migrations/20261004211500_init/migration.sql` (1785 lines). Generated part + a hand-written block at the end holding what Prisma cannot express: 34 CHECK constraints, 3 triggers, 5 partial unique indexes, 3 composite FKs, 3 views.
- **Seed:** split in `prisma/seeds/`, each file idempotent and runnable alone — `data.seed.ts` (7 roles, 3 cost types, 10 categories, `tenant_id = NULL`), `admin.seed.ts` (the super-admin, from `.env`), `tenants.seed.ts` (DEMO only: plan "Demo Starter" + 2 tenants + users), `reset.seed.ts` (all three, in order). Real plans are **never** seeded.
- **Verified against the live database:** a cross-tenant quote line is rejected, a `professional` client without a VAT number is rejected, `end_date < start_date` is rejected, a consumption with no project is rejected, a purchase tied to a project is rejected, a material bill carrying a project is rejected by the trigger, a notification with no recipient is rejected, a second default plan is rejected, and the line total is computed by the trigger (2.5 × 10.10 = 25.25). A platform alert with `tenant_id NULL` works. The 3 views run and `margin_pct` is `NULL` (no error) with no accepted quote.
- **NestJS app, step 01 modules** (all on `/api/admin/...`, 23 routes, Swagger tags for each): `tenants`, `admin-users`, `plans`, `subscriptions`, `audit`, `analytics`, `feedback`. Shared code in `src/common/` (pagination, snake_case interceptor, `@Actor()`, `@Public()`, password hash). `yarn lint`, `yarn build` and `yarn test` (57 tests) pass.
- **Old test module `src/users/` and `test/users.e2e-spec.ts` are deleted** (user decision). Step 02 builds `src/users/` fresh.
- **Manual test scenarios:** `doc/notes/test/` — start with `00-how-to-test.md`, then one file per module (tenants, admin-users, plans, subscriptions, audit/analytics/feedback). Every message and command in them was checked against the live app. Audit values are stored in snake_case, and the secret filter no longer hides `postal_code`.
- **Acceptance run on the live app:** every item of the step 01 Acceptance section passed, plus the analytics queue end to end (job on BullMQ → worker → `analytics_events`).

## Commands

```bash
docker compose up -d        # postgres :5440, redis :6390
yarn prisma:studio          # browse the tables — http://localhost:51212
yarn seed:data              # roles, cost types, categories (safe, idempotent)
yarn seed:admin             # the super-admin only — email + password from .env, re-synced every run
yarn seed:tenants           # DEMO plan + 2 tenants + users (dev only; needs seed:data first)
yarn seed:reset             # DROP everything, re-apply the migration, run all three
```

Dev logins — super-admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` (now `admin@chantieros.local` / `Admin@ChantierOS2026`). Demo users share `Demo@12345678`, worker PIN `1234`: `admin@dupont.test` (one user per role: admin, manager, supervisor, leader, worker, sales, accountant) and `admin@verhelst.test`.

`prisma migrate reset` asks for explicit user consent when an AI agent runs it. Tell the user before running it.

## Things to know before coding

- **Every `id` has a database default** (`gen_random_uuid()`), and every `updated_at` defaults to `now()`. Raw SQL inserts work without supplying them.
- **Line totals** (`quote_lines.total_excl_vat`, `invoice_lines.total_excl_vat`) are set by a trigger. Never compute them in the app; never send them.
- **Views are not Prisma models.** Read `material_stock_live`, `invoice_balance`, `project_margin_live` with `$queryRaw` and **pass `tenant_id` by hand** — the tenant extension cannot see inside raw SQL.
- **The API speaks snake_case** (`legal_name`, `base_price`). Prisma speaks camelCase. Each controller has `SnakeCaseInterceptor`; a handler turns a DTO into Prisma data with `toCamelKeys()`. Details in `00-START-HERE.md` § 6.
- **Money is a string in and out.** A response that carries a Prisma `Decimal` serialises it as a string already.
- **Swagger uses the `@nestjs/swagger` plugin** (`nest-cli.json`): `*.dto.ts` and `*.entity.ts` properties are documented automatically, with their doc comments.
- **Posting an analytics event:** inject `AnalyticsService` and call `track({ tenantId, userId, eventName, payload })`. It returns at once and never throws.
- **Step 14 / renewal job:** call `SubscriptionsService.snapshotUsage({ tenantId, periodStart, periodEnd, usage })`. **Step 02 registration:** call `SubscriptionsService.create()` and `PlansService.findDefault()`.
- **Skip list for the tenant extension** (step 02): only `tenants`, `admin_users`, `plans`, `plan_features`, `stripe_events`, `roles`, `refresh_tokens`, `one_time_codes`.
- Docker project name: containers were once created under project `app`; they are now under `chantieros`. Volumes `app_*` are unused leftovers.

## Blockers

- Step 02 needs `APP_URL` and `PORTAL_BASE_URL` added to `.env` / `.env.example`.
- **`POST /api/admin/tenants` creates the tenant row only.** It creates no `tenant_subscriptions` row and no first `admin` user — the notes describe that only for registration (step 02). A tenant made through this route has no subscription until step 02 decides how the super-admin path does it. Not decided, not invented.
- **Storage downgrade gate** (`subscription-plans.md`) is not built: it needs `media` (step 03). The `// TODO: step 03` sits in `set-pending-plan.handler.ts`.
- **Session revoke on suspend/ban/deactivate** is not built: it needs `refresh_tokens` logic (step 02). `// TODO: step 02` sits in `set-tenant-status.handler.ts` and `deactivate-admin-user.handler.ts`.
- The old `01-platform.md` listed `audit` as "no controller" and also listed `GET /api/admin/audit-logs`. Resolved: one read-only controller, writes through the service.

## Decisions taken during the build

- `id` and `updated_at` get database defaults, so raw SQL works. (Prisma's client-side `uuid()` alone left raw inserts failing.)
- Line totals use a **trigger**, not a `GENERATED` column, so Prisma does not report permanent drift.
- Plan rules (default protected, version inherits default, pending plan at `period_end`) are written in `subscription-plans.md` § "the default plan is protected".
- The first super-admin is created by the seed with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (both required, dev mode; the password is re-synced on every run).

---

## How to update this file

At the end of a session, rewrite the four rows of **Current position**, replace **Next action** with the real next step, and add anything new under **Blockers** or **Decisions taken**. If a task broke, say which command failed and what the error was.
