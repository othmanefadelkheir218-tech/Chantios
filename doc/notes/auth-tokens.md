# ChantierOS — Auth Token Tables

> Status: v1 (working draft). Three tables cover every token in the app. See [[roles-permissions]] and [[technical/phase-02-auth-users]].

## Password hashing — argon2id

`argon2id` only. bcrypt is not used anywhere in the project.

It hashes passwords **and** the `worker` mobile PIN (`mobile_pin_hash`). Nothing about a login is stored readable.

| Setting | Value |
|---|---|
| `memoryCost` | 19456 |
| `timeCost` | 2 |
| `parallelism` | 1 |

It is memory-hard, so cracking on a GPU is far more expensive than with bcrypt.

---

## 1. `refresh_tokens`

The access token (15 min) is stateless — it is never stored. The refresh token (7 days) **is** stored, hashed, so a session can be killed.

| Field | Meaning |
|---|---|
| `id` | integer |
| `user_id` | FK → `users.id` — nullable |
| `admin_user_id` | FK → `admin_users.id` — nullable |
| `token_hash` | sha256 of the token — the raw value lives only in the cookie |
| `user_agent` | Which device/browser |
| `ip_address` | Where it was issued |
| `expires_at` | Issued + 7 days |
| `revoked_at` | Set on logout — nullable |
| `created_at` | — |

Exactly one of `user_id` / `admin_user_id` is set per row.

### What this gives you

| Action | How |
|---|---|
| Log out this device | Set `revoked_at` on that one row |
| Log out everywhere | Set `revoked_at` on all rows for that user |
| Deactivate an employee | Set `is_active = false` **and** revoke all their rows |
| See active sessions | Rows where `revoked_at IS NULL AND expires_at > now()` |

**Rotation:** every refresh issues a new row and revokes the old one. If a revoked token is used again, revoke every row for that user — it means the token was stolen.

---

## 2. `user_invitations`

An employee never registers. The admin adds them — by invitation (below, the normal way) or directly (§ 2b).

| Field | Meaning |
|---|---|
| `id` | integer |
| `tenant_id` | Which company |
| `email` | Who is invited |
| `name` | Their name, pre-filled by the admin |
| `role_id` | FK → `roles.id` — the role they will get |
| `token_hash` | sha256 — the raw token is only in the email link |
| `invited_by` | FK → `users.id` — **nullable**: set when a company user invites |
| `invited_by_admin_user_id` | FK → `admin_users.id` — **nullable**: set when the super-admin creates a company and invites its first `admin` |
| `expires_at` | Created + 7 days |
| `accepted_at` | Set when they choose their password — nullable |
| `created_at` | — |

### Rules

- Exactly one of `invited_by` / `invited_by_admin_user_id` is set (same pattern as `refresh_tokens`).
- One open invitation per email. Re-inviting replaces the old row.
- A used invitation (`accepted_at` set) can never be used again.
- Accepting creates the `users` row — the invitation does not create it earlier.
- **An email belongs to one company only.** `users.email` is `UNIQUE` across the whole app, and so is an open invitation. Inviting an email that already works at another company is refused with a clear message.
- The reason: login is email + password with no company field. If one email existed twice, the server could not know which company to open.

---

## 2b. Adding a member without the email

Decided 2026-10-10 (owner: "I need both"). The `admin` may add a member directly, with no invitation email. Same right as inviting: `admin` only. `POST /api/invitations/direct`.

**A — any role, with a temporary password.**
- The admin gives: name, email, role, a temporary password (12 characters min, same rule as every password), and optional phone, hourly rate and PIN (worker only).
- The `users` row is created at once. No email is sent. `email_verified_at` stays `NULL`.
- `users.must_change_password = true`. After login, the frontend shows only the "choose your password" page until the user changes it (`POST /api/auth/change-password`). Any new password (change or reset) sets it back to `false`.
- The email must be free, exactly like an invitation (§ 2 Rules). An open invitation for the same email at the same company is replaced (deleted).

**B — `worker` only, with no email, PIN only.**
- The admin gives: name, a PIN (4–6 digits), and optional phone and hourly rate. No email, no password.
- The server gives the worker a **login code**: 8 digits, unique in the whole app (`users.login_code`). It is shown to the admin (team list and member page) and the worker uses it on the phone: `POST /api/mobile/login` with `login` = the code (or an email) + `pin`.
- This worker can only use the phone (Field) login. No dashboard login, no "forgot password" — the admin sets a new PIN instead (`POST /api/users/:id/pin`).
- Emails for this user are skipped (notifications still appear in the app).
- A user with no email must stay a `worker`: changing their role is refused (`400`). A DB CHECK enforces it: `email IS NOT NULL OR (role_id = 5 AND login_code IS NOT NULL)`.

---

## 3. `one_time_codes`

One table for every short-lived code, separated by `type`. The fields are identical, so three tables would be waste.

| Field | Meaning |
|---|---|
| `id` | integer |
| `tenant_id` | FK → `tenants.id` — nullable. Set for a tenant-level code (e.g. the tenant's own contact email) |
| `user_id` | FK → `users.id` — nullable |
| `admin_user_id` | FK → `admin_users.id` — nullable |
| `type` | `password_reset` / `email_verification` / `admin_2fa` |
| `code_hash` | sha256 of the code |
| `expires_at` | See table below |
| `consumed_at` | Set on successful use — nullable |
| `attempt_count` | Wrong tries so far |
| `created_at` | — |

**Decision (2026-10-05):** `tenant_id` added so `email_verification` can target a tenant's own contact email, created via the super-admin route with no `users` row yet (that case is step 02). Exactly one of `tenant_id` / `user_id` / `admin_user_id` is set per row — same pattern as `refresh_tokens`, extended to three columns.

### Lifetime and limits per type

| `type` | Lifetime | Max attempts |
|---|---|---|
| `password_reset` | 1 hour | 5 |
| `email_verification` | 24 hours | — |
| `admin_2fa` | 5 minutes | 3 |

Over the attempt limit → the row is consumed and the user requests a new code. Rate limit the request endpoint too, so nobody can spam codes to an inbox.

`admin_2fa` covers the super-admin TOTP flow (otplib). The TOTP secret itself lives on `admin_users`, not here — this table only tracks the one-time challenge.

**Decision (2026-10-05, step 02 build):** a TOTP code is verified directly against `admin_users.totp_secret` (otplib) — it is never emailed and never compared against a stored hash, so this row's own `code_hash`/`attempt_count` don't apply to it the way they do to the other two types. The 5-minute window between password check and TOTP entry is carried instead as a short-lived signed JWT "challenge token" (`admin-login.handler.ts` issues it, `verify-2fa.handler.ts` decodes it) naming which admin is mid-login. No `one_time_codes` row is written for `admin_2fa` yet. **Known gap**: there is no 2FA enrollment route in v1 so far — `admin_users.totp_secret` is always `NULL` today, so `admin-login.handler.ts` skips the challenge whenever it's unset. Add the enrollment route before relying on this for anything real.

---

## Shared rules

- **Nothing is stored in plain text.** Every token and code is sha256-hashed. The raw value exists only in the cookie, the email link or the user's phone.
- **Compare hashes, never values.** Look the row up by hash.
- A daily cron deletes rows where `expires_at` passed more than 30 days ago.

---

## Sessions seen by the frontend

### Platform admin refresh — `POST /api/admin/auth/refresh`

Same rules as the tenant refresh, with the admin cookies:
- Reads the `admin_refresh_token` cookie. No body. `@Public()`.
- Rotation: a new `refresh_tokens` row (`admin_user_id` set), the old one revoked.
- A revoked token presented again → revoke **every** session of that admin, clear the admin cookies, `401`.
- An inactive admin (`is_active = false`) → `401`, cookies cleared.
- Sets new `admin_access_token` + `admin_refresh_token` cookies.

### Platform admin "who am I" — `GET /api/admin/auth/me`

Behind `AdminAuthGuard`. Returns the logged-in admin: `id`, `email`, `name`, `role` (`super_admin` / `staff`), `can_manage_billing`, `can_manage_tenants`. Never `password_hash` or `totp_secret`. The admin frontend uses it as its session check and to build its menu.

### Impersonation flag in `GET /api/auth/me`

`/auth/me` returns one more key, `impersonation`:
- `null` for a normal login.
- `{ admin_user_id, admin_name, expires_at }` when the access token carries `impersonatedBy`. `expires_at` = the token's `exp`.

The frontend shows the "exit impersonation" banner from this key only.

### Cookie domain

Frontend and API share one parent domain in production (e.g. `app.example.com` + `api.example.com`). So:
- `COOKIE_DOMAIN` env (optional, e.g. `.example.com`). When set, every auth cookie (set **and** clear) carries `domain: COOKIE_DOMAIN`, so the frontend server can see that a session cookie exists. Not set in dev (`localhost` shares cookies across ports).
- `sameSite: 'lax'` stays: the two sub-domains are the same site.
- `APP_URL` = the frontend origin (no locale, e.g. `https://app.example.com`). `PORTAL_BASE_URL` = `APP_URL` + `/portal`.

---

## Related notes
- [[roles-permissions]]
- [[technical/phase-02-auth-users]]
