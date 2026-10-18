# Step 21 — Stripe Checkout: the tenant admin pays

> Needs step 14 (subscriptions, Stripe webhooks, renewal job) and step 20 (grace, block, dev tools).
> Backend **and** frontend. **Built 2026-10-15** — waiting for the live test (§ 7, last line).

## 1. Goal

The tenant admin clicks **Pay** on the Billing page → goes to the Stripe card page (Checkout) → pays with a card → comes back to the app → the company is `active`. After that, **Stripe charges the card every month by itself**.

## 2. Decide first

**Decided 2026-10-15 (owner): option A — Stripe charges every month** (a Stripe subscription). Our renewal job keeps counting usage and sends the overage to Stripe. Rule: [subscription-plans.md](../subscription-plans.md) § Paying by card.

Answered by the owner on 2026-10-15. **Nothing left open.**

| # | Question | Answer |
|---|---|---|
| Q1 | The tenant admin pays **during the trial** | ✅ Save the card, first charge on the trial's `period_end`. They keep their free days |
| Q2 | **When is the overage charged?** | ✅ Run the renewal for that company when Stripe sends `invoice.created`, and add the overage to **that** invoice. The nightly job stays for companies with no Stripe subscription |
| Q3 | **Who owns the period dates** for a paying company | ✅ Stripe. We copy `period_start` / `period_end` from the Stripe subscription on each webhook |
| Q4 | **Plan change** for a paying company (tenant admin or super admin) | ✅ Change the price in Stripe at once, with no proration. Stripe uses it from the next invoice, the same date as our `pending_plan_effective_at` |
| Q5 | **Change card / see Stripe invoices** | ✅ Stripe Customer Portal, "update card" and "invoices" only. No cancel and no plan change there (cancel is our own button, Q6) |
| Q6 | Can the tenant admin **cancel**? | ✅ **Yes.** The app keeps working until the end of the paid month. **No refund.** At the period end → `cancelled` (blocked, data kept, can pay again) |
| Q6b | Can they **undo** the cancel before the month ends? | ✅ Yes, a "Keep my subscription" button |
| Q7 | **VAT** | ✅ Not in this step. Prices stay as they are, decide later |
| Q8 | A **blocked** company pays again: does a new month start on the payment day? | ✅ Yes. Example: blocked on 1 March, pays 20 March → new month 20 March → 20 April |

## 3. Tables

One migration: `20261015120000_subscription_cancel_at_period_end` adds `tenant_subscriptions.cancel_at_period_end BOOLEAN NOT NULL DEFAULT false` (the "Ends on <date>" state, copied from Stripe). `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id` already existed. DDL: [Schema Proposal.md](../../Schema%20Proposal.md) § `tenant_subscriptions`.

## 4. Where the code lives

**Backend**

```
src/billing/billing.controller.ts                      + POST /billing/checkout, POST /billing/portal
src/billing/handlers/start-checkout.handler.ts         checks, then asks StripeService for a Checkout link
src/billing/handlers/open-portal.handler.ts            asks StripeService for a Customer Portal link
src/stripe/handlers/ensure-customer.handler.ts         creates the Stripe customer once, saves stripe_customer_id
src/stripe/handlers/create-checkout-session.handler.ts mode "subscription", plan's stripe_price_id
src/stripe/handlers/create-portal-session.handler.ts   Customer Portal link
src/stripe/handlers/handle-checkout-completed.handler.ts   checkout.session.completed
src/stripe/handlers/handle-subscription-updated.handler.ts customer.subscription.updated (dates, price)
src/stripe/handlers/update-subscription-price.handler.ts   Q4: plan change → Stripe price
src/stripe/handlers/process-webhook.handler.ts         + the new event types
src/subscriptions/                                      + setStripeSubscription(), period from Stripe (Q3)
```

**Frontend** (`Chantios_client`)

```
lib/api/endpoints/billing.api.ts                         + checkout(locale), portal()
hooks/use-billing.ts                                     + useStartCheckout(), useOpenPortal() → go to the url
app/[locale]/(tenant)/settings/billing/_components/SubscriptionCard.tsx   Pay / Manage payment buttons
app/[locale]/(tenant)/settings/billing/BillingClient.tsx  reads ?checkout=success|cancel
components/shared/subscription/CompanyBlocked.tsx        "Pay now" for the tenant admin
app/[locale]/(tenant)/_layout/SubscriptionBanner.tsx     "Pay now" link
messages/fr.json, en.json, nl.json                       new texts
TEST-SUBSCRIPTION.md                                     real card tests (§ 8)
```

## 5. Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/billing/checkout` | role `admin` + `@AllowLapsedSubscription()` | body `{ locale }`. Returns `{ url }` of a Stripe Checkout page. `409` if the company already has a Stripe subscription, or the plan has no `stripe_price_id` |
| `POST` | `/api/billing/portal` | role `admin` + `@AllowLapsedSubscription()` | Returns `{ url }` of the Stripe Customer Portal. `409` if there is no Stripe customer |
| `POST` | `/api/billing/cancel` | role `admin` | Q6: Stripe `cancel_at_period_end = true`. Nothing changes now; at the period end Stripe sends `customer.subscription.deleted` → `cancelled`. `409` if there is no card subscription |
| `POST` | `/api/billing/resume` | role `admin` | Q6b: `cancel_at_period_end = false` before the period end |
| `GET` | `/api/billing/subscription` | unchanged | + `has_card_subscription: boolean` (the frontend picks **Pay** or **Manage payment**), + `cancel_at_period_end: boolean` |
| `GET` | `/api/billing/history` | module `settings` + `@AllowLapsedSubscription()` | One item per finished period: `lines` (usage rows) + `billing` `{ plan_amount, extra_amount, total, status: paid/due/none, invoice_ids }` read from Stripe (`null` if Stripe can't be read). Paginated by period. Rule: `subscription-plans.md` § The billing history |
| `GET` | `/api/admin/billing/tenants/:tenantId/history` | admin | Same, for one company (admin) |
| `POST` | `/api/webhooks/stripe` | unchanged | + `checkout.session.completed`, `customer.subscription.updated`, (Q2) `invoice.created` |

A **blocked** company must reach both routes, so it can pay. `tenant_id` comes from the JWT, never from the body.

**Checkout session:** `mode: subscription`, `customer` = the company's customer, one line = the plan's `stripe_price_id` (the pending plan if one is set), `client_reference_id` + `metadata.tenant_id`, `success_url = APP_URL/<locale>/settings/billing?checkout=success`, `cancel_url = ...?checkout=cancel`. Q1 decides `subscription_data.trial_end`.

## 6. Webhook events — what each one does

| Event | Effect |
|---|---|
| `checkout.session.completed` | Save `stripe_subscription_id` + `stripe_price_id`. Status `active` (or stays `trialing`, Q1). Grace date cleared |
| `payment_intent.succeeded` | Already built → `active` |
| `payment_intent.payment_failed` | Already built → `past_due` + 7 days. Stripe retries a card many times: the 2nd failure keeps the date (already the rule) |
| `customer.subscription.updated` | Copy the period dates and price (Q3, Q4) |
| `customer.subscription.deleted` | Already built → `cancelled` |
| `invoice.created` | Only if Q2 = recommendation: run the renewal now, add the overage to this invoice |
| `invoice.paid` | "Paiement reçu" email to the company (`HandleInvoicePaidHandler`, alert `subscription_payment_received`): plan + period, overage + month, VAT, total. 0 € → nothing. Rule: `subscription-plans.md` § The payment email. **Live endpoint must list this event** |

**Stripe setting (test + live):** Dashboard → Billing → Subscriptions → "If all retries fail" = **leave the subscription past due** (do not cancel). Our 7-day rule does the block, not Stripe.

**Managed Payments is turned off on every Checkout** (`managed_payments: { enabled: false }`). Found live 2026-10-15: the account has it on by default (Stripe handles VAT), and then Stripe refuses any product without a tax code. VAT is decided later (Q7); turning it on later means tax codes on the plan products.

## 7. Tasks

**Setup — owner, in the Stripe Dashboard (test mode)**
- [ ] Customer Portal: save the settings once (update card + invoices only, Q5) — without it `/billing/portal` gets a Stripe error
- [ ] Retries setting from § 6
- [ ] `stripe listen --forward-to localhost:5300/api/webhooks/stripe`, check that `STRIPE_WEBHOOK_SECRET` matches

**Backend**
- [x] Customer: `CreateCustomerHandler` (stripe), created by `StartCheckoutHandler` when the company has none — a dev-tools fake `cus_dev_<id>` is replaced
- [x] `POST /billing/checkout` + `StartCheckoutHandler` + `CreateCheckoutSessionHandler`
- [x] `POST /billing/portal` + `OpenPortalHandler` + `CreatePortalSessionHandler`
- [x] Webhook: `checkout.session.completed`, `customer.subscription.updated` (re-reads the subscription: events come out of order)
- [x] Q2: renewal on `invoice.created` (`RunRenewalHandler.executeForStripeInvoice`); the nightly job skips card companies; the trial reminder too
- [x] Q4: `SetPendingPlanHandler` changes the Stripe price first (tenant admin + super admin routes)
- [x] Q6: `POST /billing/cancel` + `POST /billing/resume` (`CancelCardSubscriptionHandler`); `customer.subscription.updated` copies `cancel_at_period_end`
- [x] `GET /billing/subscription` + `has_card_subscription`, `cancel_at_period_end`
- [x] Dev tools: "simulate payment" kept (the period still rolls there when the company has no card subscription)
- [x] ~~Audit log~~ — `audit_logs` records platform-admin actions only; the tenant actions are in the API logs
- [x] Unit tests: `src/stripe/handlers/card-payment.handlers.spec.ts`, `src/billing/handlers/card-payment.handlers.spec.ts`

**Frontend**
- [x] API + hooks (`checkout`, `portal`, `cancel`, `resume`) — `billing.api.ts`, `use-billing.ts`
- [x] Billing card: **Pay** (no card subscription) / **Manage payment** (has one). Tenant admin only — `CardPaymentActions.tsx`
- [x] Back from Stripe with `?checkout=success`: "payment received, activating…", reads the subscription every 2 s for up to 30 s — `use-checkout-return.ts`
- [x] Back with `?checkout=cancel`: message "payment cancelled"
- [x] Blocked page: **Pay now** for the tenant admin (it waits there for the payment too); others see "ask your admin". Banner link says "Pay now" for the tenant admin
- [x] Billing card: **Cancel subscription** (confirm dialog) / "Ends on <date>" + **Keep my subscription** (Q6b)
- [x] Texts in `fr.json` (en / nl fall back to fr, like the rest of billing)
- [x] `TEST-SUBSCRIPTION.md` Part B
- [x] Live check 2026-10-15 (TEST Beta Bouw, trialing): `/billing/checkout` → Stripe Checkout URL, `/billing/portal` → portal URL, `/billing/cancel` without a card → 409
- [x] Fix found live: API did not start — new module imports (`Stripe → Billing`, `Subscriptions → Stripe`) made a file-load cycle (`UsersModule imports[3] undefined`). Replaced by `ModuleRef` lookups; `src/app.module.wiring.spec.ts` now catches this in `jest`
- [ ] **Owner: pay with a test card + `stripe listen`** (`TEST-SUBSCRIPTION.md` Part B)

## 8. Acceptance — Stripe test cards

Any future date, any CVC.

| Card | Expected |
|---|---|
| `4242 4242 4242 4242` | Paid → back in the app → `active`, `stripe_subscription_id` saved |
| `4000 0025 0000 3155` | Asks 3D Secure → accept → `active` |
| `4000 0000 0000 9995` | Refused on the Stripe page → nothing changes in the app |
| `4000 0000 0000 0341` | Card saved, but the next charge fails → `past_due` + 7 days |

1. Trial company → **Pay** → card `4242` → `active` (or still `trialing` until the trial ends, Q1).
2. Blocked company → blocked page → **Pay now** → `4242` → app opens again.
3. Paying company → **Pay** is gone, **Manage payment** opens the Stripe portal → change the card.
4. Paying company → change plan → the Stripe subscription shows the new price for the next invoice.
5. Overage → Stripe invoice has an "Overage" line (Q2 decides which invoice).
6. Card `0341` → next charge fails → banner + 7 days → block → update the card in the portal → Stripe retries → `active`.
7. Manager / accountant → no Pay button. A direct `POST /billing/checkout` → `403`.
8. Cancel on the Stripe page → back to Billing, message "payment cancelled", nothing changes.
9. Paying company → **Cancel subscription** → still `active`, "Ends on <date>", no refund → advance the test clock past the period end → `cancelled` (blocked) → **Pay now** works again.
10. Cancel → **Keep my subscription** before the end → the next month is charged normally.

**To test a monthly charge without waiting a month:** with `DEV_TOOLS=true` and a `sk_test_` key, every new Stripe customer is created on its own **test clock** (`CreateCustomerHandler`), named `Tenant <id> — <company>`. Dashboard → Billing → Test clocks → advance it. Never in production (dev tools off).

## 9. Notes to read

- [subscription-plans.md](../subscription-plans.md) — trial end, failed payment, plan change, overage
- [14-subscriptions.md](14-subscriptions.md) — the Stripe module and webhooks already built
- [20-trial-end-dev-tools.md](20-trial-end-dev-tools.md) — grace, block, dev tools
