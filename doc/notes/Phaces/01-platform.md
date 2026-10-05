# Step 01 — Platform  *(phase 01)*

> First step. Everything else depends on `tenants` and `admin_users`.
> Read [00-START-HERE.md](00-START-HERE.md) first.

## Goal

Create the platform layer: companies (`tenants`), ChantierOS staff (`admin_users`), the plan catalogue, the subscription record, and the audit/analytics tables. No tenant-side user exists yet.

## Decide first

**None.** This step is fully specified.

One operational rule to remember: **plans are never seeded.** The super-admin creates them as data, and one must carry `is_default = true` before step 02 can register a company.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 1.

| Table | Purpose |
|---|---|
| `tenants` | one row per company |
| `admin_users` | ChantierOS staff — separate from `users`, never mixed |
| `plans` | plan catalogue, admin-created, immutable once in use |
| `plan_features` | one row per dimension per plan: `limit_value` + `overage_rate` |
| `tenant_subscriptions` | one row per tenant. **There is no `subscriptions` table** |
| `billing_usage_snapshots` | usage per dimension per cycle, written at renewal |
| `audit_logs` | every sensitive platform action |
| `analytics_events` | product analytics, append-only |
| `feedback` | tenant feature requests |
| `support_tickets` | created here, used at step 16 |

`stripe_events` belongs to step 14, not here. This step owns the plan catalogue and the subscription record; step 14 owns only the Stripe integration.

### Migration reset first

The existing migration was a Prisma connectivity test and does not match the real schema.

```bash
docker compose up -d
yarn prisma migrate reset
rm -rf prisma/migrations/20260925213736_init_users
```

Write `prisma/schema.prisma` for **steps 01 and 02 together**, then one `init` migration. Doing 01 alone leaves `users` missing, and three tables here reference it.

### Forward references

`analytics_events.user_id`, `feedback.submitted_by` and `support_tickets.opened_by` point at `users`, which is step 02. In Prisma this is just a relation — declare it and let Prisma order the SQL. See [Schema Proposal.md](../../Schema%20Proposal.md) § 11.

## Modules to create

```
src/
├── tenants/
│   ├── decorators/tenants.swagger.ts
│   ├── dto/create-tenant.dto.ts, update-tenant.dto.ts, find-tenants-query.dto.ts,
│   │       suspend-tenant.dto.ts
│   ├── entities/tenant.entity.ts
│   ├── handlers/create-tenant.handler.ts, find-tenants.handler.ts, find-tenant.handler.ts,
│   │            update-tenant.handler.ts, set-tenant-status.handler.ts
│   ├── repositories/tenant.repository.ts
│   ├── tenants.service.ts
│   ├── tenants.controller.ts
│   └── tenants.module.ts
├── admin-users/        (same shape — CRUD, internal only)
├── plans/              (plans + plan_features in ONE module: one domain)
├── subscriptions/      (tenant_subscriptions + billing_usage_snapshots)
├── audit/              (writer service + @AuditLog decorator, no public routes)
├── analytics/          (event emitter + list endpoint)
├── feedback/
├── one-time-codes/     (generate/verify `one_time_codes` rows — no public routes, every type reuses it)
└── email/              (EmailService.send() wrapping Resend — no public routes)
```

`src/stripe/` already exists (webhook receiver, scaffolded ahead of step 14) and gained two handlers 2026-10-05: `handlers/create-plan-price.handler.ts`, `handlers/archive-plan-price.handler.ts`, exposed as `StripeService.createPlanPrice()` / `archivePlanPrice()`. `plans` calls them to manage `stripe_price_id` — placed here rather than in `subscriptions` because `subscriptions` already imports `plans`, and `plans` importing `subscriptions` back would be a circular module dependency. `src/stripe/` has no imports of its own, so both `plans` and `subscriptions` can depend on it safely.

`one-time-codes` and `email` are shared utility modules, same shape as `audit`: a service other modules call, no controller. Added 2026-10-05 for tenant email verification; step 02 reuses both for `password_reset` and the registration `email_verification` flow instead of rebuilding them.

`plans` and `plan_features` are one business domain — one module, one repository. Do not split them.

`audit` has one read-only controller (`GET /api/admin/audit-logs`). Writing goes through the service other modules call, plus the `@AuditLog(action, entityType)` decorator and its interceptor.

## Routes

All platform-only. Guards: `AdminAuthGuard` arrives in step 02 — until then mark them `@Public()` with a `// TODO: step 02` comment and lock them down at the end of step 02. Do not ship this step to any public host.

| Method | Path | Who |
|---|---|---|
| `POST` | `/api/admin/tenants` | super_admin |
| `GET` | `/api/admin/tenants` | admin staff |
| `GET` | `/api/admin/tenants/:id` | admin staff |
| `PATCH` | `/api/admin/tenants/:id` | super_admin |
| `PATCH` | `/api/admin/tenants/:id/status` | super_admin — `active` / `suspended` / `banned` |
| `DELETE` | `/api/admin/tenants/:id` | super_admin — soft delete, sets `deleted_at` |
| `DELETE` | `/api/admin/tenants` | super_admin — bulk soft delete, body `{ ids: number[] }` |
| `PATCH` | `/api/admin/tenants/:id/restore` | super_admin — clears `deleted_at` |
| `PATCH` | `/api/admin/tenants/restore` | super_admin — bulk restore, body `{ ids: number[] }` |
| `POST` | `/api/admin/tenants/:id/send-verification-email` | super_admin — emails a 6-digit code |
| `PATCH` | `/api/admin/tenants/:id/verify-email` | super_admin — body `{ code: string }`, sets `email_verified_at` |
| `POST` | `/api/admin/admin-users` | super_admin |
| `GET` | `/api/admin/admin-users` | super_admin |
| `PATCH` | `/api/admin/admin-users/:id` | super_admin |
| `DELETE` | `/api/admin/admin-users/:id` | super_admin — sets `is_active = false` |
| `POST` | `/api/admin/plans` | super_admin |
| `GET` | `/api/admin/plans` | admin staff |
| `GET` | `/api/admin/plans/:id` | admin staff |
| `PATCH` | `/api/admin/plans/:id/deactivate` | super_admin |
| `PATCH` | `/api/admin/plans/:id/default` | super_admin — moves `is_default` |
| `POST` | `/api/admin/plans/:id/version` | super_admin — new version, `parent_plan_id` set |
| `GET` | `/api/admin/subscriptions` | admin staff |
| `GET` | `/api/admin/subscriptions/:tenantId` | admin staff |
| `PATCH` | `/api/admin/subscriptions/:tenantId/plan` | super_admin — sets `pending_plan_id` |
| `GET` | `/api/admin/subscriptions/:tenantId/usage` | admin staff — `billing_usage_snapshots` |
| `GET` | `/api/admin/audit-logs` | super_admin |
| `GET` | `/api/admin/analytics` | admin staff |
| `GET` | `/api/admin/feedback` | admin staff |
| `PATCH` | `/api/admin/feedback/:id/status` | admin staff |

Tenant-side feedback submission (`POST /api/feedback`) waits for step 02 — it needs a logged-in `users` row.

## DTOs

### `create-tenant.dto.ts`
`name` required. `email` required, `@IsEmail`, unique. `legal_name`, `vat_number`, `registration_number`, `phone`, address fields, `country` `@Length(2,2)` all optional. `default_vat_rate` `@IsNumberString`, default `21.00`. `default_payment_days` `@IsInt @Min(0)`, default `30`. `locale` `@IsIn(['fr','en','ar'])`, default `fr`. `currency` default `EUR`. `timezone` default `Europe/Brussels`. `end_of_day_reminder_time` default `18:00`.

### `set-tenant-status.dto.ts`
`status` `@IsIn(['active','suspended','banned'])`. `reason` optional string — goes to `audit_logs`.

### `tenant-ids.dto.ts`
`ids` — array of integers, `@ArrayMinSize(1)`, `@IsInt({ each: true })`. Body shape for the two bulk routes (`DELETE /tenants`, `PATCH /tenants/restore`).

### `verify-tenant-email.dto.ts`
`code` required, `@IsNumberString()`, `@Length(6, 6)`.

### `create-plan.dto.ts`
`name` required. `base_price` `@IsNumberString`. `features` — array of `{ feature_key, limit_value, overage_rate }`, `feature_key` `@IsIn` the 6 keys: `max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb`, `retention_days`. **All 6 are required, no more, no fewer** — enforced in `plan.helper.ts`, not the DTO (same place as the duplicate-key check). `overage_rate: "0"` means unlimited for that dimension at no extra cost. **No `stripe_price_id` field** — see `subscription-plans.md` § "stripe_price_id is managed by the app".

### `create-admin-user.dto.ts`
`email` `@IsEmail` unique. `name` required. `password` `@MinLength(12)`. `role` `@IsIn(['super_admin','staff'])`.

Money is a **string** in and out. Never `number`.

## Repository methods

```ts
// tenant.repository.ts
create(data): Promise<Tenant>
findMany(where, skip, take): Promise<[Tenant[], number]>
findById(id): Promise<Tenant | null>
findByEmail(email): Promise<Tenant | null>
update(id, data): Promise<Tenant>
setStatus(id, status): Promise<Tenant>
softDelete(id): Promise<Tenant>              // sets deleted_at = now()
softDeleteMany(ids): Promise<number>         // count affected, skips already-deleted rows
restore(id): Promise<Tenant>                 // clears deleted_at
restoreMany(ids): Promise<number>            // count affected, skips rows not deleted
setEmailVerified(id): Promise<Tenant>        // sets email_verified_at = now()

// one-time-code.repository.ts
create(data): Promise<OneTimeCode>
findActive(type, scope): Promise<OneTimeCode | null>  // unconsumed, unexpired, latest first
consumePriorActive(type, scope): Promise<void>        // invalidates any still-active code before a new one is generated
incrementAttempt(id): Promise<void>
markConsumed(id): Promise<void>

// plan.repository.ts
create(data, features): Promise<Plan>        // one transaction
findMany(where, skip, take): Promise<[Plan[], number]>
findById(id): Promise<Plan | null>
findDefault(): Promise<Plan | null>          // is_default = true
deactivate(id): Promise<Plan>
setDefault(id): Promise<Plan>                // clears the old default in the same tx
createVersion(parentId, data, features): Promise<Plan>

// subscription.repository.ts
create(data): Promise<TenantSubscription>    // called by step 02 registration
findByTenant(tenantId): Promise<TenantSubscription | null>
findMany(where, skip, take)
setPendingPlan(tenantId, planId, effectiveAt)
snapshotUsage(rows): Promise<number>

// audit.repository.ts
write(entry): Promise<void>
findMany(where, skip, take)
```

`setDefault` must clear the previous default **in the same transaction** — the partial unique index `idx_plans_one_default` rejects two.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-tenant.handler` | `email` unique app-wide. Writes `audit_logs` |
| `set-tenant-status.handler` | `suspended`/`banned` must also revoke sessions — the call is added in step 02. Writes `audit_logs` with old and new value |
| `soft-delete-tenant.handler` / `restore-tenant.handler` | refuses if the tenant is already in the target state (`404`/`409`-style refusal, not a silent no-op). Writes `audit_logs` with old and new `deleted_at` |
| `soft-delete-tenants.handler` / `restore-tenants.handler` | bulk: rows already in the target state are skipped, not refused — returns the count actually changed. One `audit_logs` entry via `@AuditLog`, not per-row |
| `send-tenant-verification-email.handler` | refuses if already verified. Generates a code via `OneTimeCodesService`, emails it via `EmailService` — does **not** write `audit_logs` (no state changed yet, only an email sent) |
| `verify-tenant-email.handler` | refuses if already verified, or if the code is wrong/expired/already used. Sets `email_verified_at`, writes `audit_logs` with old (`null`) and new value |
| `create-plan.handler` | `plans` + `plan_features` in one transaction. A new plan is never `is_default` unless asked. Calls `StripeService.createPlanPrice()` first — a Stripe failure fails the whole creation, a plan with no real Price can never be billed |
| `set-default-plan.handler` | clears the old default first, same transaction |
| `create-plan-version.handler` | never edits a plan in use. Deactivates the old row, creates a new one with `parent_plan_id`. Existing tenants keep the old `plan_id`. Mints a new Stripe Price for the new row (blocking — see above) and archives the parent's old one (best-effort — see below) |
| `deactivate-plan.handler` | refuses if it is the only `is_default` plan — step 02 registration would break. Calls `StripeService.archivePlanPrice()` after — **best-effort**, logged on failure, never blocks the deactivation |
| `set-pending-plan.handler` | writes `pending_plan_id` + `pending_plan_effective_at`. Never changes `plan_id` now |
| `snapshot-usage.handler` | copies `limit_value` and `overage_rate` into the snapshot so past invoices never shift |

`deactivate-plan` refusing the last default plan is the one non-obvious guard here. Without it a later signup fails with a confusing error.

## Tasks

- [x] `docker compose up -d`, confirm Postgres and Redis are up
- [x] `yarn prisma migrate reset`, delete `prisma/migrations/20260925213736_init_users`
- [x] Write `prisma/schema.prisma` — all step 01 **and** step 02 tables, plus every enum
- [x] `yarn prisma migrate dev --name init` — one migration
- [x] Seed file: 7 `roles`, 3 `cost_types` (`tenant_id = NULL`), default `categories` (`tenant_id = NULL`)
- [x] Raw SQL in the migration for the 3 views — or defer to the step that needs each one
- [x] `tenants` module
- [x] `tenants` soft delete / restore, one + bulk (added 2026-10-05, after step 01 was otherwise done)
- [x] `one-time-codes` module — generate/verify, generic across every `one_time_code_type` (added 2026-10-05)
- [x] `email` module — `EmailService.send()` wrapping the existing `src/config/resend.config.ts` client (added 2026-10-05)
- [x] `tenants` email verification: send code + verify code (added 2026-10-05)
- [x] `plans` auto-manages `stripe_price_id` via `src/stripe/` handlers — create/version mint a Price, deactivate archives it (added 2026-10-05)
- [x] `admin-users` module
- [x] `plans` module (plans + plan_features)
- [x] `subscriptions` module (tenant_subscriptions + billing_usage_snapshots)
- [x] `audit` module — service, `@AuditLog(action)` decorator, interceptor
- [x] `analytics` module — fire-and-forget emitter through BullMQ, never blocking
- [x] `feedback` module — admin side only
- [x] Register all modules in `app.module.ts`
- [x] Swagger tags per controller, `@ApiProperty` on every DTO

The Prisma client extension for `tenant_id` is **not** built here — no table in this step is tenant-scoped in the way it needs. It belongs to step 02, where `users` arrives. See [technical/build-order.md](../technical/build-order.md) § 1b.

## Acceptance

- [x] `yarn prisma migrate dev` runs clean from an empty database
- [x] Seed inserts 7 roles, 3 cost types, the default categories
- [x] Create a tenant → row exists, `audit_logs` has one entry
- [x] Creating a second tenant with the same email → rejected
- [x] Create a plan with 6 `plan_features` → all 6 rows written in one transaction
- [x] Mark plan B default while plan A was default → only B has `is_default = true`
- [x] Try to deactivate the only default plan → refused with a clear message
- [x] Create a plan version → old row `is_active = false`, new row has `parent_plan_id`
- [x] Create a plan → `stripe_price_id` is a real Stripe Price id, not something the caller sent (the field is no longer accepted in the body)
- [x] Create a plan version → the parent's Stripe Price is archived, the new version has a different, active Stripe Price
- [x] Deactivate a plan → its Stripe Price is archived (check in the Stripe dashboard/API, `active: false`)
- [x] Suspend a tenant → status changes, `audit_logs` records old and new value
- [x] Soft delete a tenant → `deleted_at` set, it disappears from `GET /tenants` and `GET /tenants/:id` (`404`), `status` unchanged
- [x] Restore it → `deleted_at` cleared, visible again
- [x] Bulk soft delete 2 tenants (one already deleted) → count returned is 1, not 2
- [x] Soft delete the same tenant twice → second call refused, not a silent `200`
- [x] Send a verification code, verify with the right code → `200`, `email_verified_at` set
- [x] Verify with a wrong code → `400`, code still usable (attempt counted, not consumed)
- [x] Verify with the right code twice → second call `400` (code already consumed)
- [x] Send a new code → the previous unconsumed code stops working
- [x] Send/verify on an already-verified tenant → `400`
- [x] `/api/docs` shows tenants, admin-users, plans, subscriptions, analytics, feedback
- [x] `yarn lint` and `yarn build` pass
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [subscription-plans.md](../subscription-plans.md) — plans, versioning, overage, the trial row
- [entity-fields.md](../entity-fields.md) — `tenants` field meanings
- [technical/build-order.md](../technical/build-order.md) — § 1 migration rules, § 3 guards
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 1 DDL, § 11 deferred FKs, § 13 seed
