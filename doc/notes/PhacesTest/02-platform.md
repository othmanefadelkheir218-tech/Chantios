# Phase 02 — Platform

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [subscription-plans.md](../subscription-plans.md), [entity-fields.md](../entity-fields.md) § tenants. Old reference: [../test/01-tenants.md](../test/01-tenants.md), [02-admin-users.md](../test/02-admin-users.md), [03-plans.md](../test/03-plans.md), [05-audit-analytics-feedback.md](../test/05-audit-analytics-feedback.md).

## Goal

The platform side works: admin login and guards, the plan catalogue (with the 3 small test plans), tenants, admin users and the audit log.

## Before you start

- Phase 01 passed. The only platform user is `admin@chantieros.local`.
- **No plan exists yet**, so registration (phase 03) is impossible until PLN-01 creates a default plan.
- Platform subscriptions, analytics and feedback are tested later (phases 17 and 18), when tenants have data.

---

## 1. Admin login and guards

| ID | Do | Expected | Result |
| --- | --- | --- | --- |
| PA-01 | `GET /api/admin/tenants` with no cookie | `401 Not authenticated` | PASS |
| PA-02 | `POST /api/admin/auth/login` super-admin | `201 { logged_in: true }`, cookies `admin_access_token` + `admin_refresh_token` (`totp_secret` is NULL, so no 2FA step) | PASS |
| PA-03 | Same `GET` with the cookie | `200` | PASS |
| PA-04 | Cookie `admin_access_token=abc` | `401 Invalid or expired session` | PASS |
| PA-05 | A **tenant** user's cookie on `/api/admin/...` (after phase 03) | `401` — the tenant cookie never opens the platform | PASS (run in phase 03) |

## 2. Plans — the small test plans

The bodies are in [00-START-HERE.md](00-START-HERE.md) § 4. All 6 `feature_key`s are always required.

| ID | Do | Expected | Result |
| --- | --- | --- | --- |
| PLN-01 | Create `TEST Small` with `"is_default": true` | `201`, 6 features sorted by key, `is_default: true`, `retention_days` overage forced to `"0"`, `stripe_price_id` = `price_...` | PASS |
| PLN-02 | **\[CHECK STRIPE\]** | Sandbox has a Product `TEST Small` with an active monthly EUR Price, `unit_amount` 1000 | PASS |
| PLN-03 | Create `TEST Zero Storage` (not default) | `201`, `storage_gb` limit `0`, `is_default: false` | PASS |
| PLN-04 | Create `TEST Big` (not default) | `201` | PASS |
| PLN-05 | Only one default | `select name from plans where is_default` → only `TEST Small` | PASS |
| PLN-06 | Invalid bodies (each is `400`, **no plan written**): a key twice → `Duplicate feature_key`; 5 keys → `All 6 features are required. Missing: <key>`; `max_planets`; `features: []`; `base_price` `abc` / `-5` / `1.234`; `limit_value` `-1` / `1.5`; `limit_value` `0.05` on `storage_gb`; no `name`; `tenant_id`; `stripe_price_id` | all `400`, plan count unchanged | PASS (re-run after fix, 2026-10-08 — first run FAIL, see RESULTS.md) |
| PLN-07 | `GET /api/admin/plans`, `?search=TEST`, `?is_active=true`, `?is_active=maybe`, `/:id`, `/abc`, `/999999999` | `200` paged / filtered / `400` / `200` with 6 features / `400` / `404 Plan not found` | PASS |
| PLN-08 | Deactivate `TEST Small` (the default) | `400 This is the default plan. Make another plan the default first...` | PASS |
| PLN-09 | Create `TEST Throwaway`, version it with `{ "base_price": "12.00" }` | `201`, new row has `parent_plan_id`, name + features copied; parent `is_active: false`; a **different** `stripe_price_id` | PASS |
| PLN-10 | **\[CHECK STRIPE\]** | the parent's old Price is `active: false`, the new one active | PASS |
| PLN-11 | Version the replaced parent again | `400 This plan is already replaced...` | PASS |
| PLN-12 | Version with only 1 feature | `400 All 6 features are required...` | PASS |
| PLN-13 | Deactivate the version from PLN-09 | `200 is_active: false`; again → `200`; making it default → `400` | PASS |
| PLN-14 | **\[CHECK STRIPE\]** | its Price is now `active: false` | PASS |

`TEST Small` is **not** versioned — the companies registered in phase 03 must stay on it.

## 3. Tenants (created by the super-admin)

These are extra companies made from the platform. Companies A and B are created by **registration** in phase 03.

| ID | Do | Expected | Result |
| --- | --- | --- | --- |
| TEN-01 | `POST /api/admin/tenants` `{ "name": "TEST Gamma", "email": "othmanefadelkheir218+gamma@gmail.com" }` | `201`, defaults `default_vat_rate "21"`, `default_payment_days 30`, `locale "fr"`, `currency "EUR"`, `timezone "Europe/Brussels"`, `end_of_day_reminder_time "18:00"`, `status "active"` | PASS |
| TEN-02 | Create `TEST Delta` with every field, email in mixed case | `201`, email stored lower case, every value returned | PASS |
| TEN-03 | Same email again, also in upper case | `409 Email ... is already used`, no new row | PASS |
| TEN-04 | Validation table from [../test/01-tenants.md](../test/01-tenants.md) TEN-04 (no name, bad email, bad phone, `country BEL`, `locale de`, bad VAT, `-1` days, `25:00`, `status`, `tenant_id`) | every one `400`, no row | PASS |
| TEN-05 | List, paging (`limit=1&page=2`), `limit=0/101`, `page=0`, search, `?status=` | as TEN-05 to TEN-07 in the old file | PASS |
| TEN-06 | `PATCH` some fields; `{}`; email to Delta's email; `status` in body; unknown id | `200` / `200` unchanged / `409` / `400` / `404` | PASS |
| TEN-07 | Suspend Gamma with a reason, then active again; `active` twice; `frozen`; `{}` | `200`, `200`, `400 Tenant is already active`, `400`, `400` | PASS |
| TEN-08 | Soft delete Gamma, read it, delete again, restore, restore again | `200 deleted_at set` → `404` → `400 already deleted` → `200` → `400 Tenant is not deleted` | PASS |
| TEN-09 | Bulk delete `[Gamma, Delta]` with Gamma already deleted; `ids: []` | `{ count: 1 }`, no error; `400` | PASS |
| TEN-10 | Bulk restore both | `{ count: 2 }` (or the number actually changed) | PASS |
| TEN-11 | `POST /:id/send-verification-email` on Gamma | `201 { sent: true }` — **\[CHECK EMAIL\]** `othmanefadelkheir218+gamma@gmail.com` gets a 6-digit code — **\[SEND ME CODE\]** | PASS |
| TEN-12 | Verify with `000000` | `400 Invalid or expired code`, real code still usable | PASS |
| TEN-13 | Send a second code, then verify with the **first** | `400` — a new code kills the old one. **\[CHECK EMAIL\]** second code arrives — **\[SEND ME CODE\]** | PASS |
| TEN-14 | Verify with the second code | `200`, `email_verified_at` set; again → `400 Email already verified`; send → `400` | PASS |
| TEN-15 | `{ "code": "123" }`, `"abcdef"`, `{}` | `400` each | PASS |

## 4. Admin users

| ID | Do | Expected | Result |
| --- | --- | --- | --- |
| ADM-01 | Create `othmanefadelkheir218+staff@gmail.com`, `TEST Staff`, password `TestStaff@2026!`, role `staff` | `201`, exactly 7 fields, **no** `password_hash` / `totp_secret`; DB hash starts `$argon2id` | PASS |
| ADM-02 | Same email in upper case | `409` | PASS |
| ADM-03 | Password 11 chars → `400`; exactly 12 → `201` (`TEST Twelve`, email `othmanefadelkheir218+twelve@gmail.com`); role `admin`; no name; bad email; extra `is_active` | as stated | PASS |
| ADM-04 | List, search by name and by email, paging | no hash in any row | PASS |
| ADM-05 | Rename; role → `super_admin` and back; new password (hash changes); short password; `email` in body; role `owner` | `200`, `200`, `200`, `400`, `400`, `400` | PASS |
| ADM-06 | Deactivate `TEST Twelve`; again; unknown id | `204`, row kept `is_active false`; `204`; `404` | PASS |
| ADM-07 | Log in as the staff admin (own cookie file): `GET /admin/tenants`, `/admin/admin-users`, `/admin/audit-logs` | `200`, `403 Not allowed for your admin role`, `403` | PASS |

## 5. Audit log

| ID | Do | Expected | Result |
| --- | --- | --- | --- |
| AUD-01 | `GET /api/admin/audit-logs?tenant_id=<Gamma>` | the `create` entry: `admin_user_id` = super-admin id, IP set, `new_value` snake_case | PASS |
| AUD-02 | `?action=update` / `?action=set_status` on Gamma | old and new values, the suspend reason | PASS |
| AUD-03 | `?entity_type=plan` | `create`, `set_default`, `create_version`, `deactivate` | PASS |
| AUD-04 | `?entity_type=admin_user` | `create`, `update`, `deactivate`; `password` shows `[redacted]`, the clear password appears nowhere | PASS |
| AUD-05 | A refused call (TEN-07 `already active`) | wrote **no** entry | PASS |
| AUD-06 | Filters + paging; `?tenant_id=abc` | filtered; `400`. No route edits or deletes an entry | PASS |
