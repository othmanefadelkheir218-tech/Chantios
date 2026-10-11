# Step 20 — End of the trial + dev tools

> Needs step 14 (subscriptions, billing, Stripe webhooks) and step 18 (admin hub).

## 1. Goal

A trial ends (reminder → grace → block), and the super-admin can fast-forward a company's subscription dates and run any nightly job now, to test it all in minutes.

## 2. Decide first

None — the rule is in [subscription-plans.md](../subscription-plans.md) § The end of the trial. Still open, not built here: grace after a failed payment (`A_progress-tracker.md`).

## 3. Tables

`tenant_subscriptions.grace_ends_at TIMESTAMPTZ NULL` — migration `20261010200000_subscription_grace_ends_at`. DDL: [Schema Proposal.md](../../Schema%20Proposal.md) § `tenant_subscriptions`.

## 4. Where the code lives

```
src/subscriptions/handlers/start-grace.handler.ts    past_due + grace_ends_at (+7 days) — trial end AND failed payment
src/subscriptions/handlers/shift-dates.handler.ts    dev tools: move the dates back N days
src/subscriptions/handlers/set-status.handler.ts     any status but past_due clears grace_ends_at
src/billing/handlers/run-renewal.handler.ts          skips cancelled; ends a trial at its first renewal
src/billing/handlers/trial-reminder.handler.ts       day 11 alert
src/billing/handlers/block-expired-grace.handler.ts  day 21 block
src/crons/trial-end.cron.ts                          daily 04:30: reminder + block, per company
src/auth/guards/subscription.guard.ts                @AllowLapsedSubscription() lets a blocked company read billing
src/dev-tools/                                       the dev tools module (no repository — it only calls services)
```

## 5. Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/auth/me` | session | + `subscription: { status, period_end, grace_ends_at }` (banner + blocked page) |
| `GET` | `/api/admin/dev/status` | super_admin + dev tools on | `{ enabled: true }`; `404` when off |
| `POST` | `/api/admin/dev/tenants/:tenantId/time-travel` | same | body `{ days }` (1–400): `period_start`, `period_end`, `pending_plan_effective_at`, `grace_ends_at` all move `days` earlier — as if `days` days passed |
| `POST` | `/api/admin/dev/jobs/:name/run` | same | runs one nightly job now (list in `dev-tools/helpers/dev-jobs.helper.ts`) |
| `POST` | `/api/admin/dev/tenants/:tenantId/simulate-payment` | same | body `{ result: 'succeeded' \| 'failed' }` — runs the real Stripe webhook handler with a fake event (gives the subscription a fake `cus_dev_<id>` customer when it has none) |

**Dev tools are on only when `NODE_ENV !== 'production'` AND `DEV_TOOLS=true`.** Otherwise every `/api/admin/dev` route is a `404`. `super_admin` only. Each write is audited.

## 6. Tasks

- [x] Migration + Prisma model
- [x] `EndTrialHandler`, `SetStatusHandler` clears the grace date, `ShiftDatesHandler`, `setStripeCustomerId`
- [x] Renewal: skip `cancelled`, end a trial
- [x] Trial reminder + block handlers, `trial-end.cron.ts`
- [x] 3 alert types `trial_ending`, `trial_ended`, `subscription_blocked` (fr / en / nl), staff with `settings`
- [x] Failed payment (`HandlePaymentFailedHandler`) → the same grace through `StartGraceHandler`; `subscription_payment_failed` gives the block date; never extends the date, never reopens a blocked company
- [x] `@AllowLapsedSubscription()` on the 3 billing read routes
- [x] `/auth/me` subscription block
- [x] `src/dev-tools/` module
- [x] Frontend: banner, blocked page, "Dev tools" tab in the admin company hub

## 7. Acceptance — all passed live 2026-10-10 (tenant 12)

1. ✅ New company → time-travel 11 days → run job `trial-end` → `trial_ending` alert. ("Only once" = `dedupeDays: 14`, unit-tested by the notifications module, not re-run live.)
2. ✅ Time-travel 3 more days → run `billing-renewal` → `past_due`, `grace_ends_at` = old period end + 7 days, `trial_ended` alert, `/auth/me` carries the grace date (the banner itself: browser test by the owner).
3. ✅ Time-travel 7 days → run `trial-end` → `cancelled`, `/auth/me` says `cancelled` (the blocked page: browser test by the owner), `GET /billing/subscription` still answers, `GET /projects` → `403`.
4. ✅ Simulate payment `succeeded` → `active`, `grace_ends_at` null, the app opens again.
5. ✅ `run-renewal` / the renewal cron on a `cancelled` company → skipped.
6. ✅ `DEV_TOOLS` unset → `/api/admin/dev/status` → `404`. A `staff` admin → `403`.
7. ✅ Simulate payment `failed` on an `active` company → `past_due` + `grace_ends_at` = now + 7 days; a second failure keeps the date; +7 days → `trial-end` → `cancelled`; a failure on the blocked company keeps it `cancelled`.
