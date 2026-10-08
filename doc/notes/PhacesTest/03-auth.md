# Phase 03 — Auth, Users & Invitations

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [auth-tokens.md](../auth-tokens.md), [roles-permissions.md](../roles-permissions.md).
> Old reference: [../test/06-auth-users.md](../test/06-auth-users.md).

## Goal

Create companies A and B by registration, build A's full team (one user per role) through real invitations, and test every auth flow.

## Before you start

- `TEST Small` is the default plan (phase 02).
- Every email in this phase is real. Wait for the **[CHECK EMAIL]** / **[SEND ME CODE]** messages on Telegram.
- Login is limited to 5 per minute. Logins are spaced.

---

## 1. Register

| ID | Do | Expected | Result |
|---|---|---|---|
| REG-01 | Set every plan `is_default = false` (DB), register `othmanefadelkheir218+nodefault@gmail.com` | `400`, a clear "no default plan" message, **nothing** written (no tenant, user or subscription). Restore `TEST Small` as default | PASS |
| REG-02 | `POST /api/auth/register` `{ company_name: "TEST Alpha Renovation", email: "othmanefadelkheir218@gmail.com", password: "TestPass@2026!", name: "Othmane Owner", locale: "fr" }` | `201 { tenant_id, user }`, `role_id 1`, no hash in the body | PASS |
| REG-03 | Check the 3 rows | `tenants` + `users` (admin) + `tenant_subscriptions` (`trialing`, plan `TEST Small`, `period_end = period_start + 14 days`) | PASS |
| REG-04 | **[CHECK EMAIL]** `othmanefadelkheir218@gmail.com` — verification email, in **French** | received — **[SEND ME CODE]** | FAIL — see RESULTS.md |
| REG-05 | A platform alert was written | `notifications` row `tenant_signed_up`, `admin_user_id` set, `tenant_id` NULL | PASS |
| REG-06 | Register the same email again | `409`, still one company | PASS |
| REG-07 | Register company B: `TEST Beta Bouw`, `industrytechnology198@gmail.com`, `locale: "en"` | `201`, trialing on `TEST Small`. **[CHECK EMAIL]** verification email in **English** | PASS |
| REG-08 | Password of 11 characters; bad email; missing `company_name` | `400` each | PASS |

## 2. Verify email

| ID | Do | Expected | Result |
|---|---|---|---|
| VER-01 | `POST /api/auth/verify-email` with a wrong code | `400` | PASS |
| VER-02 | With the code from REG-04 | `201 { verified: true }`, `users.email_verified_at` set | PASS |

## 3. Login, refresh, logout, sessions

| ID | Do | Expected | Result |
|---|---|---|---|
| LOG-01 | Login as A owner | `201`, cookies `access_token` (`Max-Age=900`) + `refresh_token` (`Max-Age=604800`), `HttpOnly; SameSite=Lax`; `refresh_tokens` holds a hash only | PASS |
| LOG-02 | Wrong password; unknown email | both `401 Invalid credentials` (same message) | PASS |
| LOG-03 | `GET /api/auth/me` | user + role + resolved permissions | PASS |
| LOG-04 | `POST /api/auth/refresh` | new cookies, old row `revoked_at` set, new row live | PASS |
| LOG-05 | Login twice (sessions 1 and 2), refresh session 1, then replay session 1's **old** refresh cookie | `401`, and **every** session of the user is revoked — session 2 too | PASS |
| LOG-06 | `GET /api/auth/sessions` | `id`, `user_agent`, `ip_address`, `created_at`, `expires_at` — no `token_hash` | PASS |
| LOG-07 | `DELETE /api/auth/sessions/:id` on one; `DELETE /api/auth/sessions` | that one revoked; then all revoked | PASS |
| LOG-08 | `POST /api/auth/logout` | `{ logged_out: true }`, cookies cleared, that row revoked, other sessions untouched | PASS |
| LOG-09 | No cookie on `/api/auth/me`, `/api/users`, `/api/roles` | `401 Not authenticated` | PASS |

## 4. Forgot / reset / change password

| ID | Do | Expected | Result |
|---|---|---|---|
| PWD-01 | `forgot-password` with A owner's email, then with `nobody@test.invalid` | both `201 { sent: true }`; only the first writes a code. **[CHECK EMAIL]** owner inbox — reset email — **[SEND ME CODE]** | PASS |
| PWD-02 | `reset-password` with `000000` | `400`, old password still works | PASS |
| PWD-03 | `reset-password` with the real code, new password `TestPass@2026!b` | `201 { reset: true }`; old password `401`, new one works; **every** session revoked | PASS |
| PWD-04 | `change-password` (old + new) back to `TestPass@2026!` | `201`; the new password logs in | PASS |

## 5. Invitations — building A's team

Invite each person below as A owner (`POST /api/invitations` with `email`, `name`, `role_id`). Each one: **[CHECK EMAIL]** the invitation → **[SEND ME CODE]** the `token=` value → verify → accept with `TestPass@2026!`.

| Person | Email | `role_id` |
|---|---|---|
| Manager | `zakariyazouazou@gmail.com` | 2 |
| Site supervisor | `zakariyazouazou+supervisor@gmail.com` | 3 |
| Team leader | `zakariyazouazou+leader@gmail.com` | 4 |
| Worker | `winucardit@gmail.com` | 5 |
| Worker 2 | `winucardit+worker2@gmail.com` | 5 |
| Sales | `zakariyazouazou+sales@gmail.com` | 6 |
| Accountant | `zakariyazouazou+accountant@gmail.com` | 7 |

| ID | Do | Expected | Result |
|---|---|---|---|
| INV-01 | Send the 7 invitations | `201` each, 7 open rows, token stored as a hash only | PASS |
| INV-02 | **[CHECK EMAIL]** all 7 arrive (French — A's locale) | received | PASS |
| INV-03 | `GET /api/invitations/verify/<token>` | `200 { name, email, company }`; a made-up token → `400` | PASS |
| INV-04 | `POST /api/invitations/accept { token, password }` for each | `201 { accepted: true, user_id }`, the `users` row is created **now**, with the invited role | PASS |
| INV-05 | Accept the same token again | `400`, same message as an unknown token | PASS |
| INV-06 | Re-invite an open address twice from A | still **one** row for that email (the old one replaced) | PASS |
| INV-07 | From A, invite `industrytechnology198@gmail.com` (B's owner) | `409`, nothing written | PASS |
| INV-08 | From B, invite an address that has an **open** invitation at A | `409`, A's invitation untouched | PASS |
| INV-09 | `POST /api/invitations/:id/resend`, then `DELETE /api/invitations/:id` on a spare invite (`zakariyazouazou+spare@gmail.com`) | resend: a new token, the old one dead (**[CHECK EMAIL]**); delete: revoked | PASS |
| INV-10 | Worker or manager calls `POST /api/invitations` | `403 Insufficient role` | PASS |

After INV-04 A has 8 users: 6 non-worker (admin, manager, supervisor, leader, sales, accountant) + 2 workers.

## 6. Team management

| ID | Do | Expected | Result |
|---|---|---|---|
| USR-01 | As owner: `GET /api/users` | `total 8`, all `tenant_id` = A | PASS |
| USR-02 | `PATCH /api/users/<worker>` `{ "hourly_rate": "20.00" }`; same for worker 2 `"25.00"`, supervisor `"30.00"` | `200`, one `audit_logs` `update` / `user` with old and new | PASS |
| USR-03 | `POST /api/users/<worker>/pin { "pin": "1234" }`, worker 2 `"5678"` | `200`, PIN hash argon2id, `failed_pin_count 0`; same call on the manager → `400` | PASS (status 201, not 200 — POST convention) |
| USR-04 | `PATCH /api/users/me { "name": "Othmane Owner A" }`; with `role_id` | `200`; `400` (not on this route) | PASS |
| USR-05 | Manager `PATCH /api/users/<worker>` | `403` — admin only | PASS |
| USR-06 | Invite and accept `zakariyazouazou+spare2@gmail.com` (role 6), log it in, then owner `DELETE /api/users/<id>` | `is_active false`, every session revoked, login `401`, row kept. It is inactive, so phase 18 must **not** count it | PASS |

## 7. Mobile login (worker)

| ID | Do | Expected | Result |
|---|---|---|---|
| MOB-01 | `POST /api/mobile/login` worker, PIN `0000` then `1234` | `401` (`failed_pin_count` +1), then `201` cookies, counter back to 0 | PASS |
| MOB-02 | Set `failed_pin_count = 4` (DB), one wrong PIN, then the right PIN | `401`, then `403 Locked after too many wrong PINs — contact your admin` | PASS |
| MOB-03 | Owner resets the PIN (`POST /users/:id/pin`) | unlocked, `1234` works again | PASS |
| MOB-04 | Mobile login with the **manager's** email | `401`, same generic message | PASS |
| MOB-05 | 6 mobile logins inside one minute | the 6th → `429` | PASS |
| MOB-06 | Worker calls `GET /api/users` | `403 Insufficient role` | PASS (403, message is 'No canView access to team') |

## 8. Suspension locks a whole company

| ID | Do | Expected | Result |
|---|---|---|---|
| SUS-01 | Super-admin suspends **B** with a reason | B owner: old access cookie → `403 This company is suspended or banned`; refresh `401`; login `401`; 0 live sessions | PASS (fixed + re-run 2026-10-08) |
| SUS-02 | Platform alert | `tenant_status_changed` row for the platform admins | PASS |
| SUS-03 | Reactivate B | B owner logs in again | PASS |

## 9. Platform admin 2FA

There is no route to switch 2FA on. The test sets a TOTP secret in the database for the **staff** admin (test data only), then computes the code with `otplib`.

| ID | Do | Expected | Result |
|---|---|---|---|
| 2FA-01 | Set `admin_users.totp_secret` for `TEST Staff`, then `POST /api/admin/auth/login` | a 2FA challenge, **no** session cookie yet | PASS |
| 2FA-02 | `POST /api/admin/auth/verify-2fa` with a wrong code, 3 times | `400`/`401` each, then the challenge is dead | PASS (fixed + re-run 2026-10-08) |
| 2FA-03 | Login again, verify with the right TOTP | session cookies set | PASS |
| 2FA-04 | `POST /api/admin/auth/logout` | cookies cleared, row revoked | PASS |
| 2FA-05 | Put `totp_secret` back to NULL | staff logs in with no 2FA again | PASS |

## 10. Cleanup job

| ID | Do | Expected | Result |
|---|---|---|---|
| JOB-01 | Insert one `one_time_codes` row expired 40 days ago and one expired 5 days ago, `yarn job:cleanup` | prints `{ refreshTokens: N, codes: ≥1 }`; only the 5-day one remains | PASS |
