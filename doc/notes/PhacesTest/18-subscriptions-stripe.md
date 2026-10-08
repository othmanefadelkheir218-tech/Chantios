# Phase 18 — Subscriptions, Plan Limits & Stripe

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
| BIL-01 | Owner `GET /api/billing/subscription` | plan `TEST Small`, its limits, the period, `trialing` | todo |
| BIL-02 | `GET /api/billing/usage` | one row per billed dimension (`max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb`) — never `retention_days`, never projects — computed **live** | todo |
| BIL-03 | The live numbers for A | workers `2` (limit 2, overage 0); managers `6` (admin, manager, supervisor, leader, sales, accountant — the deactivated spare **not** counted) → `3 × 5.00 = 15.00`; clients = active clients (≥ 4) → overage; subcontractors `3` → `1 × 1.00`; storage a few MB → `0` | todo |
| BIL-04 | Manager / worker `GET /api/billing/subscription` | `403` (`settings` is admin only) | todo |

## 2. Over the limit — allowed, never blocked

| ID | Do | Expected | Result |
|---|---|---|---|
| LIM-01 | Invite and accept a 3rd worker (`winucardit+worker3@gmail.com`) — limit 2 | `201`, no error. **[CHECK EMAIL]** invitation — **[SEND ME CODE]** | todo |
| LIM-02 | `GET /api/billing/usage` | workers `3`, overage `1 × 2.00` | todo |
| LIM-03 | Create a 5th client, a 4th subcontractor | `201`, no error | todo |
| LIM-04 | Owner deactivates the 3rd worker | usage back to `2` workers, overage `0` — "active" means active **now** | todo |
| LIM-05 | No request anywhere answered "limit reached" during phases 03–17 | confirmed from RESULTS.md | todo |

## 3. Not allowed — the company cannot change its own plan by force

| ID | Do | Expected | Result |
|---|---|---|---|
| NOA-01 | Manager / sales / accountant `POST /api/billing/change-plan` | `403` — admin only | todo |
| NOA-02 | Owner `change-plan` to `TEST Small` (the current plan) | `400 The tenant is already on this plan` | todo |
| NOA-03 | Owner `change-plan` to a deactivated plan (phase 02 PLN-13) | `400 This plan is closed to new customers` | todo |
| NOA-04 | Owner `change-plan` with an unknown `plan_id`; `"abc"`; no body | `404`; `400`; `400` | todo |
| NOA-05 | Body `{ plan_id, status: "active" }` / `{ plan_id, tenant_id }` / `{ plan_id, period_end }` | `400 property ... should not exist` | todo |
| NOA-06 | Owner calls `PATCH /api/admin/subscriptions/<A>/plan` with the tenant cookie | `401` — platform route | todo |
| NOA-07 | Owner calls `POST /api/admin/billing/run-renewal/<A>` | `401` | todo |
| NOA-08 | Owner tries to set its own `stripe_customer_id`, `status` or limits through any tenant route | no such route / `400` | todo |

## 4. Upgrade — accepted, applied at renewal

| ID | Do | Expected | Result |
|---|---|---|---|
| UPG-01 | Owner `change-plan` to `TEST Big` (more storage) | `200`; `pending_plan_id = Big`, `pending_plan_effective_at = period_end`; `plan_id` **still** `TEST Small`; the storage check is skipped | todo |
| UPG-02 | `GET /api/billing/subscription` | still `TEST Small` limits, with the pending change shown | todo |
| UPG-03 | Change again to another plan | only **one** pending plan — replaced | todo |

## 5. Downgrade — the storage gate

A can never reach `0` bytes: its frozen quote and invoice PDFs are locked and cannot be deleted (phase 16). That is the rule working, not a bug. The full refuse → delete → accept cycle runs on **B**, which never sent a document.

| ID | Do | Expected | Result |
|---|---|---|---|
| DWN-01 | A owner `change-plan` to `TEST Zero Storage` | `400`, the message names both numbers (`x.xx GB used, target allows 0 GB`); `pending_plan_id` unchanged | todo |
| DWN-02 | B: `select count(*) from media where tenant_id = B and is_locked` | `0` | todo |
| DWN-03 | B owner uploads one small file (`test.jpg`) | `201` | todo |
| DWN-04 | B owner `change-plan` to `TEST Zero Storage` | `400` — usage is above 0 | todo |
| DWN-05 | B **soft**-deletes the file, asks again | still `400` — trash still counts (and is still billed) | todo |
| DWN-06 | B **hard**-deletes it (`/api/media/permanent`), asks again | `200`, `pending_plan_id = Zero Storage`, `plan_id` unchanged | todo |
| DWN-07 | **[CHECK IMAGEKIT]** | B's file is gone | todo |
| DWN-08 | B uploads a file again **after** the downgrade was accepted | `201` — the gate only checks at request time; at renewal storage over 0 is billed as overage (rate `0` = no charge) | todo |

## 6. Platform side

| ID | Do | Expected | Result |
|---|---|---|---|
| PSB-01 | `GET /api/admin/subscriptions`, `?status=trialing`, `?status=free`, paging | A and B rows; `400` for `free` | todo |
| PSB-02 | `GET /api/admin/subscriptions/<A>`; `/abc`; `/999999999`; `TEST Gamma` (no subscription — open question 8) | `200`; `400`; `404`; `404` | todo |
| PSB-03 | `PATCH /api/admin/subscriptions/<A>/plan { plan_id: Big }` | `pending_plan_id` set, `plan_id` unchanged; B untouched; an audit `set_pending_plan` row | todo |
| PSB-04 | Staff admin does PSB-03 | `403` | todo |
| PSB-05 | `GET /api/admin/subscriptions/<A>/usage` | the snapshots (empty before the first renewal) | todo |

## 7. Stripe webhooks

Link A to a sandbox customer first (see *Before you start*).

| ID | Do | Expected | Result |
|---|---|---|---|
| STR-01 | `stripe trigger payment_intent.succeeded --override payment_intent:customer=<cus> --override payment_intent:amount=1000` | a `stripe_events` row with `processed_at`; A → `active`, period rolled one month; `payment_received` for the platform admins | todo |
| STR-02 | **[CHECK STRIPE]** | the sandbox shows the succeeded payment for the customer | todo |
| STR-03 | Replay the same event id (signed script) | `200`, still **one** row, nothing re-done | todo |
| STR-04 | A tampered body, a wrong secret, no `stripe-signature` header | `400`, nothing stored | todo |
| STR-05 | `stripe trigger payment_intent.payment_failed --override payment_intent:customer=<cus>` | A → `past_due` (**not** `cancelled`); platform `payment_failed`; owner + manager get `subscription_payment_failed` | todo |
| STR-06 | **[CHECK EMAIL]** owner + manager — payment failed, French; staff admin — platform alert | received | todo |
| STR-07 | While `past_due`: owner uses the app normally (`GET /api/projects`, create a client, `GET /api/billing/subscription`) | all work — no block | todo |
| STR-08 | `invoice.upcoming` (signed script, the CLI cannot trigger it) | owner + manager get `subscription_renewal_upcoming`; no platform alert. **[CHECK EMAIL]** | todo |
| STR-09 | `customer.subscription.deleted` (signed script) | A → `cancelled`; the next request from any A user → `403 No active subscription` | todo |
| STR-10 | Platform can still read A (`GET /api/admin/tenants/<A>`) | `200` — only the company is locked out | todo |
| STR-11 | `payment_intent.succeeded` again | A → `active`, access back | todo |
| STR-12 | An event for a customer linked to no tenant | `200`, logged as "no subscription", nothing changed | todo |

## 8. The renewal

| ID | Do | Expected | Result |
|---|---|---|---|
| REN-01 | Platform `POST /api/admin/billing/run-renewal/<A>` | `{ usage, total_overage }`; one `billing_usage_snapshots` row per billed dimension, never `retention_days`, never projects | todo |
| REN-02 | Each snapshot row | copies `limit_value` and `overage_rate` from the plan **now**; `overage_amount = max(0, actual − allowance) × rate` (managers `15.00`, subcontractors, clients as counted) | todo |
| REN-03 | Period | `period_start` / `period_end` rolled exactly one month | todo |
| REN-04 | The pending plan (UPG-03 / PSB-03) | applied **only if** its effective date has passed: first run before → `plan_id` unchanged; run again after the old `period_end` → `plan_id` = the pending plan, both pending columns cleared | todo |
| REN-05 | **[CHECK STRIPE]** | an invoice item for the overage on the A customer (one combined line) | todo |
| REN-06 | Overage `0` (B) | nothing pushed to Stripe | todo |
| REN-07 | A customer id that does not exist in Stripe | the renewal still finishes (snapshot, period, pending plan); only the push logs an error | todo |
| REN-08 | Deactivate one manager, run again | managers `5`, overage `2 × 5.00 = 10.00` | todo |
| REN-09 | Plans are never edited in place | no route changes an existing plan's `overage_rate`, so old snapshots can never move | todo |
| REN-10 | Owner `GET /api/billing/invoices` | A's snapshots only, paginated; B sees only B's | todo |

## Known limits

- The renewal is not one transaction across snapshot → Stripe push → period roll → plan apply. A retry after a partial run is not fully safe.
- The Stripe overage push is one combined line, not one line per dimension.
- `storage_gb` is a whole number — the smallest real limit is 1 GB.
