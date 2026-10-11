# Phase 18 — Problems to handle

> Found in [18-subscriptions-stripe.md](18-subscriptions-stripe.md) on 2026-10-09. Ordered from most to least dangerous.
> Work one problem at a time. Tick the box when it is fixed and checked.

| # | Problem | Danger | Handle it? | Can I fix it? | Status |
|---|---|---|---|---|---|
| 1 | **Stripe event processed again at each API restart.** One queued job ran again. It re-rolled the billing period and sent duplicate `payment_received` alerts. | **High.** It touches money and the subscription state. A real payment could extend a period twice. | **Yes, first.** The cause is unknown, so investigate (likely a stalled BullMQ job) and make the handler skip an event that already has `processed_at`. | **Yes, probably.** The skip guard is easy and can be unit-tested. The exact root cause may stay unknown, but the guard stops the damage. | ✅ Fixed 2026-10-09: `process-webhook.handler.ts` skips an event whose `processed_at` is set (+2 unit tests, 46 stripe tests pass). Live: 2 full API restarts changed nothing (event 8, period, 8 alerts); a duplicate job for event 8 pushed into the queue was skipped (`already processed … skipping`). Root cause of the first re-run still unknown (it did not come back with the guard) |
| 2 | **Staff admin can change a company's plan** (PSB-04, same as PLR-02). Staff can also create plans. | **Medium.** A permission gap on billing. `roles-permissions.md` says staff has "Full platform", so it may be intended. | **Decided 2026-10-09:** `super_admin` only by default; a super_admin can give the right to one staff admin (`admin_users.can_manage_billing`, default false). | **Yes.** | ✅ Fixed 2026-10-09: new column + migration, `AdminBillingAccessGuard` on 6 write routes (plans create / deactivate / default / version, set pending plan, run-renewal), 11 new unit tests. Live: staff `403` on all 6, reads still `200`; right ON → `200`; right OFF → `403` at once; audit rows written. `roles-permissions.md` updated. `Schema Proposal.md` updated. PLR-02's other half (`PATCH /admin/tenants/:id/status`) is still open |
| 3 | **Period end shifts by 1 hour** (`13:43` to `14:43`). `addOneMonth` uses local time, so DST moves it. | **Low-medium.** Small drift, but every renewal date becomes wrong by an hour. | **Yes, small fix.** Use UTC in `addOneMonth`. | **Yes.** Small, safe change with a unit test. | ✅ Fixed 2026-10-09: `addOneMonth` now works in UTC and clamps to the last day of the month (31 Jan + 1 month = 28/29 Feb, not 3 March). 8 new unit tests (4 time zones, leap year, December, 31 Jan); the old code fails 2 of them (31 Jan → 3 March, hour +1). Live: a renewal on A rolled `16:51:01.054` to `16:51:01.054` (same hour) |
| 4 | **Manager gets no billing alerts** (STR-05, STR-08). The manager cannot view `settings`, so the recipient filter drops them. | **Low.** An alert is missed, but nothing breaks. | **Decided 2026-10-09: owner only.** `alerts.md` § 3 already says a manager gets no billing alerts, so the code was right and the plan was wrong. | **Yes.** Doc edit only. | ✅ Fixed 2026-10-09 (docs only, no code change): `alerts.md` now lists the 2 subscription alerts as main-admin only; STR-05 / STR-08 expect "owner only" and are PASS |
| 5 | **Pending plan applies at the first renewal** (REN-04). The code compares its date to the new period start. | **Low.** It works as designed. It only looks odd after a payment event moves the period. | **Logic is right** (a plan change waits for the end of the period). One small display detail was fixed in code. | **Yes.** | ✅ Fixed 2026-10-09: REN-04 wording corrected. Code: a successful payment (`payment_intent.succeeded`) now moves a waiting plan change's date to the new `period_end` (new `MovePendingPlanDateHandler`, 4 new unit tests; the renewal job is untouched). Live: pending date `2026-12-09` → `2026-11-09 17:30:09.956` = the new period end |
| 6 | **DWN-02: B has a locked file** (a frozen quote PDF from phase 16). | **None.** Test-plan error. | **Doc only.** | **Yes.** | ✅ Fixed 2026-10-09: the test now says to run the cycle on a company with 0 locked files (`TEST Epsilon`), DWN-02 PASS |

## Where each problem comes from

| # | Test IDs | Evidence |
|---|---|---|
| 1 | STR-01, STR-03 | `stripe_events` row 1: `processed_at` rewritten at 13:41:48. Redis `bull:stripe-webhooks:id` = 2 (only 2 jobs ever queued). Resend shows 3 `Payment received` mails for one event. The STR-03 replay itself did nothing. |
| 2 | PSB-04, PLR-02 | Staff `PATCH /admin/subscriptions/1/plan` returned `200`, audit row 397. Only `admin-users` and `audit` controllers carry `@AdminRoles('super_admin')`. |
| 3 | REN-03 | `period_end` `2027-01-09 13:43:47` became `2027-02-09 14:43:47` UTC. `run-renewal.handler.ts` uses `addOneMonth`. |
| 4 | STR-05, STR-08, BIL-04 | Only user 1 got `subscription_payment_failed` and `subscription_renewal_upcoming`. Manager gets `403 No canView access to settings`. |
| 5 | REN-04 | `apply-pending-plan-if-due.handler.ts` compares `pendingPlanEffectiveAt` to the new period start. |
| 6 | DWN-02 | `media` id 59, tenant 2, `QUO-2026-0001.pdf`, `is_locked = true`. |

## Rules while fixing

- Do not push to GitHub. Do not start or stop the server (the owner runs `yarn start:dev`).
- Code changes: add a unit test, run `npx tsc --noEmit` and `yarn test`.
- After a fix: re-run the failing test ID, then update its row in [18-subscriptions-stripe.md](18-subscriptions-stripe.md) and [RESULTS.md](RESULTS.md).
