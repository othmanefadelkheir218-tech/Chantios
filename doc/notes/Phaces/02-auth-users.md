# Step 02 — Auth & Users  *(phase 02)*

> Depends on step 01. This step also builds the tenant isolation layer every later step relies on.

## Goal

Two separate auth systems, the 7 roles, the permission guard, and the Prisma extension that scopes every query to one company.

## Decide first

**None blocking.** Two things to settle while building, both small:

1. **Email language.** `tenants.locale` is `fr`/`en`/`ar`, and the invitation email is the first email the app sends. Decide where templates live and which locale is used. `clients` has **no** `locale` column — a client email therefore uses the tenant's locale. Write the decision into [alerts.md](../alerts.md).
2. **Two env vars are missing.** Add `APP_URL` (invitation and reset links) and `PORTAL_BASE_URL` (step 12) to `.env` and `.env.example`.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 2. Already migrated in step 01 if you wrote both together.

| Table | Purpose |
|---|---|
| `roles` | 7 rows, seeded. `SMALLINT` ids 1–7, a different column type than the auto-increment integer `id` used elsewhere |
| `users` | all tenant-side users. `email` **UNIQUE app-wide** |
| `role_permissions` | overrides only, + the `scope` column |
| `refresh_tokens` | one row per live session, hashed |
| `user_invitations` | employee invites, hashed token |
| `one_time_codes` | password reset / email verification / admin 2FA |

### `src/users/` is built here, from nothing

The test module was deleted at step 01. The real table has `tenant_id`, `email`, `role_id`, `password_hash`, `mobile_pin_hash`, `hourly_rate`, `is_active`. Copy the shape of `src/tenants/`.

## Modules to create

```
src/
├── auth/
│   ├── decorators/  auth.swagger.ts, public.decorator.ts, roles.decorator.ts,
│   │                module.decorator.ts, current-user.decorator.ts
│   ├── dto/         login.dto.ts, register-tenant.dto.ts, refresh.dto.ts,
│   │                forgot-password.dto.ts, reset-password.dto.ts,
│   │                change-password.dto.ts, mobile-login.dto.ts,
│   │                accept-invitation.dto.ts, admin-login.dto.ts, verify-2fa.dto.ts
│   ├── guards/      auth.guard.ts, admin-auth.guard.ts, tenant.guard.ts,
│   │                permission.guard.ts, subscription.guard.ts
│   ├── handlers/    login.handler.ts, admin-login.handler.ts, logout.handler.ts,
│   │                refresh.handler.ts, register-tenant.handler.ts,
│   │                forgot-password.handler.ts, reset-password.handler.ts,
│   │                change-password.handler.ts, mobile-login.handler.ts,
│   │                verify-email.handler.ts, verify-2fa.handler.ts
│   ├── helpers/     token.helper.ts, cookie.helper.ts, permission.helper.ts
│   ├── repositories/ token.repository.ts        (refresh_tokens + one_time_codes)
│   ├── auth.service.ts / auth.controller.ts / auth.module.ts
├── users/           (REWRITE — team management, profile, hourly_rate)
├── invitations/     (user_invitations: send, resend, accept, revoke)
├── roles/           (read the 7 roles; role_permissions overrides)
└── common/
    ├── cls/         tenant-context.service.ts
    └── prisma/      tenant-extension.ts        ← the isolation layer
```

## The tenant isolation layer — build this first

From [technical/build-order.md](../technical/build-order.md) § 1b. A Prisma client extension, **not** Postgres RLS.

| Operation | What the extension injects |
|---|---|
| `findMany`, `findFirst`, `count`, `aggregate` | `where: { tenant_id }` |
| `create`, `createMany` | `data: { tenant_id }` |
| `update`, `delete`, `upsert` | `tenant_id` into `where` |

### Rules that make it safe

- The raw client is wrapped **once** at startup. Nothing else may build a Prisma client.
- **Skip list — only these 8:** `tenants`, `admin_users`, `plans`, `plan_features`, `stripe_events`, `roles`, `refresh_tokens`, `one_time_codes`. That is the whole list.
- Every other table has `tenant_id`, child tables included — so the extension protects them automatically.
- `categories` and `cost_types` are the exception: `tenant_id` is nullable, so they need `WHERE tenant_id IS NULL OR tenant_id = :current` through their own dedicated method, never the generic one.
- `$queryRaw` must pass `tenant_id` explicitly — the extension cannot see inside raw SQL. The 3 views all carry `tenant_id` and must be filtered by it.
- A tenant-scoped FK must stay inside the tenant. Covered by a test.

`nestjs-cls` holds the current `tenant_id` and `user_id` per request.

## Request pipeline

```
1. AuthGuard          valid JWT from the httpOnly cookie? who is this?
2. TenantGuard        put tenant_id from the JWT into nestjs-cls
3. SubscriptionGuard  status check only — never counts resources
4. PermissionGuard    role + module + scope
5. RateLimitGuard
6. Handler
```

`SubscriptionGuard` allows `trialing`, `active`, `past_due`. Blocks `cancelled`, and any tenant that is `suspended` or `banned`. **It never counts resources** — going over an allowance is billed as overage, never blocked.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/auth/register` | `@Public()` | new company — see the transaction below |
| `POST` | `/api/auth/login` | `@Public()` | email + password → 2 httpOnly cookies |
| `POST` | `/api/auth/refresh` | `@Public()` | rotates: new row, old revoked |
| `POST` | `/api/auth/logout` | `AuthGuard` | clears cookies, sets `revoked_at` |
| `POST` | `/api/auth/forgot-password` | `@Public()` | rate-limited hard |
| `POST` | `/api/auth/reset-password` | `@Public()` | code + new password |
| `POST` | `/api/auth/change-password` | `AuthGuard` | old + new |
| `POST` | `/api/auth/verify-email` | `@Public()` | 24h code |
| `GET` | `/api/auth/me` | `AuthGuard` | user + role + resolved permissions |
| `GET` | `/api/auth/sessions` | `AuthGuard` | live `refresh_tokens` rows |
| `DELETE` | `/api/auth/sessions/:id` | `AuthGuard` | kill one device |
| `DELETE` | `/api/auth/sessions` | `AuthGuard` | kill all |
| `POST` | `/api/mobile/login` | `@Public()` | **email + PIN**, locks after 5 tries |
| `POST` | `/api/admin/auth/login` | `@Public()` | admin password → 2FA challenge |
| `POST` | `/api/admin/auth/verify-2fa` | `@Public()` | TOTP, 5 min, 3 tries |
| `POST` | `/api/admin/auth/logout` | `AdminAuthGuard` | |
| `GET` | `/api/users` | `AuthGuard` + `team:view` | the team list |
| `GET` | `/api/users/:id` | `AuthGuard` + `team:view` | |
| `PATCH` | `/api/users/:id` | `AuthGuard` + `admin` | role, `hourly_rate`, `is_active` |
| `DELETE` | `/api/users/:id` | `AuthGuard` + `admin` | `is_active = false` **and revoke all sessions** |
| `PATCH` | `/api/users/me` | `AuthGuard` | own name, phone |
| `POST` | `/api/users/me/avatar` | `AuthGuard` | needs step 03 — wire it then |
| `POST` | `/api/users/:id/pin` | `AuthGuard` + `admin` | set a worker's PIN |
| `POST` | `/api/invitations` | `AuthGuard` + `admin` | invite an employee |
| `GET` | `/api/invitations` | `AuthGuard` + `admin` | open invitations |
| `POST` | `/api/invitations/:id/resend` | `AuthGuard` + `admin` | replaces the old row |
| `DELETE` | `/api/invitations/:id` | `AuthGuard` + `admin` | revoke |
| `GET` | `/api/invitations/verify/:token` | `@Public()` | name + company, for the form |
| `POST` | `/api/invitations/accept` | `@Public()` | token + password → creates the `users` row |
| `GET` | `/api/roles` | `AuthGuard` | the 7 roles |
| `GET` | `/api/roles/permissions` | `AuthGuard` + `settings:view` | defaults + this tenant's overrides |
| `PUT` | `/api/roles/:roleId/permissions/:module` | `AuthGuard` + `admin` | upsert one override |
| `DELETE` | `/api/roles/:roleId/permissions/:module` | `AuthGuard` + `admin` | back to the code default |

## DTOs

### `register-tenant.dto.ts`
`company_name`, `email` `@IsEmail`, `password` `@MinLength(12)`, `name` (the admin's own name), optional `phone`, `locale`.

### `login.dto.ts`
`email` `@IsEmail`, `password` `@IsNotEmpty`. **No company field** — that is why `users.email` is unique app-wide.

### `mobile-login.dto.ts`
`email` `@IsEmail`, `pin` `@Length(4,6) @IsNumberString`. A PIN alone is not a credential.

### `accept-invitation.dto.ts`
`token`, `password` `@MinLength(12)`.

### `update-user.dto.ts`
`name`, `phone`, `role_id` `@IsInt @Min(1) @Max(7)`, `hourly_rate` `@IsNumberString`, `is_active` `@IsBoolean`. **Admin only** for `role_id`, `hourly_rate`, `is_active`.

### `upsert-permission.dto.ts`
`can_view`, `can_create`, `can_edit`, `can_delete` booleans, `scope` `@IsIn(['all','own'])`.

## Repository methods

```ts
// user.repository.ts
create(data, tx?): Promise<User>
findByEmail(email): Promise<User | null>      // NO tenant filter — login has no company
findById(id): Promise<User | null>
findMany(where, skip, take): Promise<[User[], number]>
update(id, data): Promise<User>
setActive(id, isActive): Promise<User>
countActiveByRole(roleId): Promise<number>    // step 14 billing
bumpFailedPin(id) / resetFailedPin(id): Promise<void>

// token.repository.ts
createRefresh(data), findRefreshByHash(hash), revokeRefresh(id),
revokeAllForUser(userId), listLiveForUser(userId), deleteExpiredOlderThan(date)
createCode(data), findLiveCode(userId, type, hash), consumeCode(id), bumpAttempts(id)

// invitation.repository.ts
create(data), findByHash(hash), findOpenByEmail(email), findMany(where, skip, take),
markAccepted(id), deleteOpenByEmail(email)

// permission.repository.ts
findOverrides(roleId): Promise<RolePermission[]>
upsert(roleId, module, data), remove(roleId, module)
```

`findByEmail` is the one query that must **not** be tenant-filtered — it runs before any tenant is known. Put it on the raw client explicitly and comment why.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `register-tenant.handler` | **One transaction: `tenants` + `users` (role `admin`) + `tenant_subscriptions`.** The subscription uses the `is_default` plan, `status = 'trialing'`, `period_end = now + 14 days`. Fails with a clear message if no default plan exists. Sends the verification email |
| `login.handler` | `is_active` true, tenant not `suspended`/`banned`, argon2id verify. Issues access (15 min) + refresh (7 d) as httpOnly cookies. Stores only the refresh **hash** |
| `refresh.handler` | **Rotation:** new row, old `revoked_at`. If an already-revoked token is presented, revoke **every** row for that user — it was stolen |
| `logout.handler` | clears both cookies, revokes that one row |
| `mobile-login.handler` | email + PIN, argon2id. `worker` role only. 5 wrong tries → lock. Resets the counter on success |
| `forgot-password.handler` | `password_reset` code, 1 h, max 5 attempts. **Same response whether the email exists or not** |
| `reset-password.handler` | consumes the code, sets the new hash, **revokes every session** |
| `create-invitation.handler` | refuses if `users.email` exists anywhere, or an open invitation exists. Re-inviting replaces the old row. Token hashed, 7 d |
| `accept-invitation.handler` | creates the `users` row **now**, not at invite time. `accepted_at` set. A used invitation never works again |
| `deactivate-user.handler` | `is_active = false` **and revoke all their refresh tokens**. History is kept |
| `set-tenant-status.handler` (step 01) | now also revokes every session of that tenant's users |

`PermissionGuard` reads the **code default** for the role, then applies an override row if one exists for that tenant + role + module. `role_permissions` stores overrides only — nothing is seeded per tenant. On `scope = 'own'` it adds `WHERE user_id = :current`.

The default matrix is a constant in `auth/helpers/permission.helper.ts`, copied from [roles-permissions.md](../roles-permissions.md). Keep the two identical.

## Security settings

| Setting | Value |
|---|---|
| Hash | argon2id only — `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`. bcrypt nowhere |
| Access token | 15 min, stateless, **never stored** |
| Refresh token | 7 days, **stored sha256-hashed** |
| Cookies | `httpOnly`, `secure` in prod, `sameSite: 'lax'` |
| `password_reset` | 1 h, 5 attempts |
| `email_verification` | 24 h |
| `admin_2fa` | 5 min, 3 attempts (otplib; the secret lives on `admin_users`) |
| Throttle | `/auth/login`, `/auth/forgot-password`, `/mobile/login` tight |

Every token and code is sha256 in the database. The raw value exists only in the cookie, the email link or the user's phone. **Look rows up by hash** — never compare values.

## Tasks

- [x] Add `APP_URL` and `PORTAL_BASE_URL` to `.env` and `.env.example`
- [x] `common/cls/` — `nestjs-cls` setup, tenant context service
- [x] `common/prisma/tenant-extension.ts` — the extension + the 8-table skip list
- [x] Wrap the Prisma client **once** at startup; nothing else constructs one
- [x] Test: tenant A cannot read tenant B's rows, for 3 different tables
- [ ] Test: `categories` / `cost_types` return shared defaults **plus** own rows — not built: no module reads these tables yet. Do it in step 05 (catalogue)
- [x] `token.helper.ts` — sign, verify, sha256, rotate
- [x] `cookie.helper.ts` — set and clear both cookies
- [x] Guards: `AuthGuard`, `AdminAuthGuard`, `TenantGuard`, `PermissionGuard`, `SubscriptionGuard`
- [x] Decorators: `@Public()`, `@Roles()`, `@Module()`, `@CurrentUser()`
- [x] `permission.helper.ts` — the default matrix + the override resolver with `scope`
- [x] `auth` module — all routes above
- [x] **Create `src/users/`** against the real table
- [x] `invitations` module + the email through Resend
- [x] `roles` module + the override endpoints
- [x] Email templates: verification, invitation, password reset (locale decision above)
- [x] Daily cron: delete expired tokens and codes older than 30 days
- [x] Go back to step 01's routes and replace the `@Public()` TODOs with `AdminAuthGuard`

## Acceptance

- [x] Register a company → 3 rows in one transaction: `tenants`, `users` (admin), `tenant_subscriptions` (`trialing`)
- [x] Register with no `is_default` plan → clear error, **nothing** written
- [x] Register twice with the same email → rejected — `409`
- [x] Login → 2 httpOnly cookies, `refresh_tokens` holds only a hash
- [x] Refresh → new row, old `revoked_at` set
- [x] Replay the revoked refresh token → **all** sessions for that user revoked — the new token is dead too
- [x] Invite an employee → email arrives; accepting creates the `users` row; the link fails the second time — invitation row + log `Email sent` checked; the real inbox was **not** checked. Accept and the second try were run with a known token
- [x] Invite an email already used at another company → refused with a clear message — both cases: existing user and open invitation elsewhere, `409`
- [x] A `worker` logs in at `/api/mobile/login` with email + PIN; 5 wrong PINs → locked — the 6th try inside one minute is stopped by the throttle (`429`) first; after the minute, the right PIN gives `403` locked
- [x] A `worker` calling a dashboard route → 403 — `403 Insufficient role`
- [ ] `scope = 'own'`: a `worker` listing tasks sees only their own — **half done**. Done and tested: the worker's `tasks` and `time_entries` resolve to `scope: own`, `PermissionGuard` puts it on the request (`permission.guard.spec.ts`: worker `own`, admin/manager `all`, a tenant override can change it, no view access gives `403`). **Not done: the `WHERE user_id = :current` in a task list** — there is no task module or route until step 08, so nothing exists to test. Do it when step 08 builds `GET /api/tasks`
- [x] Override `manager` + `invoices` + `can_view` → that tenant's manager sees invoices, **another tenant's does not** — tenant A: view `true`, tenant B: still `false`
- [x] Deactivate a user → cannot log in, sessions gone, history intact — login `401`, refresh `401`, 0 live sessions, row kept
- [x] Suspend a tenant → every user of it is locked out — the live access token gets `403`, refresh `401`, login `401`, 0 live sessions
- [x] Tenant A cannot read tenant B's data on any table — `test/tenant-isolation.e2e-spec.ts` now loops over **all 44 scoped models** in the schema (it reads the list from Prisma, so a new table is covered automatically): the SQL of `findMany`, `findFirst`, `count`, `findUnique` and `deleteMany` must carry `tenant_id = $n`; an unknown tenant sees no rows; no tenant in context throws. Cross-tenant read/update/delete is also tried on real rows (`users`, `user_invitations`, `role_permissions`). Found and fixed on the way: `findUnique` was **not** scoped. Limit: only `users` and `tenant_subscriptions` hold rows from 2+ tenants today, so for the other tables the proof is the SQL filter, not data. Tables with a nullable `tenant_id` (`categories`, `cost_types`, `audit_logs`, `notifications`) are scoped by the extension too, so shared defaults need the dedicated method (see the categories task)
- [x] `yarn lint` and `yarn build` pass
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [auth-tokens.md](../auth-tokens.md) — the 3 token tables, lifetimes, rotation
- [roles-permissions.md](../roles-permissions.md) — the 7 roles, the default matrix, `scope`
- [subscription-plans.md](../subscription-plans.md) — the trial row created at registration
- [technical/build-order.md](../technical/build-order.md) — § 1b isolation, § 2 auth, § 3 pipeline
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 2 DDL, § 12 skip list
