# Test Run — Results

> Filled in during the run. One section per phase. Plan: [00-START-HERE.md](00-START-HERE.md).

## Summary

| Phase | File | Passed | Failed | Skipped | Status |
|---|---|---|---|---|---|
| 01 | [Setup & automatic](01-setup-automatic.md) | 15 | 0 | 0 | done 2026-10-08 (AUTO-02 passed on re-run in phase 03) |
| 02 | [Platform](02-platform.md) | 47 | 0 | 0 | done 2026-10-08 (PLN-06 fixed + re-run; PA-05 run in phase 03) |
| 03 | [Auth](03-auth.md) | 51 | 3 | 0 | done 2026-10-08 |
| 04 | [Permissions](04-permissions.md) | | | | todo |
| 05 | [Media](05-media.md) | | | | todo |
| 06 | [Clients & projects](06-clients-projects.md) | | | | todo |
| 07 | [Catalogue & stock](07-catalogue-stock.md) | | | | todo |
| 08 | [Quotes & invoices](08-quotes-invoices.md) | | | | todo |
| 09 | [Purchases](09-purchases.md) | | | | todo |
| 10 | [Planning & time](10-planning-time.md) | | | | todo |
| 11 | [Site reports](11-site-reports.md) | | | | todo |
| 12 | [Margin](12-margin.md) | | | | todo |
| 13 | [Chat](13-chat.md) | | | | todo |
| 14 | [Client portal](14-client-portal.md) | | | | todo |
| 15 | [Notifications](15-notifications.md) | | | | todo |
| 16 | [Documents](16-documents.md) | | | | todo |
| 17 | [Support & feedback](17-support-feedback.md) | | | | todo |
| 18 | [Subscriptions & Stripe](18-subscriptions-stripe.md) | | | | todo |

## Failures

One row per failed scenario. Nothing is fixed during the run.

| ID | Sent | Expected | Got | Likely cause |
|---|---|---|---|---|
| AUTO-02 | `npx jest --config test/jest-e2e.json --forceExit` on the empty DB | 11 passed | 10 passed, 1 failed: `expect(withData.length).toBeGreaterThanOrEqual(2)` at `test/tenant-isolation.e2e-spec.ts:268`, received `1` (only `User` had rows from 2+ tenants) | **Not a leak** — line 267 (`failures` empty: every table returned only its own tenant's rows) passed. Line 268 is a data-coverage precondition that only held because `seed:tenants` gave `tenant_subscriptions` rows for 2 tenants. The test depends on seed data. Re-run after phase 03 (A and B registered → 2 subscription rows). **Re-run 2026-10-08 after phase 03: 11/11 PASS** |
| PLN-06 | `POST /api/admin/plans` with 13 invalid bodies, all named `TEST Bad` | every one `400`, **no plan written** | All 13 → `400`, DB plan count unchanged (3 → 3). **But** the 2 bodies that pass the DTO — a duplicate `feature_key` and only 5 keys — each left a Stripe Product `TEST Bad` (`prod_VP6L7QqNb6Lv4L`, `prod_VP6LnQnBrWolQf`) with an **active** €1/month Price | `create-plan.handler.ts:25-29` calls `stripe.createPlanPrice()` **before** `toFeatureRows()`, which throws the `Duplicate` / `Missing` errors. Any refusal after the Stripe call leaves an orphan Product + active Price. Versioning does not have this problem (PLN-11/12 left nothing). Found by the owner's Product catalogue screenshot. **FIXED 2026-10-08** (owner asked, exception to the no-code-change rule): `toFeatureRows()` now runs before the Stripe call; 2 unit asserts added (`createPlanPrice` not called on refusal — fail on old code, pass on new). Live re-run: 13 × `400`, 0 new Stripe products, DB 5 → 5 plans. The 2 orphan products + prices archived in Stripe |
| REG-04 | Register A with `locale: "fr"` | verification email in French | subject `Verify your email — ChantierOS`, body English (seen in Resend). Reset + invitation emails ARE French | `tenant-email-verification.template.ts` takes no `locale`; `alerts.md` § templates says every template takes `locale: 'fr' \| 'en' \| 'ar'`. B's English email passes only because English is the only text |
| SUS-01 | Suspend B, call routes with B owner's old access cookie | `403 This company is suspended or banned` | `403` on `/users`, `/clients`; **`200`** on `/auth/me`, `/auth/sessions`, `/roles`. Refresh `401`, login `401`, 0 live sessions — OK | those routes do not run `SubscriptionGuard`. `subscription-plans.md:91` says suspended = "no access at all". Window is the access cookie's 15 min; data shown is own profile + global roles — low impact |
| 2FA-02 | `TEST Staff` with a TOTP secret: login → challenge, 4 wrong codes, then the right one on the **same** challenge | challenge dead after 3 wrong tries | 4 × `401 Invalid code`, then `201` + session cookies | `verify-2fa.handler.ts` has no attempt counter. `auth-tokens.md:104` says `admin_2fa` max 3; the 2026-10-05 decision (line 110) dropped the `one_time_codes` row, and the limit went with it |

## Problems found (not tied to one scenario)

| # | Found | Problem | Impact |
|---|---|---|---|
| 1 | 2026-10-08, before the run | `yarn seed:reset` fails on Prisma 7: `prisma migrate reset --skip-seed` — the option was removed | the full-reset script cannot be used; run `prisma migrate reset --force` and `reset.seed.ts` separately |
| 2 | 2026-10-08, before the run | The Telegram bot's file watcher stalled; restarting `telegram-bot.js` fixed it | tooling only, not the app |
| 3 | 2026-10-08, before the run | An old `nest start --watch` from the day before was still running next to the real server | a second instance can take queue jobs (emails) — check SET-07 before every session |
| 4 | 2026-10-08, phase 02 | `vat_number` on a tenant takes any text (`"bad!!"` → `201`) | no note sets a format (`TEXT`), so not a failure. Created a stray tenant `TEST X` (id 7), soft-deleted at once |
| 5 | 2026-10-08, phase 02 | `PATCH /admin/tenants/:id` with `{}` writes an `update` audit entry with old = new; a repeated plan/admin-user deactivate writes a second entry | audit noise only |
| 6 | 2026-10-08, phase 02 | Every plan version creates a **new** Stripe Product (2 `TEST Throwaway` products); a deactivated plan archives its Price but the Product stays `active` | the dashboard product list shows old plans as "Active" — confusing, not wrong |
| 7 | 2026-10-08, phase 02 | The test plan has no successful `PATCH /plans/:id/default` call, so AUD-03's `set_default` entry cannot appear. Fixed in the run by setting `TEST Small` default again (no change, `200`, entry written) | test-plan gap |
| 8 | 2026-10-08, phase 03 | Every platform alert also goes to `admin@chantieros.local` (the super-admin's `.env` email) — Resend marks each one **bounced** | config: give the super-admin a real address, or bounces may hurt the sending domain |
| 9 | 2026-10-08, phase 03 | All test emails land in Gmail **Spam** ("similar to messages identified as spam") | deliverability of `noreply@zouadev.com`; test only — check before real users |
| 10 | 2026-10-08, phase 03 | Invitation link is `http://localhost:5300/invitations/accept?...` — the API port, no frontend page | expected today (no frontend); `APP_URL` must change later |

## User checks

Each **[CHECK ...]** answer you gave, so the result is traceable.

| ID | What | Your answer | Date |
|---|---|---|---|
| PLN-02/10/14 | Stripe Products: `TEST Small` €10/month, `TEST Throwaway` prices archived | Product catalogue screenshot: `TEST Small` €10.00/month present, 2 `TEST Throwaway` products (€11, €12). Price `active: false` confirmed by Stripe CLI. Screenshot also showed the 2 orphan `TEST Bad` products → PLN-06 FAIL | 2026-10-08 |
| TEN-11/13 | 2 verification codes for `TEST Gamma` | both arrived: `670783` (first, correctly refused after the 2nd send) and `253659` (second, sent on Telegram, verified) | 2026-10-08 |
| REG-04/07 | Verification email language | owner sent the codes; language read from Resend: A = English (FAIL), B = English (PASS) | 2026-10-08 |
| INV-02 | 7 invitations | Resend: all 7 delivered, French subject; owner found them in Spam | 2026-10-08 |

## Phase logs

Each phase adds a short section here when it ends: what ran, what failed, the data it left behind for the next phase.

### Phase 01 — 2026-10-08

- **Ran:** stack checks, `seed:data`, `seed:admin`, unit tests, e2e, lint, compile.
- **Result:** 14 PASS, 1 FAIL (AUTO-02, a test that depends on seed data — not an isolation leak).
- **Deviation:** AUTO-04 compiled with `tsc -p tsconfig.build.json` into the scratchpad instead of `yarn build`, because `nest-cli.json` has `deleteOutDir: true` and `yarn build` would delete the `dist/` the running server uses.
- **`yarn lint` runs with `--fix`:** it changed no file this time (`git status` clean apart from `PhacesTest/`), but it can rewrite source files — worth knowing.
- **Data left:** 7 roles, 3 shared cost types, 10 shared categories, super-admin `admin@chantieros.local`. No plan, tenant or user.
- **To do later:** re-run AUTO-02 after phase 03.

### Phase 02 — 2026-10-08

- **Ran:** admin login/guards, plans + Stripe, tenants, verification codes, admin users, audit log.
- **Result:** 45 PASS, 1 FAIL (PLN-06 — a refused plan leaves an orphan Stripe Product + active Price), 1 SKIP (PA-05, needs a tenant user → phase 03).
- **TEN-12 proof:** `one_time_codes` row 1 had 1 failed attempt and was only consumed at the second send's time — the real code survived the wrong one.
- **Data left:** plans `TEST Small` (id 1, default), `TEST Zero Storage` (2), `TEST Big` (3), `TEST Throwaway` (4, replaced) + its version (5, inactive). Tenants `TEST Gamma` (5, verified, Liège), `TEST Delta` (6), `TEST X` (7, soft-deleted). Admin users `TEST Staff` (2, staff, active), `TEST Twelve Renamed` (3, inactive). Stripe: 2 `TEST Bad` products, archived.
- **Fix:** PLN-06 fixed the same day at the owner's request and re-run → PASS. Final: 46 PASS, 0 FAIL, 1 SKIP. Orphan `TEST Bad` products archived.
- **To do later:** PA-05 in phase 03.

### Phase 03 — 2026-10-08

- **Ran:** register, verify, login/refresh/sessions, passwords, invitations (7 roles), team, mobile PIN, suspension, admin 2FA, cleanup job. Also PA-05 (phase 02, PASS) and AUTO-02 (phase 01, now PASS).
- **Result:** 51 PASS, 3 FAIL (REG-04 verification email always English, SUS-01 three routes skip the suspension check, 2FA-02 no 3-tries limit).
- **Notes:** USR-03 returns `201` (POST convention), plan says `200`. MOB-06 message is `No canView access to team`, plan says `Insufficient role` — both `403`, counted PASS. Leader/accountant invitations were resent at 16:04 (owner could not find the first ones — they were in Spam); the old 15:47 tokens were then refused, which also proves INV-09 with real tokens. `chk_code_one_owner`: a `one_time_codes` row has `user_id` **or** `tenant_id`, not both — JOB-01 test rows use `user_id` only.
- **Data left:** company A `TEST Alpha Renovation` (tenant 8, fr, trialing on `TEST Small`): owner 5 (verified), manager 7, supervisor 8 (30/h), sales 9, worker 10 (20/h, PIN 1234), worker 2 11 (25/h, PIN 5678), leader 12, accountant 13, spare2 14 (inactive). Company B `TEST Beta Bouw` (tenant 9, en, trialing): owner 6 (not verified). All passwords `TestPass@2026!`. `TEST Staff` `totp_secret` back to NULL.
