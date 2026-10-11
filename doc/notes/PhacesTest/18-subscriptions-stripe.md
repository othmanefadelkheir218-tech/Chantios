# Phase 18 — Subscriptions, Plan Limits & Stripe

> **Status: 55 PASS, 0 FAIL, 0 SKIP.** (PSB-04 fixed 2026-10-09; STR-05 / STR-08: the plan was wrong, decided 2026-10-09) Result and notes at the end.

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [subscription-plans.md](../subscription-plans.md).
> Old reference: [../test/04-subscriptions.md](../test/04-subscriptions.md), [../test/18-subscriptions-stripe.md](../test/18-subscriptions-stripe.md).

## Goal

The plan is enforced the way the rules say:

| Situation | Rule |
|---|---|
| Going **over** an allowance (workers, managers, clients, subcontractors, storage) | **allowed**, billed as overage at renewal — never blocked |
| Subscription `cancelled`, company `suspended` / `banned` | **blocked** — no access |
| Card failed (`past_due`) | **still allowed** — a failed card never locks a company out of its own data |
| **Downgrade** to a plan with less storage than used | **refused** until the company deletes files below the new limit |
| A plan change | only at the **next renewal**, never mid-cycle |

## Before you start

- A and B are `trialing` on `TEST Small` (see [00-START-HERE.md](00-START-HERE.md) § 4 for the limits).
- `stripe listen` is running and forwarding to `localhost:5300` (phase 01 SET-09).
- **No checkout page exists.** Payments are made with `stripe trigger`, which uses Stripe's own test cards: `payment_intent.succeeded` pays with `4242 4242 4242 4242`, `payment_intent.payment_failed` with a declined card (`4000 0000 0000 0002`). You are **not** asked to type a card. Events the CLI cannot trigger (`invoice.upcoming`) are sent with the signed script (`stripe.webhooks.generateTestHeaderString`).
- There is no route that sets `tenant_subscriptions.stripe_customer_id`. It is set in the DB from a sandbox customer created with `stripe customers create --email othmanefadelkheir218@gmail.com`.

---

## 1. What the company sees

| ID | Do | Expected | Result |
|---|---|---|---|
| BIL-01 | Owner `GET /api/billing/subscription` | plan `TEST Small`, its limits, the period, `trialing` | PASS |
| BIL-02 | `GET /api/billing/usage` | one row per billed dimension (`max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb`) — never `retention_days`, never projects — computed **live** | PASS |
| BIL-03 | The live numbers for A | workers `2` (limit 2, overage 0); managers `6` (admin, manager, supervisor, leader, sales, accountant — the deactivated spare **not** counted) → `3 × 5.00 = 15.00`; clients = active clients (≥ 4) → overage; subcontractors `3` → `1 × 1.00`; storage a few MB → `0` | PASS |
| BIL-04 | Manager / worker `GET /api/billing/subscription` | `403` (`settings` is admin only) | PASS |

## 2. Over the limit — allowed, never blocked

| ID | Do | Expected | Result |
|---|---|---|---|
| LIM-01 | Invite and accept a 3rd worker (`winucardit+worker3@gmail.com`) — limit 2 | `201`, no error. **[CHECK EMAIL]** invitation — **[SEND ME CODE]** | PASS |
| LIM-02 | `GET /api/billing/usage` | workers `3`, overage `1 × 2.00` | PASS |
| LIM-03 | Create a 5th client, a 4th subcontractor | `201`, no error | PASS |
| LIM-04 | Owner deactivates the 3rd worker | usage back to `2` workers, overage `0` — "active" means active **now** | PASS |
| LIM-05 | No request anywhere answered "limit reached" during phases 03–17 | confirmed from RESULTS.md | PASS |

## 3. Not allowed — the company cannot change its own plan by force

| ID | Do | Expected | Result |
|---|---|---|---|
| NOA-01 | Manager / sales / accountant `POST /api/billing/change-plan` | `403` — admin only | PASS |
| NOA-02 | Owner `change-plan` to `TEST Small` (the current plan) | `400 The tenant is already on this plan` | PASS |
| NOA-03 | Owner `change-plan` to a deactivated plan (phase 02 PLN-13) | `400 This plan is closed to new customers` | PASS |
| NOA-04 | Owner `change-plan` with an unknown `plan_id`; `"abc"`; no body | `404`; `400`; `400` | PASS |
| NOA-05 | Body `{ plan_id, status: "active" }` / `{ plan_id, tenant_id }` / `{ plan_id, period_end }` | `400 property ... should not exist` | PASS |
| NOA-06 | Owner calls `PATCH /api/admin/subscriptions/<A>/plan` with the tenant cookie | `401` — platform route | PASS |
| NOA-07 | Owner calls `POST /api/admin/billing/run-renewal/<A>` | `401` | PASS |
| NOA-08 | Owner tries to set its own `stripe_customer_id`, `status` or limits through any tenant route | no such route / `400` | PASS |

## 4. Upgrade — accepted, applied at renewal

| ID | Do | Expected | Result |
|---|---|---|---|
| UPG-01 | Owner `change-plan` to `TEST Big` (more storage) | `200`; `pending_plan_id = Big`, `pending_plan_effective_at = period_end`; `plan_id` **still** `TEST Small`; the storage check is skipped | PASS |
| UPG-02 | `GET /api/billing/subscription` | still `TEST Small` limits, with the pending change shown | PASS |
| UPG-03 | Change again to another plan | only **one** pending plan — replaced | PASS |

## 5. Downgrade — the storage gate

A can never reach `0` bytes: its frozen quote and invoice PDFs are locked and cannot be deleted (phase 16). That is the rule working, not a bug. The full refuse → delete → accept cycle runs on a company that never sent a document. **B did** (its frozen quote PDF from phase 16 is locked), so use `TEST Epsilon` (tenant 7, no files) — or any company with 0 locked files.

| ID | Do | Expected | Result |
|---|---|---|---|
| DWN-01 | A owner `change-plan` to `TEST Zero Storage` | `400`, the message names both numbers (`x.xx GB used, target allows 0 GB`); `pending_plan_id` unchanged | PASS |
| DWN-02 | The test company (`TEST Epsilon`, tenant 7): `select count(*) from media where tenant_id = 7 and is_locked` | `0` | PASS |
| DWN-03 | B owner uploads one small file (`test.jpg`) | `201` | PASS |
| DWN-04 | B owner `change-plan` to `TEST Zero Storage` | `400` — usage is above 0 | PASS |
| DWN-05 | B **soft**-deletes the file, asks again | still `400` — trash still counts (and is still billed) | PASS |
| DWN-06 | B **hard**-deletes it (`/api/media/permanent`), asks again | `200`, `pending_plan_id = Zero Storage`, `plan_id` unchanged | PASS |
| DWN-07 | **[CHECK IMAGEKIT]** | B's file is gone | PASS |
| DWN-08 | B uploads a file again **after** the downgrade was accepted | `201` — the gate only checks at request time; at renewal storage over 0 is billed as overage (rate `0` = no charge) | PASS |

## 6. Platform side

| ID | Do | Expected | Result |
|---|---|---|---|
| PSB-01 | `GET /api/admin/subscriptions`, `?status=trialing`, `?status=free`, paging | A and B rows; `400` for `free` | PASS |
| PSB-02 | `GET /api/admin/subscriptions/<A>`; `/abc`; `/999999999`; `TEST Gamma` (no subscription — open question 8) | `200`; `400`; `404`; `404` | PASS |
| PSB-03 | `PATCH /api/admin/subscriptions/<A>/plan { plan_id: Big }` | `pending_plan_id` set, `plan_id` unchanged; B untouched; an audit `set_pending_plan` row | PASS |
| PSB-04 | Staff admin does PSB-03 | `403` | PASS (after the billing-right fix, 2026-10-09; FAIL on the first run) |
| PSB-05 | `GET /api/admin/subscriptions/<A>/usage` | the snapshots (empty before the first renewal) | PASS |

## 7. Stripe webhooks

Link A to a sandbox customer first (see *Before you start*).

| ID | Do | Expected | Result |
|---|---|---|---|
| STR-01 | `stripe trigger payment_intent.succeeded --override payment_intent:customer=<cus> --override payment_intent:amount=1000` | a `stripe_events` row with `processed_at`; A → `active`, period rolled one month; `payment_received` for the platform admins | PASS |
| STR-02 | **[CHECK STRIPE]** | the sandbox shows the succeeded payment for the customer | PASS |
| STR-03 | Replay the same event id (signed script) | `200`, still **one** row, nothing re-done | PASS |
| STR-04 | A tampered body, a wrong secret, no `stripe-signature` header | `400`, nothing stored | PASS |
| STR-05 | `stripe trigger payment_intent.payment_failed --override payment_intent:customer=<cus>` | A → `past_due` (**not** `cancelled`); platform `payment_failed`; the **owner only** gets `subscription_payment_failed` (the manager gets nothing — `alerts.md` § 3) | PASS |
| STR-06 | **[CHECK EMAIL]** owner + manager — payment failed, French; staff admin — platform alert | received | PASS |
| STR-07 | While `past_due`: owner uses the app normally (`GET /api/projects`, create a client, `GET /api/billing/subscription`) | all work — no block | PASS |
| STR-08 | `invoice.upcoming` (signed script, the CLI cannot trigger it) | the **owner only** gets `subscription_renewal_upcoming`; the manager gets nothing; no platform alert. **[CHECK EMAIL]** | PASS |
| STR-09 | `customer.subscription.deleted` (signed script) | A → `cancelled`; the next request from any A user → `403 No active subscription` | PASS |
| STR-10 | Platform can still read A (`GET /api/admin/tenants/<A>`) | `200` — only the company is locked out | PASS |
| STR-11 | `payment_intent.succeeded` again | A → `active`, access back | PASS |
| STR-12 | An event for a customer linked to no tenant | `200`, logged as "no subscription", nothing changed | PASS |

## 8. The renewal

| ID | Do | Expected | Result |
|---|---|---|---|
| REN-01 | Platform `POST /api/admin/billing/run-renewal/<A>` | `{ usage, total_overage }`; one `billing_usage_snapshots` row per billed dimension, never `retention_days`, never projects | PASS |
| REN-02 | Each snapshot row | copies `limit_value` and `overage_rate` from the plan **now**; `overage_amount = max(0, actual − allowance) × rate` (managers `15.00`, subcontractors, clients as counted) | PASS |
| REN-03 | Period | `period_start` / `period_end` rolled exactly one month | PASS |
| REN-04 | The pending plan (UPG-03 / PSB-03) | applied **only if** its effective date has passed. The date is normally the period end, so it is due at the first renewal. To see both halves, set `pending_plan_effective_at` in the DB: a **future** date (after the new period start) → `plan_id` unchanged; a **past** date → `plan_id` = the pending plan, both pending columns cleared | PASS |
| REN-05 | **[CHECK STRIPE]** | an invoice item for the overage on the A customer (one combined line) | PASS |
| REN-06 | Overage `0` (B) | nothing pushed to Stripe | PASS |
| REN-07 | A customer id that does not exist in Stripe | the renewal still finishes (snapshot, period, pending plan); only the push logs an error | PASS |
| REN-08 | Deactivate one manager, run again | managers `5`, overage `2 × 5.00 = 10.00` | PASS |
| REN-09 | Plans are never edited in place | no route changes an existing plan's `overage_rate`, so old snapshots can never move | PASS |
| REN-10 | Owner `GET /api/billing/invoices` | A's snapshots only, paginated; B sees only B's | PASS |

## Known limits

- The renewal is not one transaction across snapshot → Stripe push → period roll → plan apply. A retry after a partial run is not fully safe.
- The Stripe overage push is one combined line, not one line per dimension.
- `storage_gb` is a whole number — the smallest real limit is 1 GB.

## Result — 2026-10-09

**51 PASS, 4 FAIL, 0 SKIP.** Owner checks done: DWN-07 (ImageKit), STR-02 (Stripe), STR-06/08 (emails), LIM-01 token.

### Failures
- **DWN-02** (fixed 2026-10-09: the test now names `TEST Epsilon`, 0 locked files, PASS) — B has **1 locked** media (a frozen quote PDF from phase 16, `QUO-2026-0001.pdf`), so the plan's premise "B never sent a document" is wrong. Test-plan error, not an app bug. The refuse → delete → accept cycle (DWN-03..08) ran on `TEST Epsilon` (tenant 7, no files) instead.
- **PSB-04** — staff admin `PATCH /admin/subscriptions/1/plan { plan_id: 3 }` → `200` (pending plan set, audit row 397), not `403`. Same cause as PLR-02: only `admin-users` and `audit` carry `@AdminRoles('super_admin')`. Owner to decide.
- **STR-05 / STR-08** — only the **owner** got `subscription_payment_failed` / `subscription_renewal_upcoming`; the manager got none. **Decided 2026-10-09: owner only is right** (`alerts.md` § 3: a manager gets no billing alerts; the manager cannot open `settings` or fix a card). The plan text said "owner + manager" and was wrong; the code was right. Both rows now PASS.

### Notes (no scenario fails because of them)
- UPG-01/03, NOA, PSB-03 change-plan answer `201` (POST convention); the plan says `200`.
- DWN-01/04/05 message: `Storage usage (0.00 GB) is still above the new plan's 0 GB limit` — names both numbers, but a few KB shows as `0.00`.
- **The `stripe listen` started before the run was wrong**: `--events "a b c d"` is one string, so it matched nothing (the first `stripe trigger` stored no event). A second listener with a comma list was started and worked; secret equals `.env`.
- **Event 1 (`payment_intent.succeeded`) was processed again each time the API restarted** (Redis shows only 2 jobs ever queued). Resend shows 3 `Payment received` mails for it (13:37, 13:41:18, 13:41:48); `processed_at` and the period were rewritten. The STR-03 replay itself did nothing (events 1 → 1, notifications unchanged). Cause not found (stalled BullMQ job re-run at boot?). Worth a look.
- `addOneMonth` is local-time based: `period_end` moved from `13:43:47` to `14:43:47` UTC on one roll (DST). Still one calendar month.
- REN-04 (wording fixed 2026-10-09; the logic is right — a plan change waits for the end of the period): the pending plan (set before STR-01) was applied at the **first** renewal, because the handler compares its date to the *new period start* and STR-01 had already moved the period past it. The "not due yet" half was proved by setting a future date in the DB (stays `plan 1`, pending kept), then a past date (plan applied, both columns cleared).
- Setup done for the run: plans `TEST Closed` (4, deactivated, for NOA-03) and `TEST Mid` (5, for UPG-03); Stripe customers `cus_VPStHl25uyqLfO` (A) and `cus_VPT3kRWeum1MkU` (B).
- Evidence: STR-01 event row `processed_at` set, period 10-09 → 11-09, `payment_received` for admins 1 and 2. STR-02 Stripe shows 3 succeeded (10.00) + 1 failed (20.00). STR-05 `past_due`; STR-07 `GET /projects` 200, `GET /billing/subscription` 200. STR-09 `cancelled` → `403 No active subscription` for owner and manager; B still 200. STR-12 orphan customer → 200, nothing changed. REN-01 usage workers 2 / managers 6 / clients 4 / subcontractors 3 → total `17`; invoice item `17.00 EUR` "Overage for 2026-10-09 – 2026-11-09" (one line). REN-08 managers 5 → `10.00`, total `12`. REN-06 B total 0 → 0 invoice items on its customer. REN-07 fake customer → renewal finished (period rolled, 5 snapshots). REN-10 A 20 rows, B 5 rows (only tenant 2).
- Emails (Resend): owner FR `Le paiement de votre abonnement a échoué` delivered 13:42:06, `Votre abonnement se renouvelle bientôt` delivered; staff `Payment failed` delivered; `admin@chantieros.local` bounces (problem 8).

### Data left
A: `TEST Alpha Renovation` on `TEST Small`, `active`, customer `cus_VPStHl25uyqLfO`, period rolled several times by the renewal runs (~2027-03), 20+ snapshots, accountant active again, 5th client `TEST Limit Client 5`, 4th subcontractor `TEST Limit Sub 4`, worker3 (user 16, deactivated). B: customer `cus_VPT3kRWeum1MkU`, 5 snapshots. Epsilon (tenant 7): pending `TEST Zero Storage`, one file (media 65). Plans 4 and 5 added.

- **After the run (2026-10-09):** a successful payment moves the period, so a waiting plan change now moves its date with it (before, the date kept pointing at the old period end). Live: pending date `2026-12-09` → `2026-11-09 17:30:09.956` = the new `period_end`. The renewal job is untouched.
