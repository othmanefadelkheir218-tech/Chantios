# Test Run — Results

> Filled in during the run. One section per phase. Plan: [00-START-HERE.md](00-START-HERE.md).

## Summary

| Phase | File | Passed | Failed | Skipped | Status |
|---|---|---|---|---|---|
| 01 | [Setup & automatic](01-setup-automatic.md) | 15 | 0 | 0 | done 2026-10-08 (AUTO-02 passed on re-run in phase 03) |
| 02 | [Platform](02-platform.md) | 47 | 0 | 0 | done 2026-10-08 (PLN-06 fixed + re-run; PA-05 run in phase 03) |
| 03 | [Auth](03-auth.md) | 53 | 1 | 0 | done 2026-10-08. SUS-01 and 2FA-02 fixed + re-run PASS; REG-04 fixed and seen live 2026-10-09 (French and Dutch) |
| 04 | [Permissions](04-permissions.md) | 53 | 0 | 1 | done 2026-10-08. OVR-02 and PLR-02 fixed 2026-10-09; OWN-02..05 run 2026-10-09: 4 PASS |
| 05 | [Media](05-media.md) | 36 | 0 | 0 | done 2026-10-08. ImageKit checks MED-02, 12, 16, 19, 22 PASS (owner, 2026-10-09); intermittent upload `500` open; worker single-file read fixed |
| 06 | [Clients & projects](06-clients-projects.md) | 28 | 1 | 0 | done 2026-10-08. PRJ-01 FAIL (date-only dates → 500), fixed 2026-10-09; PRJ-11 PASS 2026-10-09 (ImageKit `project/6/` empty) |
| 07 | [Catalogue & stock](07-catalogue-stock.md) | 26 | 0 | 0 | done 2026-10-08 |
| 08 | [Quotes & invoices](08-quotes-invoices.md) | 33 | 0 | 0 | done 2026-10-08 |
| 09 | [Purchases](09-purchases.md) | 33 | 0 | 0 | done 2026-10-08 (PUR-15 confirmed by owner) |
| 10 | [Planning & time](10-planning-time.md) | 35 | 0 | 0 | done 2026-10-08 |
| 11 | [Site reports](11-site-reports.md) | 26 | 0 | 0 | ran 2026-10-08; REP-15 PASS 2026-10-09 (ImageKit) |
| 12 | [Margin](12-margin.md) | 33 | 0 | 0 | ran 2026-10-09; ALT-08 PASS 2026-10-09 (3 emails in each inbox) |
| 13 | [Chat](13-chat.md) | 26 | 0 | 0 | ran 2026-10-09; CHAT-15 PASS 2026-10-09 (ImageKit); SUPC-01..04 passed in phase 17 |
| 14 | [Client portal](14-client-portal.md) | 29 | 0 | 0 | ran 2026-10-09; POR-15 failed, fixed and re-run PASS; POR-25 and POR-11 PASS 2026-10-09 |
| 15 | [Notifications](15-notifications.md) | 31 | 0 | 0 | ran 2026-10-09; NOT-28 PASS 2026-10-09 (API run once with a fake Resend key). Email checks done through the Resend API (delivered), not the inbox |
| 16 | [Documents](16-documents.md) | 17 | 0 | 0 | done 2026-10-09; DOC-05, DOC-13, DOC-14 confirmed by the owner |
| 17 | [Support & feedback](17-support-feedback.md) | 25 | 0 | 0 | done 2026-10-09; AN-04 run with the owner stopping Redis; also ran phase 13 SUPC-01..04 (4 PASS) |
| 18 | [Subscriptions & Stripe](18-subscriptions-stripe.md) | 55 | 0 | 0 | done 2026-10-09. First run 51/4. PSB-04 fixed + re-run PASS; STR-05 / STR-08 and DWN-02: the test plan was wrong (corrected) (manager gets no billing alert) |

## Failures

One row per failed scenario. Nothing is fixed during the run.

| ID | Sent | Expected | Got | Likely cause |
|---|---|---|---|---|
| AUTO-02 | `npx jest --config test/jest-e2e.json --forceExit` on the empty DB | 11 passed | 10 passed, 1 failed: `expect(withData.length).toBeGreaterThanOrEqual(2)` at `test/tenant-isolation.e2e-spec.ts:268`, received `1` (only `User` had rows from 2+ tenants) | **Not a leak** — line 267 (`failures` empty: every table returned only its own tenant's rows) passed. Line 268 is a data-coverage precondition that only held because `seed:tenants` gave `tenant_subscriptions` rows for 2 tenants. The test depends on seed data. Re-run after phase 03 (A and B registered → 2 subscription rows). **Re-run 2026-10-08 after phase 03: 11/11 PASS** |
| PLN-06 | `POST /api/admin/plans` with 13 invalid bodies, all named `TEST Bad` | every one `400`, **no plan written** | All 13 → `400`, DB plan count unchanged (3 → 3). **But** the 2 bodies that pass the DTO — a duplicate `feature_key` and only 5 keys — each left a Stripe Product `TEST Bad` (`prod_VP6L7QqNb6Lv4L`, `prod_VP6LnQnBrWolQf`) with an **active** €1/month Price | `create-plan.handler.ts:25-29` calls `stripe.createPlanPrice()` **before** `toFeatureRows()`, which throws the `Duplicate` / `Missing` errors. Any refusal after the Stripe call leaves an orphan Product + active Price. Versioning does not have this problem (PLN-11/12 left nothing). Found by the owner's Product catalogue screenshot. **FIXED 2026-10-08** (owner asked, exception to the no-code-change rule): `toFeatureRows()` now runs before the Stripe call; 2 unit asserts added (`createPlanPrice` not called on refusal — fail on old code, pass on new). Live re-run: 13 × `400`, 0 new Stripe products, DB 5 → 5 plans. The 2 orphan products + prices archived in Stripe |
| REG-04 | Register A with `locale: "fr"` | verification email in French | subject `Verify your email — ChantierOS`, body English (seen in Resend). Reset + invitation emails ARE French | `tenant-email-verification.template.ts` takes no `locale`; `alerts.md` § templates says every template takes `locale: 'fr' \| 'en' \| 'ar'`. B's English email passes only because English is the only text |
| SUS-01 | Suspend B, call routes with B owner's old access cookie | `403 This company is suspended or banned` | `403` on `/users`, `/clients`; **`200`** on `/auth/me`, `/auth/sessions`, `/roles`. Refresh `401`, login `401`, 0 live sessions — OK | those routes do not run `SubscriptionGuard`. `subscription-plans.md:91` says suspended = "no access at all". Window is the access cookie's 15 min; data shown is own profile + global roles — low impact |
| 2FA-02 | `TEST Staff` with a TOTP secret: login → challenge, 4 wrong codes, then the right one on the **same** challenge | challenge dead after 3 wrong tries | 4 × `401 Invalid code`, then `201` + session cookies | `verify-2fa.handler.ts` has no attempt counter. `auth-tokens.md:104` says `admin_2fa` max 3; the 2026-10-05 decision (line 110) dropped the `one_time_codes` row, and the limit went with it |
| OVR-02 | `GET /api/roles/permissions` as A owner, compared with the plan tables | 112 rows equal to the tables | 108 equal. 4 differ: worker `tasks` and `reports` have `can_create` and `can_edit` = `true` (scope own); the plan says `false`. The behaviour is still right: worker `POST /tasks` → `403 Your role can only view the tasks assigned to you`, `POST /reports` → `403 ...can only log hours` (refused in the handler) | **FIXED 2026-10-09** (owner chose: worker is view only): new level `own_view` in `permission.helper.ts`; worker `tasks` and `reports` are now `can_view` only, scope `own`. Live: `GET /api/roles/permissions` worker rows match the plan; worker `POST /tasks` → `403 No canCreate access to tasks` (from the guard now), `GET /tasks` and `GET /reports` → `200`. Old cause: the default matrix in code gave worker create/edit on these two modules and the handler refused — plan tables (and the note, "own tasks") say view only |
| PLR-02 | Staff admin: `POST /admin/plans`, `PATCH /admin/tenants/:id/status` | `403 Not allowed for your admin role` | `403` on `/admin/admin-users` and `/admin/audit-logs` only. `POST /admin/plans` (valid body, duplicate key) → `400 Duplicate feature_key`; `PATCH /admin/tenants/2/status {status:active}` → `400 Tenant is already active` — both reached the handler, so staff is **not** refused | **FIXED 2026-10-09:** new right `admin_users.can_manage_tenants` (default `false`) + `AdminTenantAccessGuard` on `PATCH /admin/tenants/:id/status`. Live: staff `403`; after the super_admin grants it `200`; right removed `403`. Old text: `roles-permissions.md` says platform staff = "Full platform", so the plan (not the code) may be wrong — owner to decide |
| PRJ-01 | `POST /api/projects` with `start_date 2026-11-02` | `201` | `500`; full ISO `2026-11-02T00:00:00.000Z` → `201`. `PATCH` with a date-only date → `500` too | date-only string reaches Prisma as a string; no `IsDateOnly`/`Date` conversion on project dates (see step 09's fix). **FIXED 2026-10-09** (owner asked): the create and update handlers now pass `new Date(...)`; +2 unit tests. **Live re-run 2026-10-09: PASS** — `POST` date-only → `201`, `PATCH` date-only → `200`, invalid date → `400`, end before start → `400` |

| DWN-02 | `select count(*) from media where tenant_id = B and is_locked` | `0` | `1` (frozen quote PDF, phase 16) | test premise wrong; cycle run on `TEST Epsilon` |
| PSB-04 | Staff admin `PATCH /admin/subscriptions/1/plan` | `403` | `200`, pending plan set, audit row | only 2 controllers carry `@AdminRoles('super_admin')` (same as PLR-02) — owner to decide **FIXED 2026-10-09** (owner decision): billing write routes are `super_admin` only unless `admin_users.can_manage_billing` is true; live re-run: staff `403` on 6 routes, right on → `200`, off → `403`. **FIXED 2026-10-09** (owner decision): billing write routes are `super_admin` only unless `admin_users.can_manage_billing` is true; live re-run: staff `403` on 6 routes, right on `200`, off `403`. |
| STR-05 / STR-08 | `payment_intent.payment_failed` / `invoice.upcoming`, count recipients | owner + manager | owner only | manager role cannot view `settings`; the recipient filter drops it — owner to decide **RESOLVED 2026-10-09**: owner only is right (`alerts.md` § 3); the test plan was corrected, no code change. |
| POR-15 | Portal accept of a sent quote, then read `audit_logs` | audit row `portal_accept` with client id + token id + IP | `201`, quote/project/reservations/history all as stated. Audit row: `new_value {"client_id": 1, "portal_token_id": "[redacted]"}`, `ip_address ::1`. Same for `portal_refuse` | the audit helper (`src/audit/helpers/audit.helper.ts`) redacts every key containing `token`, which also hid the portal link's **id** (not the secret). **FIXED 2026-10-09** (owner asked, exception to the no-code-change rule): the handlers now write `portalLinkId`; live re-run `{"client_id": 1, "portal_link_id": 9}`; unit test updated, 46/46 pass |

## Problems found (not tied to one scenario)

| # | Found | Problem | Impact |
|---|---|---|---|
| 1 | 2026-10-08, before the run | `yarn seed:reset` fails on Prisma 7: `prisma migrate reset --skip-seed` — the option was removed | the full-reset script cannot be used; run `prisma migrate reset --force` and `reset.seed.ts` separately |
| 2 | 2026-10-08, before the run | The Telegram bot's file watcher stalled; restarting `telegram-bot.js` fixed it | tooling only, not the app |
| 3 | 2026-10-08, before the run | An old `nest start --watch` from the day before was still running next to the real server | a second instance can take queue jobs (emails) — check SET-07 before every session |
| 4 | 2026-10-08, phase 02 | `vat_number` on a tenant takes any text (`"bad!!"` → `201`) | no note sets a format (`TEXT`), so not a failure. Created a stray tenant `TEST X` (id 7), soft-deleted at once |
| 5 | 2026-10-08, phase 02 | `PATCH /admin/tenants/:id` with `{}` writes an `update` audit entry with old = new; a repeated plan/admin-user deactivate writes a second entry | audit noise only — **fixed 2026-10-09** (no audit entry when nothing changed; see OPEN-PROBLEMS #21) |
| 6 | 2026-10-08, phase 02 | Every plan version creates a **new** Stripe Product (2 `TEST Throwaway` products); a deactivated plan archives its Price but the Product stays `active` | the dashboard product list shows old plans as "Active" — confusing, not wrong |
| 7 | 2026-10-08, phase 02 | The test plan has no successful `PATCH /plans/:id/default` call, so AUD-03's `set_default` entry cannot appear. Fixed in the run by setting `TEST Small` default again (no change, `200`, entry written) | test-plan gap |
| 8 | 2026-10-08, phase 03 | Every platform alert also goes to `admin@chantieros.local` (the super-admin's `.env` email) — Resend marks each one **bounced** | config: give the super-admin a real address, or bounces may hurt the sending domain |
| 9 | 2026-10-08, phase 03 | All test emails land in Gmail **Spam** ("similar to messages identified as spam") | deliverability of `noreply@zouadev.com`; test only — check before real users |
| 11 | 2026-10-08, phase 05 | Intermittent `500` on `POST /api/media` (3 of ~35 uploads), cause unknown — see 05-media.md | open |
| 12 | 2026-10-08, phase 11 | `POST /api/media` `500` again on the first upload (REP-14), `201` on retry — right after the dev watcher restarted the server (same pattern as phase 05's first uploads) | clue for problem 11: first upload after a pause / restart |
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

### Data re-seed — 2026-10-08 (after the DB was found holding the old demo data)

All 52 tables were emptied again (migrations kept), then rebuilt by hand so phase 04+ can run. Not a test result.
- `seed:data` + `seed:admin`; plans `TEST Small` (1, default), `TEST Zero Storage` (2), `TEST Big` (3) and staff admin `TEST Staff` (2) created **through the API** (real Stripe Prices).
- Company A `TEST Alpha Renovation` (tenant 1, fr) with 8 users and company B `TEST Beta Bouw` (tenant 2, en) with its owner, inserted **directly in the DB** (no emails). All verified, trialing on `TEST Small`, password `TestPass@2026!`, worker PINs 1234 / 5678, rates supervisor 30, worker 20, worker 2 25.
- **Not recreated:** `TEST Gamma`, `TEST Delta`, `TEST Throwaway`, the spare users, invitations. User ids differ from the phase 03 log (A owner = 1 … accountant = 8, B owner = 9).

### Phase 04 — 2026-10-08

- **Ran:** 7 roles × 16 modules (view / create / edit / delete, 400+ calls), admin-only routes, overrides, company isolation, platform staff.
- **Result:** 49 PASS, 2 FAIL (OVR-02, PLR-02), 5 SKIP (OWN-02..05 need tasks, time entries, files, threads from phases 06–11; ISO-05 is checked in each later phase).
- **Notes:** ISO-01 total is 8 for A (the plan says 9: the deactivated spare user was not re-seeded). OVR-04: B's manager has no invoices access while A's has (override isolated). `yarn test:e2e` must run with `--forceExit` (plain `yarn test:e2e` never exits). Media `DELETE /api/media {ids:[999999]}` answers `200` for an unknown id (guard passes). Worker `time_entries` DELETE → `403`.
- **Data left:** nothing new. The override rows were deleted (OVR-06). Test cookies are in the scratchpad (`jar-*.txt`).

### Fixes after phase 04 — 2026-10-08 (owner asked for them)

No scenario text changed. Code changes, all unit-tested (723 tests pass, tsc clean):
- **SUS-01** — new `TenantStatusGuard` (`src/auth/guards/`), used by `@TenantAuth()` and `@SessionAuth()`; `SubscriptionGuard` no longer holds the status rule. Live: suspended B → `403 This company is suspended or banned` on `/auth/me`, `/auth/sessions`, `/roles`, `/users`, `/clients`; refresh `401`; reactivated → login works. Side effect: `POST /auth/logout` and `/auth/change-password` are also refused for a suspended company (its sessions are revoked anyway).
- **2FA-02** — `admin-login` now opens a real `admin_2fa` row in `one_time_codes` (it used a fake `codeId 0`); `verify-2fa` takes one try before checking the code (3 tries, atomic). Live: 3 wrong → 4th `401 challenge expired`, the right code on that dead challenge `401`; a newer login kills the older token; a used challenge cannot be replayed; 2 wrong + right → `201`.
- **REG-04** — `tenantEmailVerificationTemplate(code, locale)` (fr / en / ar, same pattern as the reset and invitation templates), used by register and by the admin-created-tenant verification. Unit-checked only; **Live check 2026-10-09:** registered `TEST Mail FR` (`locale fr`, tenant 9) and `TEST Mail NL` (`locale nl`, tenant 10). Resend: subject `Vérifiez votre email — ChantiOs` (fr) and `Bevestig uw e-mailadres — ChantiOs` (nl), both delivered, body in the right language, new layout, plain-text part present. PASS.
- **Not touched:** OVR-02 and PLR-02 — waiting for the owner's decision. Not committed (run in progress).

### Phase 08 — 2026-10-08

- **Ran:** quotes (numbering, VAT, send, acceptance chain, expiry, refuse), invoices (due date, payments ledger, cancel, late, reminder), roles, isolation.
- **Result:** 33 PASS, 0 FAIL. Emails confirmed by the owner.
- **Data left:** see the end of 08-quotes-invoices.md (Q-MAIN accepted, project 4 in_progress, reservations Paint 9 / Tape 3 / Filler 1.2, INV-1 paid, INV-4 late).

### Phase 09 — 2026-10-08

- **Ran:** subcontractors, contracts, suppliers, cost types, purchase invoices (app rules + direct DB checks), PDF upload, stock link, roles, isolation.
- **Result:** 33 PASS, 0 FAIL, 0 SKIP (PUR-15 ImageKit confirmed by the owner afterwards).
- **Data left:** see the end of 09-purchases.md.

### Phase 10 — 2026-10-08

- **Ran:** tasks + assignees, time entries (frozen rate, day rule across projects, one row per day, correction rules), worker scope, labour cost, roles, isolation.
- **Result:** 35 PASS, 0 FAIL, 0 SKIP.
- **Data left:** see the end of 10-planning-time.md.

### Phase 11 — 2026-10-08

- **Ran:** reports (upsert, roles, dates, audit), progress read, material pre-fill, material declaration (one transaction), photos, the two report crons, isolation.
- **Result:** 25 PASS, 0 FAIL, REP-15 waiting for the owner's ImageKit check.
- **Data left:** see the end of 11-site-reports.md. Phase 04 section 3 (`scope = own`) can now be re-run.

### Phase 12 — 2026-10-09

- **Ran:** live margin, breakdown, 80/95 alerts, closure snapshot on `completed` and `cancelled`, list, roles, isolation.
- **Result:** 33 PASS, 0 FAIL, ALT-08 PASS (owner's email check, 2026-10-09).
- **Notes:** a date-only project date gives `500` again (PRJ-01). ISO-MA-01: B's list shows its own project (`total 1`). The stray `dist/main` server was stopped by hand and the dev server restarted with `yarn start:dev`.
- **Data left:** see the end of 12-margin.md.

### Phase 13 — 2026-10-09

- **Ran:** conversations, membership on HTTP and sockets, real-time messages, attachments, read tracking, archive, isolation.
- **Result:** 21 PASS, 0 FAIL, CHAT-15 waiting for the owner's ImageKit check, SUPC-01..04 skipped (need a ticket from phase 17).
- **Data left:** see the end of 13-chat.md.

### Phase 14 — 2026-10-09

- **Ran:** portal link (generate, replace, revoke, expire, status), the three checks and the one generic `403`, the allow-list scan, accept / refuse through the shared handlers (compared with a staff accept), progress + photos, documents + tracking, client messages (socket, notification, staff reply, read rows), isolation (B), rate limit.
- **Result:** 29 PASS, 0 FAIL, POR-11 and POR-25 PASS (owner's email check, 2026-10-09). POR-15 failed first and was fixed at the owner's request (see Failures).
- **Notes:** the `403` answers have no `Cache-Control: no-store` (only the `200` answers do). Setup hit PRJ-01 again (date-only project dates → `500`). The test file said POR-22 trips the rate limit; it is POR-29 (corrected). The API on port 5300 is a `dist/main` process (built after the last source change), not `yarn start:dev` — two `start:dev` watchers do not hold the port.
- **Data left:** see the end of 14-client-portal.md.

### Phase 15 — 2026-10-09

- **Ran:** stock and margin alerts, the time crons (end of day in 2 time zones, missing timesheet, stalled project), billing alerts, task alerts, client emails (A French, B English), platform alerts, reading and marking, sockets, retention, isolation.
- **Result:** 31 PASS, 0 FAIL, 0 SKIP (NOT-28 PASS 2026-10-09).
- **Notes:** the emails work (Resend `delivered`); only `admin@chantieros.local` bounces (problem 8). The task-starting cron takes only `planned` tasks. Stale jest e2e processes were stopped before the run; the old `dist/main` on port 5300 was stopped so the owner can run `yarn start:dev`.
- **Data left:** see the end of 15-notifications.md.

### Phase 16 — 2026-10-09

- **Ran:** draft render (no media row), live edit, freeze on send (1 locked row, quote and invoice), byte-identical downloads, delete refused, the VAT block and totals, the invoice payment block, the letterhead (no logo, logo, logo changed after freezing), portal document download, isolation (B), the `TODO: step 15` grep.
- **Result:** 17 PASS, 0 FAIL. DOC-05 [CHECK IMAGEKIT], DOC-13 and DOC-14 [CHECK EMAIL] confirmed by the owner.
- **Notes:** the Resend API does not list attachments, so only the owner can confirm them. The 3 client emails were still `queued` at Resend a few minutes after sending. A's logo is now a new test PNG (media 62).
- **Data left:** see the end of 16-documents.md.

### Phase 17 — 2026-10-09

- **Ran:** tickets (open, assign, reply, status, close, isolation), the admin support door (phase 13 SUPC-01..04), feedback, analytics, impersonation (enter, exit, no-admin company, staff).
- **Result:** 25 PASS, 0 FAIL, 0 SKIP (AN-04 run after the owner stopped Redis). The owner confirmed the SUP-03 email arrived.
- **Notes:** staff admin may impersonate (IMP-06: 201). Two business rules decided and fixed after the run: `/feedback/mine` shows only the caller's own feedback, and a feedback status change is audited (live re-checked, 3 unit tests). The dev watcher restarted the API once mid-run.
- **Data left:** see the end of 17-support-feedback.md. New company `TEST Gamma` (id 8, no users).

### Phase 18 — 2026-10-09

- **Ran:** billing views, over-limit (never blocked), forbidden plan changes, upgrade, the storage downgrade gate, platform subscriptions, Stripe webhooks (signed + CLI), the renewal.
- **Result:** 51 PASS, 4 FAIL (DWN-02, PSB-04, STR-05, STR-08), 0 SKIP. Owner checks done (ImageKit, Stripe, emails, worker3 token).
- **Notes:** the first `stripe listen` matched no events (space-separated `--events`); event 1 was re-processed at each API restart (duplicate alerts); one `period_end` shifted by 1 hour (DST). Details in 18-subscriptions-stripe.md.
- **Data left:** see the end of 18-subscriptions-stripe.md.

### Phase 15 — 2026-10-09

- **Ran:** stock and margin alerts, the time crons (end of day in 2 time zones, missing timesheet, stalled project), billing alerts, task alerts, client emails (A French, B English), platform alerts, reading and marking, sockets, retention, isolation.
- **Result:** 30 PASS, 0 FAIL, 1 SKIP (NOT-28).
- **Notes:** the emails work (Resend `delivered`); only `admin@chantieros.local` bounces (problem 8). The task-starting cron takes only `planned` tasks. Stale jest e2e processes were stopped before the run; the old `dist/main` on port 5300 was stopped so the owner can run `yarn start:dev`.
- **Data left:** see the end of 15-notifications.md.
