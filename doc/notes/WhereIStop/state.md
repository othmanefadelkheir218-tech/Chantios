# Where I Stop — current build state

> **Read this first in every new conversation.** It says exactly where the work stopped and what to do next.
> Update it at the end of every session. Keep it short and true.

---

## Current position

| | |
|---|---|
| **Step** | 02 — Auth & users (next). Step 01 — Platform is **DONE**, re-verified after the id-type change below |
| **File to follow** | [../Phaces/02-auth-users.md](../Phaces/02-auth-users.md) |
| **Status** | Step 01 rebuilt on integer ids and spot-checked live (lint/build/test + manual curl). The original "64/64 checks" sign-off predates this change and was not re-run item by item — see *Next action*. Step 02 not started |
| **Last updated** | 2026-10-05 |

## Next action

**Re-run the step 01 Acceptance checklist by hand before trusting it again.** The id type change (below) touched every route; `yarn lint`/`build`/`test` pass and a handful of routes were curl-checked live, but the full `doc/notes/test/*.md` scripts were not replayed end to end against the running app.

Then start step 02: read `02-auth-users.md`, then build `auth`, `users`, `invitations`, `roles`, the guards and the Prisma tenant extension (`nestjs-cls` is not installed yet — add it).

**Before anything else in step 02, lock down the step 01 routes.** Every controller in `tenants`, `admin-users`, `plans`, `subscriptions`, `audit`, `analytics`, `feedback` carries `@Public() // TODO: step 02`. Replace it with `AdminAuthGuard` + the role in each route's swagger summary (super_admin or admin staff). Do not ship to a public host before that.

The migration, the seed and the Prisma schema are finished again (regenerated for the id change) — **do not redo them**.

## What is already done

- **Docs:** finished and consistent. `doc/Schema Proposal.md` is the DDL source. The notes win if they disagree.
- **Prisma schema:** `prisma/schema.prisma` — all 52 v1 tables for steps 01–16, 27 enums. `prisma validate` passes, **zero drift** against the database.
- **Migration:** one file, `prisma/migrations/20261005130720_init/migration.sql` (1780 lines — supersedes the old `20261004211500_init`, deleted). Generated part + the same hand-written block carried over unchanged (it never referenced UUID): 34 CHECK constraints, 3 triggers, 5 partial unique indexes, 3 composite FKs, 3 views.
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

- **Every `id` is a `SERIAL`** (auto-increment integer — changed from UUID on 2026-10-05, at the user's request, see `doc/notes/entity-fields.md`), and every `updated_at` defaults to `now()`. Raw SQL inserts work without supplying either.
- **`:id` / `:tenantId` path params are validated with `ParseIntPipe`**, not `ParseUUIDPipe`. A bad id gives `400` `Validation failed (numeric string is expected)`, not a UUID-specific message.
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

- **Your `yarn start:dev` (`nest start --watch`, started earlier this session) is alive but not listening on any port** — `lsof -p <its pid> -i` returns nothing. `node dist/main` boots clean standalone (all connection checks green), so this isn't a code problem; the watch process likely crashed silently on an earlier reload (possibly an `EADDRINUSE` against a manually-started `dist/main` that was running at the same time) and webpack's watch mode doesn't always recover from that without a restart. Stop it and run `yarn start:dev` again.

- Step 02 needs `APP_URL` and `PORTAL_BASE_URL` added to `.env` / `.env.example`.
- **`POST /api/admin/tenants` creates the tenant row only.** It creates no `tenant_subscriptions` row and no first `admin` user — the notes describe that only for registration (step 02). A tenant made through this route has no subscription until step 02 decides how the super-admin path does it. Not decided, not invented.
- **Storage downgrade gate** (`subscription-plans.md`) is not built: it needs `media` (step 03). The `// TODO: step 03` sits in `set-pending-plan.handler.ts`.
- **Session revoke on suspend/ban/deactivate** is not built: it needs `refresh_tokens` logic (step 02). `// TODO: step 02` sits in `set-tenant-status.handler.ts` and `deactivate-admin-user.handler.ts`.
- The old `01-platform.md` listed `audit` as "no controller" and also listed `GET /api/admin/audit-logs`. Resolved: one read-only controller, writes through the service.

## Decisions taken during the build

- `id` and `updated_at` get database defaults, so raw SQL works. (Prisma's client-side `uuid()` alone left raw inserts failing — moot now that `id` is `SERIAL`.)
- **2026-10-05 — `plans.stripe_price_id` is now auto-managed, not admin-input**, at the user's request. `create-plan.dto.ts` no longer has a `stripe_price_id` field (sending it is now a `400`, `property stripe_price_id should not exist` — whitelist validation). Two new handlers in `src/stripe/` (not `src/subscriptions/` — see below): `CreatePlanPriceHandler` (Stripe Product + recurring monthly Price in EUR) and `ArchivePlanPriceHandler` (`active: false`, best-effort), exposed as `StripeService.createPlanPrice()` / `archivePlanPrice()`. Wired into `create-plan.handler.ts` (blocking — a Stripe failure fails the whole plan creation), `create-plan-version.handler.ts` (mints a new Price for the version, archives the parent's old one), and `deactivate-plan.handler.ts` (archives, best-effort). `plans.module.ts` now imports `StripeModule`. Verified live against the real Stripe test-mode API (not mocked): created a plan, confirmed the Price in Stripe directly (`active: true`, `unit_amount: 2999`, `currency: eur`, `recurring.interval: month`), created a version, confirmed the parent's old Price became `active: false` and the new one `active: true`, deactivated a plan, confirmed its Price archived too. 90 tests pass. **Why `src/stripe/` and not `src/subscriptions/`**: `subscriptions` already imports `plans` (for `PlansService`) — `plans` importing `subscriptions` back would be a circular module dependency. `src/stripe/` has no imports of its own, so both can depend on it safely. Decision + rationale written into `doc/notes/subscription-plans.md`.
- **2026-10-05 — tenant email verification + shared `email`/`one-time-codes` modules added**, at the user's request. New: `tenants.email_verified_at` (nullable, not required at creation) and `one_time_codes.tenant_id` (nullable, third option alongside `user_id`/`admin_user_id` — the `chk_code_one_owner` CHECK was hand-edited to `num_nonnulls(tenant_id, user_id, admin_user_id) = 1`, migration `20261005145627_one_time_codes_tenant_owner_check`). Two new shared utility modules, same shape as `audit` (service only, no controller): `src/email/` (`EmailService.send()` wrapping the existing `src/config/resend.config.ts` client — that file already existed as a boot-time connectivity check, this is the first thing that actually sends mail with it) and `src/one-time-codes/` (generic generate/verify over `one_time_codes`, reusable by any of the three `one_time_code_type`s — step 02 should call it for `password_reset` and the registration `email_verification` instead of rebuilding this). Routes: `POST /api/admin/tenants/:id/send-verification-email`, `PATCH /api/admin/tenants/:id/verify-email` (body `{ code }`). Code is 6 digits, sha256-hashed, 24h lifetime, no attempt limit (matches `doc/notes/auth-tokens.md`); sending a new code invalidates the previous one; a wrong code does not consume the row. 84 tests pass, live-curl verified including the full success path (a code was inserted directly in the DB to test it, since reading a real inbox isn't possible here). Manual test scenarios added: `doc/notes/test/01-tenants.md` TEN-18 through TEN-22. **Known gap, not built**: nothing in step 02's design yet calls `OneTimeCodesService`/`EmailService` for `password_reset` or `admin_2fa` — when step 02 is built, reuse these modules, don't recreate the code-generation logic.
- **2026-10-05 — tenant soft delete + restore added, one and bulk**, at the user's request. New column `tenants.deleted_at` (nullable, independent of `status`) via an additive migration (`20261005143039_tenant_soft_delete` — no reset, no data loss). Routes: `DELETE /api/admin/tenants/:id`, `DELETE /api/admin/tenants` (body `{ ids }`), `PATCH /api/admin/tenants/:id/restore`, `PATCH /api/admin/tenants/restore` (body `{ ids }`). Single-item handlers refuse a no-op (already deleted / not deleted) with `400`; bulk handlers skip no-ops silently and return `{ count }` — the number actually changed, which can be less than `ids.length`. `findById`/list queries now exclude soft-deleted tenants by default (`findByIdIncludingDeleted` exists for the restore handler's own lookup). **Route order matters**: `PATCH 'restore'` (bulk) is registered before `PATCH ':id'` (update) in `tenants.controller.ts` — both match a one-segment path and the literal has to win over the wildcard. Tests added in `tenants.handlers.spec.ts` (70 tests total now), doc/notes/test/01-tenants.md gained TEN-15/16/17, live-curl verified.
- **2026-10-05 — ids switched from UUID to `SERIAL` integer, project-wide, at the user's explicit request** (confirmed twice after I flagged the trade-off: this reverses the documented design in `doc/Schema Proposal.md` and `00-START-HERE.md` §6, and a sequential id is enumerable across tenants, unlike a UUID — accepted knowingly). Touched: `doc/Schema Proposal.md`, `doc/notes/entity-fields.md` (+ every other note with a type table), `00-START-HERE.md` §6, every `Phaces/*.md` step file's DTO notes, `prisma/schema.prisma`, a fresh migration (`prisma migrate reset`, run with the user's consent — all seed data lost and recreated), and the 7 built modules' controllers/services/handlers/repositories/DTOs/entities/Swagger decorators (`ParseUUIDPipe → ParseIntPipe`, `@IsUUID() → @Type(() => Number) + @IsInt()`, `ApiUuidParam → ApiIntParam`, `src/audit/helpers/audit.helper.ts`'s `asUuidOrNull → asIdOrNull`). `yarn lint`/`build`/`test` pass (62 tests) and a handful of routes were curl-checked live. The step 01 manual test scripts (`doc/notes/test/*.md`) had their UUID examples swapped for integers by hand, but were **not replayed end to end** — do that before re-trusting the "64/64" sign-off.
- Line totals use a **trigger**, not a `GENERATED` column, so Prisma does not report permanent drift.
- Plan rules (default protected, version inherits default, pending plan at `period_end`) are written in `subscription-plans.md` § "the default plan is protected".
- The first super-admin is created by the seed with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (both required, dev mode; the password is re-synced on every run).

---

## How to update this file

At the end of a session, rewrite the four rows of **Current position**, replace **Next action** with the real next step, and add anything new under **Blockers** or **Decisions taken**. If a task broke, say which command failed and what the error was.
