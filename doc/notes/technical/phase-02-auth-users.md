# Phase 02 — Auth & Users

> Depends on Phase 01 (tenants must exist before users can belong to them).

## Tables

- `roles` — 7 default roles, seeded on deploy
- `users` — all tenant-side users
- `role_permissions` — per-tenant permission overrides (**overrides only** — defaults live in code)
- `refresh_tokens` — one row per live session, token hashed
- `user_invitations` — employee invites, token hashed
- `one_time_codes` — password reset / email verification / admin 2FA

## Key relations

```
tenants ──── users ──── roles
        └─── role_permissions
```

## Two separate auth systems

### System A — `admin_users` (platform)
- Login only (no public register)
- Forgot password → OTP via email
- httpOnly cookie: access token (15min) + refresh token (7d)

### System B — `users` (tenant side)
Three entry points:

| Flow | Who | How |
|---|---|---|
| Tenant registration | New company | Public form → creates `tenant` + first `admin` user + `tenant_subscriptions` row, all in **one transaction** |
| Employee invitation | Existing company | Admin invites → email link → employee sets password |
| Mobile PIN login | `worker` only | **Email + PIN** → `/mobile/login` endpoint |

## Password hashing
- **argon2id only.** bcrypt is not used anywhere in the project
- It hashes the password **and** the mobile PIN (`mobile_pin_hash`). A PIN is a credential, so it is never stored readable
- `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`

## Token rules
- Both access + refresh tokens stored as **httpOnly cookies** — never in localStorage
- Access token: 15min, stateless, **never stored**
- Refresh token: 7 days, **stored hashed** in `refresh_tokens` so a session can be killed
- Every refresh rotates: issue a new row, set `revoked_at` on the old one
- A revoked refresh token used again → revoke **every** row for that user (it was stolen)
- Logout clears both cookies and revokes that one row
- Deactivating a user (`is_active = false`) must also revoke all their rows

## Code lifetimes

| `one_time_codes.type` | Lifetime | Max attempts |
|---|---|---|
| `password_reset` | 1 hour | 5 |
| `email_verification` | 24 hours | — |
| `admin_2fa` | 5 minutes | 3 |

The super-admin TOTP secret lives on `admin_users` (otplib). This table only tracks the one-time challenge.

## Profile image
- One image per user — stored in `media` table (`entity_type = 'user'`)
- Uploading a new one auto-deletes the old one

## Key rules

- `users.is_active = false` → can't log in, but all their history is kept
- `mobile_pin_hash` is only for the `worker` role — dashboard users always use a password
- A PIN alone is not a credential: `/mobile/login` takes **email + PIN**, and locks the account after 5 wrong tries
- Employee never self-registers — always invited by the tenant admin
- `role_permissions` overrides are scoped to one tenant — never affect others
- `role_permissions` stores **only overrides**. The default matrix lives in code, nothing is seeded per tenant. `PermissionGuard` reads the code default, then applies an override row if one exists
- `role_permissions` carries a **`scope`** column (`all` / `own`) beside the 4 booleans. The default matrix has three levels — `full`, `view` and `own` — and `own` ("only his own rows", e.g. a `worker`'s tasks and hours) cannot be expressed by booleans alone. On `scope = 'own'`, `PermissionGuard` adds `WHERE user_id = :current`
- **`users.email` is `UNIQUE` across the whole app**, and so is an open invitation. One email belongs to one company
- The reason: login is email + password with no company field. If one email existed in two companies, the server could not know which one to open
- Inviting an email that already works at another company is refused with a clear message
- No token or code is stored in plain text — always sha256

## Guards & decorators built in this phase

| Name | What it does |
|---|---|
| `AuthGuard` | Validates JWT from httpOnly cookie |
| `TenantGuard` | Scopes request to `tenant_id` from JWT |
| `@Public()` | Marks endpoint as no-auth required |
| `@Roles()` | Marks which roles can access |
| `PermissionGuard` | Checks `role_permissions` for role + module |

## What to build

- Auth endpoints: login, logout, refresh, forgot password, reset password, change password
- Tenant registration endpoint
- Employee invitation flow (send email + set-password endpoint)
- Mobile PIN login endpoint
- Session list + revoke endpoints (read `refresh_tokens`)
- Daily cron: delete expired tokens and codes older than 30 days
- `users` CRUD (admin manages their team)
- Profile image upload/update/delete
- Seed file: insert 7 roles on first deploy

## Dependencies

- Phase 01 (tenants table must exist)
- Resend (email for invitations + OTP)
- ImageKit (profile image)

## See also
- [[auth-tokens]]
- [[roles-permissions]]
- [[entity-fields]]
- [[media-files]]
