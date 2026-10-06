# Tests — Auth, Users, Invitations, Roles

> Routes: `/api/auth`, `/api/mobile`, `/api/admin/auth`, `/api/users`, `/api/invitations`, `/api/roles`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [auth-tokens.md](../auth-tokens.md), [roles-permissions.md](../roles-permissions.md).

## Before you start — all guards are attached

- **Platform:** `AdminAuthGuard` is on every `/api/admin/...` route and on admin logout (§ 8). Needs the admin cookie.
- **Tenant side:** `AuthGuard` + `TenantGuard` + `SubscriptionGuard` + `PermissionGuard` are on `users`, `invitations` (except verify/accept) and `roles`. `/auth/me`, `/auth/sessions` and `/auth/logout` use `AuthGuard` + `TenantGuard`.
- **Public:** register, login, refresh, forgot/reset-password, verify-email, mobile login, invitation verify/accept.
- **Log in first** for any tenant-side route. Use `curl -c jar.txt` on `POST /api/auth/login`, then `-b jar.txt`. Demo logins (password `Demo@12345678`): `admin@dupont.test`, `manager@dupont.test`, `worker@dupont.test`, `admin@verhelst.test`.
- Without a cookie you get `401`. With the wrong role you get `403 Insufficient role`. After the tenant is suspended you get `403 This company is suspended or banned`.
- Routes in §§ 5–7 that earlier said "500, no actor" now work with a login. The old note is gone.

## Start everything

Same as [00-how-to-test.md](00-how-to-test.md), plus: a default plan must exist (`yarn seed:tenants` creates one, or use an existing one from `yarn prisma:studio`) — registration refuses to work otherwise.

---

## 1. Register

### AUTH-01 — Register a new company

`POST /api/auth/register`

```json
{ "company_name": "TEST Register Co", "email": "test-owner@test.invalid", "password": "SuperSecret123", "name": "Test Owner", "locale": "en" }
```

**Expected**
- Status `201`. Body: `{ tenant_id, user: {...} }`, the user has `role_id: 1` (admin), no `password_hash` in the response.
- `tenant_subscriptions` has one row for this tenant: `status = trialing`, `period_end` = `period_start + 14 days`, `plan_id` = the plan with `is_default = true`.
- `one_time_codes` has one `email_verification` row for this user. An email was sent (check the Resend dashboard, or the app log line `Email sent to ...`).
- `audit_logs` has one `create` / `tenant` entry.

### AUTH-02 — Register twice with the same email is refused

Send AUTH-01 again.

**Expected**
- Status `409`. No new tenant, no new user (check `GET /api/admin/tenants` — still one `TEST Register Co`).

### AUTH-03 — Register with no default plan is refused

Temporarily set every plan's `is_default` to `false` (`yarn prisma:studio`), then send AUTH-01 with a different email.

**Expected**
- Status `400`, a clear message about no default plan.
- **Nothing written**: no tenant, no user, no subscription row at all (the whole thing is one transaction).
- Restore a default plan afterwards.

---

## 2. Login, refresh, logout, sessions

### AUTH-04 — Login

`POST /api/auth/login`, body `{ "email": "test-owner@test.invalid", "password": "SuperSecret123" }`.

**Expected**
- Status `201`. Two `Set-Cookie` headers: `access_token` (`Max-Age=900`) and `refresh_token` (`Max-Age=604800`), both `HttpOnly; SameSite=Lax`.
- Body is the user (no password hash).
- `refresh_tokens` has one new row for this user, `revoked_at` null.

### AUTH-05 — Wrong password

Same body, wrong password.

**Expected**: status `401`, message `Invalid credentials` — same message as AUTH-06/07, on purpose.

### AUTH-06 — Deactivated user / suspended tenant

Set `users.is_active = false` for this user (or `tenants.status = suspended`), retry AUTH-04.

**Expected**: status `401`, same `Invalid credentials` message. Restore the row afterwards.

### AUTH-07 — Refresh rotates the session

`POST /api/auth/refresh` with the cookies from AUTH-04.

**Expected**
- Status `201`. New cookies issued (different token values).
- The AUTH-04 `refresh_tokens` row now has `revoked_at` set. A new row exists, `revoked_at` null.

### AUTH-08 — Replaying a revoked refresh token revokes every session

Log in twice (two sessions), refresh session 1 (revokes its old row), then send the **original** (now-revoked) refresh cookie from session 1 again to `/api/auth/refresh`.

**Expected**
- Status `401`.
- **Every** `refresh_tokens` row for this user is now revoked, including session 2's — confirms the theft-detection rule.

### AUTH-09 — Logout

`POST /api/auth/logout` with a live refresh cookie.

**Expected**: status `201`, `{ logged_out: true }`, both cookies cleared, that one `refresh_tokens` row revoked. Other live sessions untouched.

---

## 3. Forgot / reset password, verify email

### AUTH-10 — Forgot password: same response either way

`POST /api/auth/forgot-password` with the test user's email, then again with `nobody@test.invalid`.

**Expected**: both `201`, both `{ sent: true }`. Only the first creates a `one_time_codes` row (`password_reset`) and sends an email.

### AUTH-11 — Reset password with the wrong code

`POST /api/auth/reset-password`, body `{ email, code: "000000", password: "NewPassword123" }`.

**Expected**: status `400`, invalid/expired code. Old password still works.

### AUTH-12 — Reset password with the correct code

Same body, the real code (from the email, or — in dev, no real inbox — overwrite `one_time_codes.code_hash` with `sha256("123456")` and send `"123456"`).

**Expected**
- Status `201`, `{ reset: true }`.
- Login with the **old** password now fails (`401`); login with the **new** password succeeds.
- **Every** `refresh_tokens` row for this user is revoked.

### AUTH-13 — Verify email

`POST /api/auth/verify-email`, body `{ email, code }` (the `email_verification` code from registration, same dev trick as AUTH-12 if needed).

**Expected**: wrong code → `400`. Correct code → `201`, `{ verified: true }`, `users.email_verified_at` set.

---

## 4. Mobile login (worker)

Needs a `worker` (`role_id = 5`) with `mobile_pin_hash` set — go through AUTH-14/invitation flow below first, or set one directly for a test.

### AUTH-14 — Wrong PIN, then correct PIN

`POST /api/mobile/login`, body `{ email, pin: "0000" }` (wrong), then `{ email, pin: "1234" }` (correct, matching the hash you set).

**Expected**: wrong → `401`, `failed_pin_count` incremented. Correct → `201`, cookies set, `failed_pin_count` reset to `0`.

### AUTH-15 — 5 wrong PINs locks the account

Send 5 wrong PINs (mind the throttle: `@Throttle` allows 5 `/mobile/login` calls per minute — space them out if testing by hand, or set `failed_pin_count = 4` directly then send one more).

**Expected**: the 5th wrong attempt still `401`. Any attempt after that — **even the correct PIN** — now returns `403`, `Locked after too many wrong PINs — contact your admin`. An admin must reset it (`POST /api/users/:id/pin`, once guards are attached — right now this route needs an actor, see the note at the top).

### AUTH-16 — A non-worker role cannot use mobile login

Try mobile login with the test tenant's **admin** user's email/a made-up PIN.

**Expected**: `401`, same generic message (never reveal the role).

---

## 5. Invitations

### INV-01 — Verify an invitation link

Needs an open invitation row (create one once guards are attached, or insert one directly for now — see the note at the top). `GET /api/invitations/verify/:token` with the raw token.

**Expected**: `200`, `{ name, email, company }`. An unknown/expired/accepted token → `400`.

### INV-02 — Accept an invitation

`POST /api/invitations/accept`, body `{ token, password: "WorkerPass123" }`.

**Expected**
- Status `201`, `{ accepted: true, user_id }`.
- A new `users` row exists, on the invitation's `tenant_id` and `role_id`, with a hashed password.
- `user_invitations.accepted_at` is now set.

### INV-03 — A used invitation never works again

Send INV-02 again with the same token.

**Expected**: `400`, invalid/expired — the same message as a never-existed token (don't reveal which).

### INV-04 — Invite an email already used anywhere

Once guards are attached: `POST /api/invitations` with an email that already belongs to a `users` row (any tenant).

**Expected**: `409`, clear message. No row written.

### INV-05 — Invite an email already invited at another company

`POST /api/invitations` with an email that has an **open** invitation at a different tenant.

**Expected**: `409`. The other tenant's invitation is untouched.

### INV-06 — Re-inviting the same email at the same company replaces the row

Invite the same email twice from the same tenant.

**Expected**: `201` both times, but `user_invitations` still has exactly **one** row for that email — the second call deleted the first.

---

## 6. Users (team management)

All need an authenticated admin actor — see the note at the top for the current limitation.

### USR-01 — Admin updates a team member

`PATCH /api/users/:id`, body `{ "role_id": 2, "hourly_rate": "22.50" }`.

**Expected**: `200`, both fields updated, `audit_logs` gets one `update` / `user` entry with old + new values.

### USR-02 — Deactivate a user revokes every session

`DELETE /api/users/:id` on a user with live sessions.

**Expected**: `is_active = false`, every `refresh_tokens` row for that user revoked, history (the row itself) kept.

### USR-03 — Set a worker's PIN

`POST /api/users/:id/pin`, body `{ "pin": "4321" }`, on a `worker`.

**Expected**: `200`, `mobile_pin_hash` updated (argon2id), `failed_pin_count` reset to `0`. The same call on a non-worker → `400`.

### USR-04 — A user updates their own profile

`PATCH /api/users/me`, body `{ "name": "New Name" }`.

**Expected**: `200`, only `name`/`phone` change — `role_id`/`hourly_rate`/`is_active` are not accepted on this route (not in its DTO).

---

## 7. Roles & permissions

### ROLE-01 — List the 7 roles

`GET /api/roles`.

**Expected**: `200`, 7 rows, ids 1–7, matching [roles-permissions.md](../roles-permissions.md).

### ROLE-02 — Resolved permissions, no overrides yet

`GET /api/roles/permissions`.

**Expected**: `200`, 7 × 16 = 112 rows. Spot check: `admin`/`settings` is full; `worker`/`projects` is all-false; `worker`/`tasks` is all-true with `scope: "own"`.

### ROLE-03 — Override a permission

`PUT /api/roles/2/permissions/invoices`, body `{ "can_view": true, "can_create": false, "can_edit": false, "can_delete": false, "scope": "all" }` (manager has no invoices access by default).

**Expected**: `200`. `GET /api/roles/permissions` now shows `manager`/`invoices` as `can_view: true` for **this tenant only** — another tenant's manager is unaffected (the override row carries `tenant_id`).

### ROLE-04 — Remove an override

`DELETE /api/roles/2/permissions/invoices`.

**Expected**: `200`, `{ removed: true }`. `GET /api/roles/permissions` shows `manager`/`invoices` back to the code default (no access).

---

## 8. Admin auth

### ADMIN-AUTH-01 — Admin login, no 2FA set up

`POST /api/admin/auth/login` with the seed super-admin's credentials.

**Expected**: `201`, `{ logged_in: true }`, `admin_access_token`/`admin_refresh_token` cookies set directly — no 2FA challenge, because `admin_users.totp_secret` is `null` and there is no enrollment route yet this step.

### ADMIN-AUTH-02 — Admin logout

`POST /api/admin/auth/logout` with the cookies from ADMIN-AUTH-01.

**Expected**: `201`, cookies cleared, that session's `refresh_tokens` row revoked.

### ADMIN-AUTH-03 — Platform routes refuse a caller with no cookie

With **no** cookie, call each of these:
`GET /api/admin/tenants`, `/admin/admin-users`, `/admin/audit-logs`, `/admin/plans`, `/admin/subscriptions`, `/admin/feedback`, and `POST /api/admin/auth/logout`.

**Expected**: every one answers `401` `Not authenticated`. Nothing is returned or written.

### ADMIN-AUTH-04 — Platform routes work with the cookie

Log in (ADMIN-AUTH-01), then call the same 6 `GET` routes with the cookie.

**Expected**: every one answers `200`. A garbage cookie value (`admin_access_token=abc`) gives `401` `Invalid or expired session`.

### ADMIN-AUTH-05 — A `staff` admin cannot use `super_admin` routes

1. As super-admin: create a staff admin with ADM-01 in [02-admin-users.md](02-admin-users.md) (`test-staff@test.invalid`, role `staff`).
2. Log in as that admin (use a new cookie jar).
3. Call `GET /api/admin/tenants`, then `GET /api/admin/admin-users`, then `GET /api/admin/audit-logs`.

**Expected**
- `/admin/tenants` → `200` (any admin role).
- `/admin/admin-users` and `/admin/audit-logs` → `403` `Not allowed for your admin role`.
- Checked live on 2026-10-05 (same results).

### ADMIN-AUTH-06 — The audit log records who did it

Logged in as super-admin, create a tenant (TEN-01), then `GET /api/admin/audit-logs?tenant_id=<id>`.

**Expected**: the `create` entry has `admin_user_id` = your admin's id, not `null`.

## 9. Daily cleanup job

Runs at **03:00** every day: deletes `refresh_tokens` and `one_time_codes` that **expired more than 30 days ago**. A row that expired 5 days ago stays. There is no route; run it once by hand with `yarn job:cleanup`.

### JOB-01 — Old expired rows go, recent ones stay

1. Insert two codes:
```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into one_time_codes (type, tenant_id, code_hash, expires_at) select 'email_verification', id, 'testcleanup1', now() - interval '40 days' from tenants limit 1; insert into one_time_codes (type, tenant_id, code_hash, expires_at) select 'email_verification', id, 'testcleanup2', now() - interval '5 days' from tenants limit 1;"
```
2. `yarn job:cleanup`
3. `select code_hash from one_time_codes where code_hash like 'testcleanup%';`

**Expected**
- The command prints `{ refreshTokens: N, codes: 1 }` (`codes` is at least 1).
- Only `testcleanup2` is left. `testcleanup1` (40 days) is gone.
- Delete the leftover (see Clean up below).

---

## Cross-tenant isolation (the Prisma extension)

Covered by an automated test, not a manual one: `test/tenant-isolation.e2e-spec.ts`. Run it with `yarn test:e2e` (Jest does not exit by itself afterwards — press Ctrl+C, or run `npx jest --config test/jest-e2e.json --forceExit`). It needs the database up.

It checks, against the real DB (11 tests):
- two real tenants: tenant B cannot read, find by id (`findUnique`), update or delete tenant A's `users`, `user_invitations`, `role_permissions`;
- **all 44 tenant-scoped tables**: the SQL of every read and delete carries `tenant_id = $n`; an unknown tenant sees nothing; no tenant in context throws.

The console prints which tables had rows from 2+ tenants. A new table in `schema.prisma` is checked automatically.

## 11. Tenant isolation by hand (two companies)

Why: the automated test (`yarn test:e2e`, see [00-how-to-test.md](00-how-to-test.md) § 6) proves it on every table. These scenarios show the same thing through the real API. Use two logins, in two cookie jars: Dupont admin (`admin@dupont.test`, tenant 1) and Verhelst admin (`admin@verhelst.test`, tenant 2). Password `Demo@12345678`.

Get the ids once: in Prisma Studio, or `select id, email, tenant_id from users;`. Below, `V_ID` is a Verhelst user (like `admin@verhelst.test`) and `D_ID` is a Dupont user.

### ISO-01 — A company lists only its own team
`GET /api/users` as Dupont, then as Verhelst.

**Expected:** each answer has only users of its own company. Seed data: Dupont `total` 7, Verhelst `total` 3. In every row `tenant_id` is the same number.

### ISO-02 — Own user is readable, another company's is not
As Dupont admin: `GET /api/users/D_ID` → `200`. `GET /api/users/V_ID` → `404 User not found` (not `403`: the other company's row must look like it does not exist).

### ISO-03 — Cannot change another company's user
As Dupont admin, on `V_ID`: `PATCH /api/users/V_ID` with `{"name":"HACKED"}`, `DELETE /api/users/V_ID`, `POST /api/users/V_ID/pin` with `{"pin":"4321"}`.

**Expected:** all three → `404 User not found`. Check in the database: `select name, is_active, mobile_pin_hash is not null from users where id = V_ID;` still shows the old name, `true`, and `false`.

### ISO-04 — Invitations stay inside the company
1. Insert an open invitation for Verhelst (tenant 2):
```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into user_invitations (tenant_id, email, name, role_id, token_hash, invited_by, expires_at) values (2, 'test-iso@test.invalid', 'TEST Iso', 5, 'iso-hash-1', V_ID, now() + interval '7 days');"
```
2. As Dupont admin: `GET /api/invitations` → `total` 0. `DELETE /api/invitations/<its id>` → `404 Invitation not found`.
3. As Verhelst admin: `GET /api/invitations` → `total` 1.

### ISO-05 — A permission override stays inside the company
Already covered by GRD-03 (§ 10). Run it again after any change to `roles`.

## 12. `scope = own`

### SCOPE-01 — The worker's scope is `own`
Log in as `worker@dupont.test`, then `GET /api/auth/me`.

**Expected:** in `permissions`, these modules have `scope: "own"`: `tasks`, `time_entries`, `reports`, `media`, `chat`. As `admin@dupont.test` and `manager@dupont.test`, `tasks` has `scope: "all"`.

**Not testable yet:** a task list that only shows the worker's own tasks. There is no `GET /api/tasks` until step 08. Add that scenario then. The guard side is covered by `src/auth/guards/permission.guard.spec.ts` (`yarn test`).

## Clean up after testing

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from one_time_codes where user_id in (select id from users where email like 'test-%@test.invalid' or email like '%@test.invalid');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from refresh_tokens where user_id in (select id from users where email like '%@test.invalid');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from user_invitations where email like '%@test.invalid';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from users where email like '%@test.invalid';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from tenant_subscriptions where tenant_id in (select id from tenants where name like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from tenants where name like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from refresh_tokens where admin_user_id in (select id from admin_users where email like 'test-%'); delete from admin_users where email like 'test-%'; delete from one_time_codes where code_hash like 'testcleanup%';"
```

## 10. Guards on the tenant side (Acceptance run, 2026-10-05)

### GRD-01 — No cookie
`GET /api/users`, `/api/auth/me`, `/api/auth/sessions`, `/api/roles`, `POST /api/invitations` → all `401 Not authenticated`. `GET /api/invitations/verify/abc` is **not** `401` (it is public; a bad token gives `400`).

### GRD-02 — Role check
Log in as `worker@dupont.test`: `POST /api/invitations` → `403 Insufficient role`, `GET /api/users` → `403`. As `manager@dupont.test`: `GET /api/users` → `200`.

### GRD-03 — Permission override stays inside its tenant
1. As `admin@dupont.test`: `PUT /api/roles/2/permissions/invoices` with `{"can_view":true,"can_create":true,"can_edit":false,"can_delete":false,"scope":"all"}`.
2. `GET /api/roles/permissions` as Dupont admin and as `admin@verhelst.test`; look at role `2`, module `invoices`.
3. Log in as `manager@dupont.test`: `GET /api/auth/me` → `permissions` shows `invoices` with `can_view: true`.
4. Remove it: `DELETE /api/roles/2/permissions/invoices`.

**Expected:** Dupont shows `can_view: true`; Verhelst still `false`.

### GRD-04 — Suspend a tenant locks everyone out
1. Register a TEST company (AUTH-01) and log in as its owner. `GET /api/users` → `200`.
2. As super-admin: `PATCH /api/admin/tenants/<id>/status` with `{"status":"suspended","reason":"test"}`.
3. Owner again: `GET /api/users` (old access cookie) → `403`; `POST /api/auth/refresh` → `401`; login → `401`.

**Expected:** `select count(*) from refresh_tokens where revoked_at is null and user_id in (...)` is `0`.

### GRD-05 — Sessions list hides the hash
`GET /api/auth/sessions` → each row has `id`, `user_agent`, `ip_address`, `created_at`, `expires_at`. There is **no** `token_hash`.
