# Step 18 — API Additions for the Frontend  *(after v1)*

> Small API additions the frontend needs before it can be built. Needs steps 02 (auth), 14 (plans) and the modules the dashboard reads. **Built and live-checked 2026-10-10.**

## Goal

Close the gaps found while planning the frontend (`ChanitOs_client/my-app/.instruction/`): admin session refresh, admin "who am I", the impersonation flag, a tenant dashboard, a public plan list, the company profile, and the cookie domain for production. Also build the 3 owner decisions of 2026-10-09 that change code: a company created by the super-admin, payment corrections, and bank details on the invoice.

## Decide first

**No blockers.** `PATCH /api/tenant` never accepts `email` or `currency` — both are fixed by the backend (decided 2026-10-09).

## Tables

No new table. **One migration** (`frontend_support_columns`):

| Table | Change |
|---|---|
| `tenants` | add `iban TEXT`, `bic TEXT` (nullable) |
| `user_invitations` | `invited_by` becomes nullable; add `invited_by_admin_user_id` → `admin_users.id`; `CHECK (num_nonnulls(invited_by, invited_by_admin_user_id) = 1)` |
| `payments` | `CHECK (amount > 0)` → `CHECK (amount <> 0)`; add `note TEXT`; `CHECK (amount > 0 OR note IS NOT NULL)` |

`doc/Schema Proposal.md` already shows the target DDL.

## Rules — read the notes first

| Part | Rule lives in |
|---|---|
| Admin refresh, admin me, impersonation flag, cookie domain | [../auth-tokens.md](../auth-tokens.md) § Sessions seen by the frontend |
| Public plan list | [../subscription-plans.md](../subscription-plans.md) § Public plan list |
| Tenant dashboard | [../dashboard.md](../dashboard.md) |
| Company profile | [../roles-permissions.md](../roles-permissions.md) § Company profile |
| Portal chat polling (frontend only, no API change) | [../client-portal.md](../client-portal.md) § Client messaging |
| Company created by the super-admin | [../subscription-plans.md](../subscription-plans.md) § what a brand-new company gets, [../auth-tokens.md](../auth-tokens.md) § `user_invitations` |
| Payment corrections | [../client-invoices.md](../client-invoices.md) § `payments` |
| Bank details | [../entity-fields.md](../entity-fields.md) § `tenants`, [15-documents.md](15-documents.md) payment block |

## Routes

| Method | Route | Guard | Module (folder) |
|---|---|---|---|
| `POST` | `/api/admin/auth/refresh` | `@Public()`, reads `admin_refresh_token` | `auth` — `admin-auth.controller.ts` |
| `GET` | `/api/admin/auth/me` | `AdminAuthGuard` | `auth` — `admin-auth.controller.ts`, reads through `AdminUsersService` |
| `GET` | `/api/auth/me` | unchanged | `auth` — adds the `impersonation` key |
| `GET` | `/api/dashboard` | tenant guards, no `@Module()` | **new** `dashboard` module — no repository |
| `GET` | `/api/plans` | `@Public()`, throttled | `plans` — new `plans-public.controller.ts` |
| `GET` | `/api/tenant` | tenant guards, no `@Module()` | **new** `company-profile` module — `tenant-profile.controller.ts`, no repository |
| `PATCH` | `/api/tenant` | tenant guards, `@Module('settings')`, `can_edit` | `company-profile` controller → `TenantsService.updateProfile()` (rule + audit stay in `tenants`) |
| `POST` | `/api/admin/tenants` | unchanged guard (`AdminAuthGuard`) | `auth` — `admin-tenants.controller.ts` + `AdminCreateTenantHandler`, next to the sign-up |
| `POST` | `/api/invoices/:id/payments` | unchanged guard | `invoices` — accepts a negative correction with `note` |

### Where the code lives (decided during the build, 2026-10-10)

`tenants` is a low-level module: `media`, `roles`, `invitations` and the `subscriptions → plans → stripe` chain all import it. So `tenants` cannot call `MediaService` (logo URL) or create subscriptions / invitations without an import loop. Therefore:
- **Company profile:** the editable fields, the IBAN/BIC normalisation and the audit stay in `tenants` (`UpdateTenantProfileHandler`). A new small module `company-profile` (no repository) owns `GET`/`PATCH /api/tenant` and adds `logo_url` through `MediaService`.
- **Company created by the super-admin:** built in `auth`, like the sign-up (`AdminCreateTenantHandler`). The trial rule is one helper, `auth/helpers/new-company.helper.ts`, used by both. The invitation row + email come from `InvitationsService` (`CreateFirstAdminInvitationHandler`). The "an email belongs to one company" check is one helper, `invitations/helpers/invitation-email.helper.ts`, used by both invitation handlers. The route URL is unchanged.

## Tasks

### 1. Admin refresh
- [x] `AdminRefreshHandler` — copy the shape of `refresh.handler.ts` with the admin cookies and `admin_user_id`. Reuse `SessionsService` (`findByHash`, `revoke`, `revokeAllForAdmin`) and `TokenHelper`. Don't write a second rotation rule.
- [x] Route + swagger in `auth.swagger.ts`.

### 2. Admin me
- [x] `GetAdminMeHandler` → `AdminUsersService` → the existing admin-user entity (no secrets).
- [x] Route + swagger.

### 3. Impersonation flag
- [x] `AuthGuard` keeps `impersonatedBy` and `exp` from the token in `AuthenticatedUser`.
- [x] `GetMeHandler` returns `impersonation: null | { admin_user_id, admin_name, expires_at }`. The admin name comes from `AdminUsersService`.

### 4. Dashboard
- [x] New `dashboard` module: controller, service, one handler per widget or one handler that calls the services. **No repository.**
- [x] Each owning module exposes a small count/sum method in its own service (+ repository). Reuse the existing rules for overdue, due soon, low stock and margin level.
- [x] Leave out the widgets the user cannot view; respect `scope = own`.

### 5. Public plans
- [x] `plans-public.controller.ts` + `FindPublicPlansHandler` → `PlansService` → existing repository method (or one new `findActiveWithFeatures`).
- [x] Response type `PublicPlanEntity` without `stripe_price_id` / `parent_plan_id`. Sorted by `base_price`.

### 6. Company profile
- [x] `tenant-profile.controller.ts`, `GetTenantProfileHandler`, `UpdateTenantProfileHandler`, `update-tenant-profile.dto.ts` (only the editable fields, snake_case).
- [x] `PATCH` writes `audit_logs` with old + new values.
- [x] `GET` returns the logo URL through `MediaService`.

### 7. Cookie domain
- [x] `COOKIE_DOMAIN` in `env.config.ts` (optional) + `.env.example`.
- [x] `cookie.helper.ts`: add `domain` to `BASE_OPTIONS` when set, for set **and** clear.
- [x] `.env`: `APP_URL` = frontend origin, `PORTAL_BASE_URL` = `APP_URL/portal`, `CORS_ORIGINS` includes the frontend origin.

### 8. Company created by the super-admin
- [x] DTO: add `owner_name`, `owner_email` (required).
- [x] Handler: one transaction → tenant + trial subscription (reuse the signup code that creates it — don't write it twice) + invitation with `invited_by_admin_user_id` and role `admin`.
- [x] Send the normal invitation email (reuse `InvitationsService`).
- [x] `owner_email` already used by a user or an open invitation → `409`, nothing created.

### 9. Payment corrections
- [x] DTO: `amount` may be negative, never `0`; `note` required when `amount < 0`.
- [x] Refuse a correction that would make the total paid go below `0` (`400`).
- [x] Status recomputed from the ledger, as today.

### 10. Bank details
- [x] `iban`, `bic` in the tenant entity and in `update-tenant-profile.dto.ts` (IBAN format check).
- [x] Invoice PDF payment block prints them when set.

## Acceptance

- [x] Admin: login → wait for the access token to expire → `POST /admin/auth/refresh` gives new cookies; a replayed old refresh token → `401` and every admin session revoked.
- [x] `GET /admin/auth/me` returns the admin without `password_hash` / `totp_secret`; `401` without cookie.
- [x] `GET /auth/me` → `impersonation: null` on a normal login, filled after `POST /admin/impersonate/:tenantId`.
- [x] `GET /dashboard` as `admin` → 8 widgets; as `sales` → only the widgets of modules sales can view; as a user with `own` scope → own numbers only.
- [x] `GET /plans` without login → active plans only, no Stripe id.
- [x] `GET /tenant` works for every role; `PATCH /tenant` → `403` for a role without `settings` edit, `200` + audit row for `admin`; `email` / `currency` in the body are refused by validation.
- [x] With `COOKIE_DOMAIN` set, login cookies carry the domain and logout clears them. *(unit test — a live check needs an API restart with the variable set)*
- [x] `POST /admin/tenants` → tenant + `trialing` subscription + invitation email; the boss accepts and logs in.
- [x] Payment `-100` with a note on a paid 1 000 € invoice that got 1 100 € → status recomputed; without a note → `400`; a correction below 0 total → `400`; `0` → `400`.
- [x] Company with IBAN/BIC → printed on the invoice PDF; without → the block shows the due date only.
- [x] Unit tests for each new handler. `npx tsc --noEmit` and `npx jest` clean.

## Notes to read

- [../auth-tokens.md](../auth-tokens.md)
- [../dashboard.md](../dashboard.md)
- [../subscription-plans.md](../subscription-plans.md)
- [../roles-permissions.md](../roles-permissions.md)
- [../client-portal.md](../client-portal.md)
