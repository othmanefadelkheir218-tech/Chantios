# Step 27 — TVA on the subscription

> Needs step 14 (subscriptions, Stripe), step 21 (Stripe Checkout, billing history, payment email).
> Backend **and** frontend (`ChanitOs_client/my-app`). **Built 2026-10-20** — phases A → E2 done; E3 (owner: Stripe Dashboard + live tests) left.
> Rule: [subscription-plans.md](../subscription-plans.md) § TVA on the subscription. DDL: [Schema Proposal.md](../../Schema%20Proposal.md) § TVA on the subscription.
> Tests: [../PhacesTest/20-subscription-tva.md](../PhacesTest/20-subscription-tva.md).

## 1. Goal

A company pays its ChantierOS subscription **plus the right TVA**. The super-admin sets the rate per country. Stripe adds it to the invoice and charges the card. Every screen and email that shows a subscription amount shows **Total HT, TVA, Total payé (TTC)**.

This is the TVA a **company pays ChantierOS**. It is **not** the TVA on the quotes and invoices a company sends to its own clients — do not touch `quote_lines` / `invoice_lines` / `tenants.default_vat_rate`.

## 2. Decide first

Answered by the owner on 2026-10-20.

| # | Question | Answer |
|---|---|---|
| Q1 | Who calculates the TVA | ✅ **We do**, not Stripe Tax (no 0.5% fee). We send our rate to Stripe as a Stripe **TaxRate** |
| Q2 | Seller country | ✅ **Belgium**. A setting: `SELLER_COUNTRY=BE` in `.env` (validated in `env.config.ts`, 2 upper-case letters) |
| Q3 | Prices HT or TTC | ✅ **HT**. `plans.base_price` and `plan_features.overage_rate` are HT; every screen says "HT" |
| Q4 | Who sets the rates | ✅ The **super-admin**, one row per country, can add countries. Start: BE 21, FR 20, NL 21, DE 19, ES 21 (all EU) |
| Q5 | Which rate | ✅ EU rule — see the table in § 3 |
| Q6 | Company without a country | ✅ Country **required** everywhere. No country / country not in the table / closed country → **cannot pay** (only the Pay button is refused, nothing else) |
| Q7 | Rate change, country change, TVA number change | ✅ From the **next invoice**. Past invoices keep their TVA |
| Q8 | Where the final price shows | ✅ Company billing history, super-admin billing history of a company, every automatic email with an amount |
| Q10 | The super-admin **closes a country** where companies pay by card | ✅ **Refused** (`409`) while a company of that country has a card subscription. A rate change is always allowed |
| Q11 | The **signup** country list | ✅ **Only the active countries of the TVA table** — at signup, on the profile, and in the super-admin's create-company form. Another country → `400` |

| Q9 | Check the company's **TVA number** | ✅ **VIES** (free EU REST service, no key): `POST https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number` with `{ countryCode, vatNumber }` → `valid: true/false`. Checked when saved. Valid → reverse charge can apply. Not valid → normal rate. Busy (`actionSucceed: false`, e.g. `MS_MAX_CONCURRENT_REQ`, seen live 2026-10-20) or down → `pending`, normal rate, retried by a job. Never blocks anything |
| Q9b | Fake numbers in dev / on a test server | ✅ `.env` **`VAT_NUMBER_CHECK`** = `vies` or `off`, its own switch, **not** tied to `NODE_ENV`, so a hosted test server can turn it off. `off` → format check only, status `not_checked`, counts as valid (reverse charge works with a fake number). Missing → `vies` (safe for production) |

Answered by the owner on 2026-10-20. **Nothing left open.**

## 3. The rule — one place

`src/vat-rates/helpers/subscription-vat.helper.ts`, pure function, unit-tested. **Nothing else decides a TVA.**

```
resolveSubscriptionVat({ country, vatNumber }, sellerCountry, row | null)
  → { kind: 'domestic' | 'reverse_charge' | 'country_rate', rate, stripeTaxRateId }
  | { kind: 'missing', reason: 'no_country' | 'country_not_supported' }
```

| Company | `kind` | Rate | Stripe TaxRate |
|---|---|---|---|
| `country` empty | `missing` (`no_country`) | — | — |
| No active row for `country` | `missing` (`country_not_supported`) | — | — |
| `country = SELLER_COUNTRY` | `domestic` | row rate (21) | `stripe_tax_rate_id` |
| Other country, `row.is_eu`, `vat_number_status` = `valid` or `not_checked` (Q9) | `reverse_charge` | 0 | `stripe_reverse_charge_tax_rate_id` |
| Other country, `row.is_eu`, TVA number `invalid` or `pending` | `country_rate` | row rate | `stripe_tax_rate_id` |
| Other country, no TVA number | `country_rate` | row rate | `stripe_tax_rate_id` |
| Other country, `row.is_eu = false` | `country_rate` | row rate | `stripe_tax_rate_id` |

## 4. Tables

One migration `2026102xxxxxxx_subscription_vat_rates`: table `subscription_vat_rates` (DDL in Schema Proposal). No tenant column → add it to the Prisma tenant-extension skip list (`src/common/prisma/tenant-extension.ts`). `tenants.country` stays nullable in the DB; the API requires it.

No new column for amounts: TVA of an invoice is always read from Stripe.

## 5. Stripe — what changes

| Where | Change |
|---|---|
| TaxRate (create) | `display_name: 'TVA'`, `percentage: rate`, `inclusive: false`, `country`, `description: 'TVA <CC> <rate>%'`. Reverse charge (EU rows): `display_name: 'TVA autoliquidation'`, `percentage: 0` |
| TaxRate (rate change) | Stripe TaxRates cannot change their %: create a new one, save its id, archive the old one (`active: false`). Same pattern as plan Prices |
| Checkout | `subscription_data.default_tax_rates: [resolved id]`. Refused (`409`) when `kind = missing`. Keep `managed_payments: { enabled: false }` |
| Subscription | `default_tax_rates` = the resolved id. Updated on a rate change, a country change, a TVA number change |
| Overage invoice item | `PushOverageInvoiceItemHandler` sets `tax_rates: [resolved id]` explicitly (do not rely on the invoice default) |
| Customer | TVA number → customer tax id (`eu_vat`), so it prints on the invoice. Reverse charge → `invoice_settings.footer = "Autoliquidation — article 196 de la directive 2006/112/CE"`; otherwise footer cleared |
| Invoice reading | `ListCustomerInvoicesHandler` / `InvoiceSummary`: each line also gets its **tax amount**; each invoice its `subtotal`, `tax`, `total` and the tax rate(s) used (`taxes` / `tax_amounts` — the field name depends on the Stripe API version in `stripe.service.ts`, check it) |

**Owner setup in the Stripe Dashboard (test + live):** Settings → Business → add the seller's **TVA number** and address so they print on every invoice. Nothing else — no Stripe Tax registration.

## 6. Where the code lives

**Backend** — new module `src/vat-rates/` (one module = one repository file)

```
src/vat-rates/vat-rates.module.ts                imports no Stripe / Subscriptions module (see below)
src/vat-rates/vat-rates.controller.ts            admin routes (§ 7)
src/vat-rates/vat-rates-public.controller.ts     GET /api/vat-rates/countries
src/vat-rates/vat-rates.service.ts               READ side: resolve, country check, lists — used by billing, tenants
src/vat-rates/vat-rates-admin.service.ts         WRITE side: create / update — only the admin controller
src/vat-rates/handlers/create-vat-rate.handler.ts
src/vat-rates/handlers/update-vat-rate.handler.ts      rate change → new TaxRate, old archived, event `vat_rate.changed`; close → 409 (Q10)
src/vat-rates/handlers/resolve-tenant-vat.handler.ts   the caller passes the company; reads the row, calls the helper
src/vat-rates/handlers/check-country.handler.ts        active TVA country, or the unchanged old value (Q11)
src/vat-rates/helpers/subscription-vat.helper.ts       THE rule (§ 3)
src/vat-rates/repositories/vat-rate.repository.ts
src/stripe/handlers/create-tax-rate.handler.ts / archive-tax-rate.handler.ts
src/stripe/handlers/sync-subscription-tax.handler.ts   default_tax_rates + customer eu_vat tax id + footer
src/stripe/handlers/find-tax-rates.handler.ts          TaxRate id → percent (cached: a TaxRate never changes)
src/stripe/helpers/invoice-tax.helper.ts               line tax, one label for several rates, HT / TVA / TTC of an invoice
src/stripe/handlers/create-checkout-session.handler.ts + default_tax_rates
src/stripe/handlers/push-overage-invoice-item.handler.ts + tax_rates
src/stripe/handlers/list-customer-invoices.handler.ts  + tax / rate / reverse charge per line
src/billing/helpers/period-billing.helper.ts           + subtotal, tax, rate, reverse charge, total TTC
src/billing/handlers/tenant-vat.handler.ts             reads the company, asks vat-rates (+ its EU TVA number)
src/billing/handlers/sync-tenant-tax.handler.ts        one company → Stripe (C2); executeAll for `yarn tva:sync` (C6)
src/billing/listeners/tax-events.listener.ts           `tenant.tax_profile_changed` / `vat_rate.changed` → one job per company
src/billing/processors/tax-sync.processor.ts           BullMQ queue `billing-tax-sync`, 5 tries
src/billing/handlers/start-checkout.handler.ts         409 when kind = missing; customer synced, then Checkout with the TaxRate
src/billing/handlers/run-renewal.handler.ts            overage with the TaxRate
src/billing/handlers/my-subscription.handler.ts        + vat block
src/stripe/handlers/handle-invoice-paid.handler.ts     email: HT / TVA / TTC
src/stripe/handlers/handle-invoice-upcoming.handler.ts email: HT / TVA / TTC
src/notifications/helpers/notification-templates.helper.ts  the 3 email texts (fr / nl / en); payment failed says "TVA comprise"
src/auth/dto/register-tenant.dto.ts                    + country (required)
src/tenants/dto/create-tenant.dto.ts                   country required (2 letters); vat_number nullable
src/tenants/handlers/prepare-tax-fields.handler.ts     country never emptied + active; TVA number normalized + format + status reset — create, admin edit, profile
src/config/env.config.ts + .env.example                SELLER_COUNTRY (default BE), VAT_NUMBER_CHECK (vies | off, default vies) + spec
src/tenants/helpers/vat-number.helper.ts               normalize + format check per EU country (pure, unit-tested)
src/tenants/helpers/vies.helper.ts                     the VIES call (busy / down / slow → pending)
src/tenants/handlers/check-vat-number.handler.ts       VIES (off → not_checked); saves vat_number_status / checked_at; new status → app event
src/crons/vat-number-retry.cron.ts                     every 30 min: each `pending` number asked again
scripts/run-tva-sync.ts                                `yarn tva:sync` (C6)
```

A country / TVA number change on the tenant → app event `tenant.tax_profile_changed` → billing queues a re-sync job. A rate change → `vat_rate.changed` → one job per card company of that country. `tenants` and `vat-rates` never import `stripe` or `billing` (the module cycle met in step 21). The two vat-rates write handlers get `StripeService` / `SubscriptionsService` through `ModuleRef`; the read service never loads them, so `tenants` can import `vat-rates` without a file-load cycle.

A TVA number is stored normalized (`BE0123456789`). A number from outside the EU gets no VIES status (it never changes the TVA). An unchanged number keeps its status and is never re-refused by the format check.

**Frontend** (`ChanitOs_client/my-app`)

```
app/[locale]/admin/(panel)/vat-rates/                       NEW super-admin page: table, add, change rate, close/open
app/[locale]/admin/(panel)/_layout (sidebar)                + "TVA" entry (billing admins only)
app/[locale]/admin/(panel)/tenants/... create form          country required
app/[locale]/admin/(panel)/tenants/[id]/subscription/_components/SubscriptionInfoCard.tsx   country + TVA status
app/[locale]/admin/(panel)/plans/_components/*              "HT" on prices
app/[locale]/(public)/pricing/_components/PlanCard.tsx       "HT" + "+ TVA"
register form                                                country select (required)
settings company profile                                     country required, TVA number + its status (Q9)
app/[locale]/(tenant)/settings/billing/_components/SubscriptionCard.tsx   price HT, TVA line, warning + Pay disabled when missing
app/[locale]/(tenant)/settings/billing/_components/ChangePlanDialog.tsx   "HT"
components/shared/billing/UsagePeriodList.tsx               Formule HT / Supplément HT / Total HT / TVA / Total payé (company + super-admin history)
types + lib/api/endpoints + hooks                            vat-rates api, billing types
messages/fr.json                                             all texts (fr only — nl / en fall back)
```

## 7. Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `GET` | `/api/admin/vat-rates` | `AdminAuthGuard` | All rows, active first, by country |
| `POST` | `/api/admin/vat-rates` | + `AdminBillingAccessGuard`, audit `create vat_rate` | `{ country_code, rate, is_eu }`. Creates the Stripe TaxRate(s) first; Stripe fails → nothing saved. `409` if the country exists |
| `PATCH` | `/api/admin/vat-rates/:id` | + `AdminBillingAccessGuard`, audit `update vat_rate` | `{ rate?, is_eu?, is_active? }`. New rate → new TaxRate + old archived + background job re-points the card subscriptions of that country (from the next invoice). Close (`is_active: false`) → `409 Companies of this country pay by card` while one has a card subscription (Q10) |
| `GET` | `/api/vat-rates/countries` | `@Public()` | Active country codes only, for the signup and profile selects. Never the Stripe ids |
| `GET` | `/api/billing/subscription` | unchanged | + `vat: { country, kind, rate, reverse_charge }` or `{ kind: 'missing', reason }` |
| `POST` | `/api/billing/checkout` | unchanged | `409 Fill in your company country first` / `409 Your country is not supported yet` when `kind = missing` |
| `GET` | `/api/billing/history` and `/api/admin/billing/tenants/:tenantId/history` | unchanged | `billing` gets `subtotal` (HT), `tax_amount`, `tax_rate` (string, or `null` when the period mixes rates), `reverse_charge`, `total` (**TTC**). `plan_amount` / `extra_amount` stay HT |
| `POST` | `/api/auth/register` | unchanged | + `country` required, must be an **active** country of the TVA table, else `400` (Q11) |
| `POST` | `/api/admin/tenants` | unchanged | + `country` required, same check |
| `PATCH` | `/api/tenant` | unchanged | `country` cannot be `null` / empty and must be an active TVA-table country (an unchanged old value is accepted). `vat_number`: EU format check (`BE0123456789`), Q9 |
| `PATCH` | `/api/admin/tenants/:id` | unchanged | Same `country` / `vat_number` rules as `PATCH /api/tenant` |
| `GET` | `/api/tenant`, `/api/admin/tenants/:id` | unchanged | + `vat_number_status`, `vat_number_checked_at` |

`tenant_id` is never in a route or body — from the JWT (`nestjs-cls`), as always.

## 8. Tasks

Telegram: notify at the start of each phase, after each task, at the end of each phase (CLAUDE.md).

**Phase A — the TVA table (super-admin)**
- [x] A1 — Migration `subscription_vat_rates` + Prisma model + tenant-extension skip list + `SELLER_COUNTRY` in `env.config.ts` / `.env.example` (+ spec)
- [x] A2 — `src/vat-rates/` module: repository, service, `GET` / `POST` / `PATCH` admin routes, swagger, audit
- [x] A3 — Stripe `CreateTaxRateHandler` / `ArchiveTaxRateHandler`; create = Stripe first, then the row; rate change = new TaxRate + archive old
- [x] A4 — Close / reopen a country; close refused (`409`) while a company of that country has a card subscription (Q10)
- [x] A5 — `subscription-vat.helper.ts` + full unit tests of the § 3 table
- [x] A6 — Frontend: super-admin page `/admin/vat-rates` (table, add dialog, change rate dialog, close/open), sidebar entry, fr.json

**Phase B — the company's country and TVA number**
- [x] B1 — `GET /api/vat-rates/countries` (public)
- [x] B2 — Register: `country` required, only active TVA-table countries (Q11); frontend select fed by `GET /api/vat-rates/countries`
- [x] B3 — Super-admin create company: `country` required, same list; frontend select
- [x] B4 — Company profile: country can change (same list), never empty; frontend required select
- [x] B5 — TVA number: migration `vat_number_status` + `vat_number_checked_at` on `tenants`; format check; VIES check on save (`VAT_NUMBER_CHECK`); retry job for `pending`; profile and super-admin company page show the status (vérifié ✓ / non valide / vérification en cours / non vérifié (mode test))
- [x] B6 — `GET /billing/subscription` + `vat` block; Billing page: TVA line, and when `missing` a warning + link to the profile, **Pay** disabled; super-admin subscription card shows country + TVA status

**Phase C — charging with TVA**
- [x] C1 — Checkout: `default_tax_rates`; `409` when missing
- [x] C2 — `SyncSubscriptionTaxHandler`: subscription `default_tax_rates`, customer tax id, reverse-charge footer
- [x] C3 — Overage invoice item with `tax_rates`
- [x] C4 — Tenant country / TVA number change → app event → C2 (from the next invoice)
- [x] C5 — Rate change → background job → C2 for every card subscription of that country (not the reverse-charge ones)
- [x] C6 — One-time script `yarn tva:sync`: C2 for every existing card subscription; companies with `kind = missing` are listed in the output, not changed
- [x] C7 — Unit tests (checkout, sync, overage item, job)

**Phase D — showing the final price**
- [x] D1 — `InvoiceSummary` + `ListCustomerInvoicesHandler`: tax per line / invoice
- [x] D2 — `periodBilling`: `subtotal`, `tax_amount`, `tax_rate` (null when mixed), `reverse_charge`, `total` TTC (+ tests)
- [x] D3 — Frontend `UsagePeriodList.tsx`: Formule HT, Supplément HT, Total HT, TVA (21 % / "TVA 0 % — autoliquidation"), **Total payé** / **Total à payer** — company and super-admin history
- [x] D4 — Email "Paiement reçu": HT / TVA / TTC (fr, nl, en)
- [x] D5 — Email "Prochain prélèvement" (`invoice.upcoming`): HT / TVA / TTC
- [x] D6 — Email "Paiement échoué": amount TTC, "TVA comprise"
- [x] D7 — "HT" on every price: pricing page, Billing card, change-plan dialogs (company + super-admin), admin plans list / dialog
- [x] D8 — fr.json texts

**Phase E — close**
- [x] E1 — Backend `tsc` + lint + jest; frontend `tsc` + lint
- [x] E2 — Update `state.md`, tick this file, `A_progress-tracker.md`
- [ ] E3 — Owner: Stripe Dashboard seller TVA number (§ 5), then the live tests [../PhacesTest/20-subscription-tva.md](../PhacesTest/20-subscription-tva.md)

## 9. Acceptance

1. Super-admin adds BE 21 / FR 20 / NL 21 / DE 19 / ES 21 → 10 Stripe TaxRates exist (5 normal + 5 reverse charge).
2. Belgian company, card `4242`, plan 10 € → Stripe invoice 10 € + TVA 21% 2,10 € = **12,10 €**; history and email say the same.
3. French company **with** a TVA number → invoice 10 €, **TVA 0% autoliquidation**, footer mention, its TVA number on the invoice → **10,00 €**.
4. French company **without** a TVA number → 10 € + 20% = **12,00 €**.
5. Company without a country → Billing page warning, Pay disabled, `POST /billing/checkout` → `409`.
6. Super-admin changes BE to 22% → next Belgian invoice at 22%, the old invoice still 21% in the history.
7. Overage 4 € on a Belgian company → overage line taxed too → period block: 14 € HT, 2,94 € TVA, 16,94 € paid.

## 10. Notes to read

- [subscription-plans.md](../subscription-plans.md) — § TVA on the subscription, § The billing history, § The payment email
- [21-stripe-checkout.md](21-stripe-checkout.md) — Checkout, webhooks, history, test clocks
- [14-subscriptions.md](14-subscriptions.md) — Stripe module, renewal job
