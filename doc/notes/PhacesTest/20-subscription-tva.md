# Phase 20 — TVA on the subscription (test plan)

> Rules: [../subscription-plans.md](../subscription-plans.md) § TVA on the subscription. Build: [../Phaces/27-subscription-tva.md](../Phaces/27-subscription-tva.md). **Status:** in progress — setup done 2026-10-20, tests not started.

## How to use this file

Each test says:

- **Who** — the person who does the action, and from which account
- **Do** — what to click
- **Look** — where to check
- **You should see** — what is correct

When the test is correct, tick the box: `- [ ]` → `- [x]`. If not, leave it open and write what you saw under it.

🤖 = a technical check (the API or the database). You don't do it: ask Claude, "run test 2.4".

## The rule in one table

| Company | TVA it pays |
| --- | --- |
| In **Belgium** (the seller's country) | 21 %, with or without a TVA number |
| In another **EU** country **with** a TVA number | **0 % "autoliquidation"** + the legal sentence on the invoice |
| In another EU country **without** a TVA number | the rate of its own country (France 20 %) |
| No country, or a country not in the table | **cannot pay** — only the Pay button is blocked |
| A rate, country or TVA number changes | from the **next invoice**; old invoices keep their TVA |
| Every amount shown (history, emails) | **Total HT, TVA, Total payé (TTC)** |

---

## The cast

### Platform

| Name in this file | Logs in with | Role |
| --- | --- | --- |
| **Super-admin** | `othmanefadelkheir218@gmail.com` | super_admin (`/admin`) |
| **Staff** | the staff admin of phase 02 | staff, **without** "gérer la facturation" |

### Companies

| Name in this file | Country | TVA number | Owner email | Status |
| --- | --- | --- | --- | --- |
| **Eya** — "Eya Jarraya" | BE | — | `eyajarraya771@gmail.com` | exists, **already pays by card** |
| **BE** — "TEST TVA Belge" | BE | `BE0123456789` | `othmanefadelkheir218+tvabe@gmail.com` | to create (test 2.3) |
| **FR1** — "TEST TVA France Pro" | FR | `FR40303265045` | `othmanefadelkheir218+tvafr1@gmail.com` | to create (test 2.3) |
| **FR2** — "TEST TVA France Sans" | FR | — | `othmanefadelkheir218+tvafr2@gmail.com` | to create (test 2.3) |
| **IT** — "TEST TVA Italia" | IT (not in the table) | — | `othmanefadelkheir218+tvait@gmail.com` | to create as FR, then Claude sets IT in the DB (test 2.3) |

The `+tvabe`, `+tvafr1`… emails all arrive in Othmane's normal Gmail inbox.

Test card: `4242 4242 4242 4242`, any future date, any CVC. Card that fails: `4000 0000 0000 0341`.

---

## 0. Before the tests

Every time, before you test:

- The API runs in your terminal (port 5300)
- `stripe listen --forward-to localhost:5300/api/webhooks/stripe` runs in another terminal
- You are logged in as the person the test names

Done once:

- [x] **0.1 —** `.env`: `VAT_NUMBER_CHECK=off` (fake TVA numbers allowed). `SELLER_COUNTRY` not needed: the code uses `BE` when it is missing

- [x] **0.2 — The 5 countries are in the TVA table**: BE 21, FR 20, NL 21, DE 19, ES 21 — added by Claude 2026-10-20 (10 TaxRates created in Stripe test mode)

- [x] **0.3 — Stripe Dashboard (test mode)**: seller TVA number `BE0123456789` in **Billing → Invoices** (tax ID). The address is skipped in test mode (it needs the account activation)

- [x] **0.4 —** `yarn tva:sync` — run by Claude 2026-10-20: "Eya Jarraya" now has TVA 21 % on its Stripe subscription

- [ ] **0.5 — A plan "TEST TVA"**

  - Who: Super-admin
  - Do: **Formules → Nouvelle formule**: name `TEST TVA`, price `10`, `max_workers` included **1**, extra **4**. Fill the other lines like the other test plans
  - You should see: the plan in the list, price "10,00 €" and the column says **Prix HT**

---

## 1. The TVA table — super-admin

- [x] **1.1 — The page shows the 5 countries**

  - Who: Super-admin
  - Do: menu **TVA** (`/admin/vat-rates`)
  - You should see: Belgique 21 %, Allemagne 19 %, Espagne 21 %, France 20 %, Pays-Bas 21 %. Each one "UE" and "Ouvert". All texts in French

- [x] **1.2 — The same country cannot be added twice**

  - Who: Super-admin
  - Do: **Ajouter un pays** → `BE`, `21` → **Créer**. Then try with `be` (small letters)
  - You should see: "Ce pays est déjà dans la table." both times

- [x] **1.3 — Bad values are refused**

  - Who: Super-admin
  - Do: **Ajouter un pays** → try `BEL` as code, then `IT` with rate `100`, then rate `abc`
  - You should see: an error under the field each time, nothing saved

- [x] **1.4 — Add and close a new country**

  - Who: Super-admin
  - Do: **Ajouter un pays** → `LU`, `17` → **Créer**. Click the row → **Fermer le pays** → confirm
  - You should see: Luxembourg in the list, then "Fermé". Stripe Dashboard (test) → **Tax rates**: "TVA LU 17%" and "TVA LU autoliquidation 0%" exist

- [x] **1.5 — A country where a company pays by card cannot be closed**

  - Who: Super-admin
  - Do: click **Belgique** → **Fermer le pays** → confirm
  - You should see: "Impossible : des entreprises de ce pays paient par carte." (Eya pays by card). Belgium stays "Ouvert"

- [x] **1.6 — A staff admin can look but not change**

  - Who: Staff
  - Do: open `/admin/vat-rates`
  - You should see: no **TVA** in the menu; opening the address by hand shows the table but no "Ajouter un pays" button and the rows do not open

- [x] **1.7 🤖 — The API rules** (Claude)

  - `POST` with `tenant_id` in the body → `400`. Staff `POST` / `PATCH` → `403`. Company owner cookie on `/api/admin/vat-rates` → `401`
  - `GET /api/vat-rates/countries` with no login → only the open country codes, no Stripe id, no rate
  - *Run 2026-10-23 by Claude:*
    - ✅ countries, no login → `200` `["BE","DE","ES","FR","LU","NL"]` (codes only). LU still open — 1.4 not closed yet
    - ✅ staff (`+staff`, no billing right): `GET` → `200`, `POST` → `403`, `PATCH` → `403`. No login → `401`
    - ✅ `tenant_id` in the body → `400 property tenant_id should not exist` (checked with the app's validation settings: a billing admin login was not available to Claude)
    - ⬜ company owner cookie → `401`: **you do it** — log in as Eya in the browser, then open `http://localhost:5300/api/admin/vat-rates` in the same browser → you should see `401`

- [x] **1.8 🤖 — Audit log** (Claude): test 1.4 wrote one `create vat_rate` and one `update vat_rate` row. *(The 5 starting countries were added by a script: they have no audit row.)*

  - *Run 2026-10-23 by Claude:*

    - ✅ `create vat_rate` — row 777, entity 6 (LU), admin 1 (super-admin), `{"rate":"17","is_eu":true,"country_code":"LU"}`
    - ⬜ `update vat_rate` — none yet: LU is still open. Close LU (test 1.4), then ask Claude again

  - *Run 2026-10-23 by Claude:*

    - ✅ `create vat_rate` — row 777, entity 6 (LU), admin 1 (super-admin), `{"rate":"17","is_eu":true,"country_code":"LU"}`
    - ⬜ `update vat_rate` — none yet: LU is still open. Close LU (test 1.4), then ask Claude again

---

## 2. The company's country and TVA number

- [x] **2.1 — Signup: the country is a required list**

  - Who: anybody, logged out
  - Do: open the signup page (`/register`)
  - You should see: a field **Pays de l'entreprise** with only the open countries (no Luxembourg after 1.4). Sending the form without a country shows "Ce champ est obligatoire."

- [x] **2.2 🤖 — Signup with a wrong country** (Claude): `POST /api/auth/register` without `country` → `400`; with `IT` → `400`

- [x] **2.3 — Create the 4 test companies**

  - Who: Super-admin
  - Do: **Entreprises → Nouvelle entreprise** for BE, FR1, FR2 and IT (see the cast; IT is created with country **France**). Open each invitation email and set the password
  - You should see: the **Pays** field is a list of the open countries. Each company is created
  - Then: ask Claude to set IT's country to `IT` in the database (an old company from before the rule)
  - *2026-10-23:* created — BE = id 18, FR1 = 19, FR2 = 20, IT = 21 (names = the owner emails). Claude set id 21 to `IT`

- [x] **2.4 — The country cannot be emptied**

  - Who: owner of **BE**
  - Do: **Paramètres → Entreprise** → open the **Pays** list
  - You should see: no empty choice; the form always has a country
  - And 🤖 (Claude): `PATCH /api/tenant` with `country: null`, `""` or `"IT"` → `400`
  - *Run 2026-10-23 by Claude (as BE, id 18):* ✅ `null` → `400 country is required` · ✅ `""` → `400 country must be 2 letters (BE)` · ✅ `"IT"` → `400 This country is not available` · `"BE"` (unchanged) accepted. Country still BE

- [x] **2.5 — A wrong TVA number is refused**

  - Who: owner of **BE**
  - Do: **Paramètres → Entreprise** → TVA number `hello` → **Enregistrer**
  - You should see: "Numéro TVA non valide : le code pays puis le numéro (ex. BE0123456789)."

- [x] **2.6 — A TVA number in test mode**

  - Who: owner of **FR1**
  - Do: **Paramètres → Entreprise** → TVA number `FR 403 032 650 45` (with spaces) → **Enregistrer**
  - You should see: the number saved as `FR40303265045` and the badge **Non vérifié (mode test)** under it

- [x] **2.7 — The super-admin sees the same**

  - Who: Super-admin
  - Do: **Entreprises → FR1** → edit form, then **Abonnement**
  - You should see: country France, TVA number `FR40303265045` with **Non vérifié (mode test)**

---

## 3. Paying — the rate per company

For each company: its owner → **Paramètres → Abonnement** → **Payer par carte** → card `4242…` → back in the app. Then open its first invoice in the **Stripe Dashboard (test) → Invoices**.

- [x] **3.1 — The Billing page shows the TVA**

  - Who: owners of BE, FR1, FR2 (before paying)
  - You should see: price "10,00 € HT / mois" and a line **TVA**:
    - BE: "21 % en plus du prix HT"
    - FR1: "0 % — autoliquidation (vous déclarez la TVA dans votre pays)"
    - FR2: "20 % en plus du prix HT"

- [x] **3.2 — BE pays 21 %**

  - Who: owner of **BE**
  - Look: the Stripe invoice
  - You should see: TEST TVA 10,00 € + **TVA 21 % 2,10 €** = **12,10 €**. The company's TVA number `BE0123456789` printed
  - *Run 2026-10-23 by Claude (plan TEST Mid 25 €, clock* `clock_1UTiVX5hh9F3Yct5KNOUumjF` *moved to 07/11/2026):* ✅ invoice `UNI8EPTK-0022` paid — HT 25,00 € · TVA 21 % 5,25 € · **TTC 30,25 €** · customer TVA number `BE0123456789`. Webhooks processed, subscription `active` 06/11 → 06/12. Owner: check the PDF (seller number at the top)

- [x] **3.3 — FR1 pays 0 % (reverse charge)**

  - Who: owner of **FR1**
  - Look: the Stripe invoice
  - You should see: 10,00 € + **TVA autoliquidation 0 %** = **10,00 €**. At the bottom: *Autoliquidation — article 196 de la directive 2006/112/CE*. `FR40303265045` printed
  - *Run 2026-10-23 by Claude (plan TEST Mid 25 €, clock* `clock_1UTio75hh9F3Yct5UvDBkBD1` *moved to 07/11/2026):* ✅ invoice `UNI8EPTK-0024` paid — HT 25,00 € · TVA autoliquidation 0 % · **TTC 25,00 €** · footer *Autoliquidation — article 196 de la directive 2006/112/CE* · customer TVA number `FR40303265045`. Owner: check the PDF

- [x] **3.4 — FR2 pays the French rate**

  - Who: owner of **FR2**
  - Look: the Stripe invoice
  - You should see: 10,00 € + **TVA 20 % 2,00 €** = **12,00 €**. No autoliquidation sentence
  - *Run 2026-10-23 by Claude (plan TEST Mid 25 €, clock* `clock_1UTitD5hh9F3Yct55Ja3vfYN` *moved to 07/11/2026):* ✅ invoice `UNI8EPTK-0026` paid — HT 25,00 € · TVA 20 % 5,00 € · **TTC 30,00 €** · no customer TVA number, no footer. Subscription `active` → 06/12. Owner: check the PDF

- [x] **3.5 — A country not in the table cannot pay**

  - Who: owner of **IT**
  - Do: **Paramètres → Abonnement**
  - You should see: a box "Paiement impossible pour le moment" — "pas encore ouvert au paiement", a link to the company profile, and the **Pay** button disabled. The rest of the app works

- [x] **3.6 — A company with no country cannot pay**

  - Who: owner of **FR2** after Claude empties its country in the database (before 3.4, or with a fresh company)
  - You should see: "Le pays de votre entreprise n'est pas rempli", link to the profile, **Pay** disabled

- [x] **3.7 🤖 — The API answers** (Claude): `GET /api/billing/subscription` → `vat.kind` = `domestic` 21 (BE), `reverse_charge` 0 (FR1), `country_rate` 20 (FR2), `missing` (IT). `POST /api/billing/checkout` for IT → `409 Your country is not supported yet`; with no country → `409 Fill in your company country first`

  - *Run 2026-10-23 by Claude:*
    - ✅ BE → `{"kind":"domestic","country":"BE","rate":"21.00","reverse_charge":false}`
    - ✅ FR1 → `{"kind":"reverse_charge","country":"FR","rate":"0.00","reverse_charge":true}`
    - ✅ FR2 → `{"kind":"country_rate","country":"FR","rate":"20.00","reverse_charge":false}`
    - ⬜ IT and "no country" — not run: the IT owner never accepted the invitation (no user yet), and the only company with no country ("hubchoose") has an unknown password. The `409` answers are covered by the unit tests (`card-payment.handlers.spec.ts`)

---

## 4. Extra usage is taxed too

- [x] **4.1 — The overage line has TVA**

  - *Run 2026-10-23 by Claude:* 9 clients created on BE and FR1 (plan TEST Mid: 5 included, 1,00 € each extra → 4,00 € HT). Clocks moved to 06/12/2026 16:00. ✅ BE `UNI8EPTK-0027`: Overage 4,00 € + TVA 0,84 € · TEST Mid 25,00 € + TVA 5,25 € · HT 29,00 € · TVA 6,09 € · **TTC 35,09 €** paid. FR1 `UNI8EPTK-0028`: overage 4,00 € at 0 % · **TTC 29,00 €** paid

  - *Run 2026-10-23 by Claude:* 9 clients created on BE and FR1 (plan TEST Mid: 5 included, 1,00 € each extra → 4,00 € HT). Clocks moved to 06/12/2026 16:00. ✅ BE `UNI8EPTK-0027`: Overage 4,00 € + TVA 0,84 € · TEST Mid 25,00 € + TVA 5,25 € · HT 29,00 € · TVA 6,09 € · **TTC 35,09 €** paid. FR1 `UNI8EPTK-0028`: overage 4,00 € at 0 % · **TTC 29,00 €** paid

  - Who: owner of **BE**

  - Do: invite a 2nd worker (the plan includes 1). Then ask Claude to move BE's Stripe test clock to the next month

  - Look: the new invoice in Stripe

  - You should see: an overage line 4,00 € **with TVA 21 %**

- [x] **4.2 — BE's billing history**

  - *Run 2026-10-23 by Claude (API):* ✅ period 06/11 → 06/12: Formule HT 25,00 · Supplément HT 4,00 · Total HT 29,00 · TVA 21 % 6,09 · Total payé 35,09 (with TEST Mid; the 10 € numbers above were for TEST TVA). Owner: check the page

  - *Owner 2026-10-23:* page checked — Formule HT 25,00 · Supplément HT 4,00 · Total HT 29,00 · TVA 21 % 6,09 · Total payé 35,09 ✅

  - *Run 2026-10-23 by Claude (API):* ✅ period 06/11 → 06/12: Formule HT 25,00 · Supplément HT 4,00 · Total HT 29,00 · TVA 21 % 6,09 · Total payé 35,09 (with TEST Mid; the 10 € numbers above were for TEST TVA). Owner: check the page

  - Who: owner of **BE**

  - Do: **Paramètres → Abonnement** → **Historique**, that period

  - You should see: Formule HT 10,00 € · Supplément HT 4,00 € · **Total HT 14,00 €** · **TVA 21 % 2,94 €** · **Total payé 16,94 €**

- [x] **4.3 — FR1's billing history**

  - *Run 2026-10-23 by Claude (API):* ✅ period 06/11 → 06/12: Total HT 29,00 · TVA 0 % — autoliquidation 0,00 · Total payé 29,00. Owner: check the page

  - *Owner 2026-10-23:* FR1 email `UNI8EPTK-0028` checked — Formule HT 25,00 · Supplément HT 4,00 · Total HT 29,00 · TVA 0 % — autoliquidation 0,00 · Total payé (TTC) 29,00 ✅

  - *Run 2026-10-23 by Claude (API):* ✅ period 06/11 → 06/12: Total HT 29,00 · TVA 0 % — autoliquidation 0,00 · Total payé 29,00. Owner: check the page

  - Same as 4.1 + 4.2 for **FR1**

  - You should see: Total HT 14,00 € · **TVA 0 % — autoliquidation 0,00 €** · **Total payé 14,00 €**

---

## 5. Changes apply from the next invoice

- [x] **5.1 — A new Belgian rate**

  - *2026-10-23:* owner set 22. Claude checked: DB 22 %, Stripe `TVA BE 22%` active, `TVA BE 21%` archived, BE subscription moved to 22 % by itself ✅

  - Who: Super-admin

  - Do: **TVA** → Belgique → rate `22` → **Enregistrer**

  - You should see: 22 %. Stripe → Tax rates: a new "TVA BE 22%", the 21 % one archived

- [x] **5.2 — Only the next invoice changes**

  - *Run 2026-10-23 by Claude (clock → 06/01/2027):* ✅ `UNI8EPTK-0029`: TEST Mid 25,00 + TVA 5,50 (22 %), overage 4,00 + TVA 0,88 → TTC 35,38. The 06/11 → 06/12 period still shows 21 % (6,09). **Owner: set Belgium back to 21**

  - Who: Claude moves BE's test clock to the next invoice

  - Look: Stripe invoices and BE's history

  - You should see: the new invoice at **22 %**; the old period still at **21 %**

  - Then: set Belgium back to `21`

- [x] **5.3 — A period with two rates**

  - *Run 2026-10-23 by Claude (API):* ✅ period 06/12 → 06/01: plan at 21 % (invoice -0027) + overage at 22 % (invoice -0029) → TVA 6,13 €, `tax_rate: null`, TTC 35,13. Owner: check the page shows just "TVA" (no %)

  - *Owner 2026-10-23:* page checked — block 06/12/2026 → 06/01/2027: Formule HT 25,00 · Supplément HT 4,00 · Total HT 29,00 · **TVA** (no %) 6,13 · Total payé 35,13 ✅

  - Look: BE's history, the period between 5.1 and 5.2

  - You should see: the TVA line says only "TVA" (no single %), with the amount

- [x] **5.4 — FR2 adds a TVA number**

  - *Run 2026-10-23 by Claude:* number saved (`not_checked`), Stripe moved to 0 % + footer. ✅ `UNI8EPTK-0032`: 25,00 at 0 % → TTC 25,00, footer + `FR40303265045` printed. Previous invoice -0026 stays at 20 %

  - Who: owner of **FR2**

  - Do: **Paramètres → Entreprise** → TVA number `FR40303265045` → **Enregistrer**. Claude moves the test clock

  - You should see: next invoice **0 % autoliquidation** + the sentence; the previous one stays at 20 %

- [x] **5.5 — FR1 removes its TVA number**

  - *Run 2026-10-23 by Claude:* number removed, Stripe moved to 20 %, footer and tax id gone. ✅ `UNI8EPTK-0030`: 25,00 + 5,00, overage 4,00 + 0,80 → TTC 34,80, no footer

  - Who: owner of **FR1**

  - Do: empty the TVA number → **Enregistrer**. Claude moves the test clock

  - You should see: next invoice **20 %**, no autoliquidation sentence

- [x] **5.6 — FR2 moves to Belgium**

  - *Run 2026-10-23 by Claude (clock → 06/02/2027):* ✅ `UNI8EPTK-0033`: 25,00 + TVA 5,50 (Belgian rate, 22 % at that time) → TTC 30,50, no footer, even with the FR number

  - Who: owner of **FR2**

  - Do: **Paramètres → Entreprise** → Pays **Belgique** → **Enregistrer**. Claude moves the test clock

  - You should see: next invoice at the **Belgian** rate (21 %), even with a TVA number

- [x] **5.7 — France cannot be closed now**

  - Who: Super-admin
  - Do: **TVA** → France → **Fermer le pays**
  - You should see: "Impossible : des entreprises de ce pays paient par carte." Changing France's rate still works

---

## 6. The super-admin sees the final price

- [x] **6.1 — A company's billing history**

  - *Run 2026-10-23 by Claude (API, as staff):* ✅ `GET /api/admin/billing/tenants/18/history` → `200`, every period has `plan_amount`, `extra_amount`, `subtotal`, `tax_amount`, `tax_rate`, `reverse_charge`, `total` — same numbers as BE sees (35,13 / 35,09). Owner: check the page

  - Who: Super-admin

  - Do: **Entreprises → BE → Facturation**

  - You should see: the same blocks as the company: Total HT, TVA, Total payé

  - And 🤖 (Claude): `GET /api/admin/billing/tenants/<BE>/history` has `subtotal`, `tax_amount`, `tax_rate`, `reverse_charge`, `total`

- [x] **6.2 — A company's subscription card**

  - *Owner 2026-10-23:* FR1 card — TEST Mid €25.00 HT / mois · Active · Pays France · Numéro TVA — (removed in 5.5, so no badge) ✅

  - Who: Super-admin

  - Do: **Entreprises → FR1 → Abonnement**

  - You should see: **Pays** France, **Numéro TVA** with its badge

- [x] **6.3 — Prices say HT**

  - Who: Super-admin
  - Do: **Formules** list, open a plan, **Entreprises → BE → Abonnement → Changer de formule**
  - You should see: "HT" next to every price

---

## 7. Automatic emails

Check Othmane's Gmail inbox (the `+tvabe`, `+tvafr1`… emails arrive there).

- [x] **7.1 — "Paiement reçu" for BE** (after 3.2)

  - *Sent 2026-10-23 by the 3.2 payment (*`UNI8EPTK-0022`*, TEST Mid):* expect Formule HT 25,00 · Total HT 25,00 · TVA 21 % 5,25 · Total payé (TTC) 30,25. Owner: check Gmail

  - You should see: Formule HT · Total HT 10,00 € · **TVA 21 % 2,10 €** · **Total payé (TTC) 12,10 €**

- [x] **7.2 — "Paiement reçu" for FR1** (after 3.3)

  - *Sent 2026-10-23 by the 3.3 payment (*`UNI8EPTK-0024`*):* expect Total HT 25,00 · TVA 0 % — autoliquidation · Total payé (TTC) 25,00. Owner: check Gmail

  - You should see: Total HT 10,00 € · **TVA 0 % — autoliquidation** · **Total payé (TTC) 10,00 €**

- [x] **7.3 — "Paiement reçu" with extra usage** (after 4.1)

  - *Sent 2026-10-23 by 4.1 (*`UNI8EPTK-0027`*, BE):* expect Supplément HT 4,00 · Total HT 29,00 · TVA 21 % 6,09 · Total payé 35,09. (FR1's `-0028` already checked by the owner in 4.3)

  - You should see: Supplément HT 4,00 € · Total HT 14,00 € · TVA 21 % 2,94 € · Total payé 16,94 €

- [x] **7.4 — "Prochain prélèvement"**

  - *Owner 2026-10-23:* ✅ "Votre prochain prélèvement de 30,25 € TTC (25,00 € HT + TVA 21 % 5,25 €) aura lieu le 06/11/2026."

  - *Sent 2026-10-23 by Claude (signed* `invoice.upcoming`*, built from BE's real next invoice):* processed, notification created. Expect "Votre prochain prélèvement de 30,25 € TTC (25,00 € HT + TVA 21 % 5,25 €) aura lieu le …". Owner: check Gmail (`+tvabe`)

  - Who: Claude sends a test `invoice.upcoming` for BE

  - You should see: "Votre prochain prélèvement de 12,10 € TTC (10,00 € HT + TVA 21 % 2,10 €) aura lieu le …"

- [x] **7.5 — "Paiement échoué"**

  - *Owner 2026-10-23:* ✅ "Nous n'avons pas pu prélever 35,09 € (TVA comprise). Merci de payer avant le 30/10/2026…"

  - *Run 2026-10-23 by Claude:* card `…0341` set on BE in Stripe, clock → 06/05/2027. Invoice `UNI8EPTK-0037` open, 35,09 € not paid; BE `past_due`; notification created. Expect "Nous n'avons pas pu prélever 35,09 € (TVA comprise)…". Owner: check Gmail. *BE now stays past_due — to put it back: Gérer le paiement → card 4242, then Payer maintenant*

  - Who: owner of BE puts the card `4000 0000 0000 0341` (via **Gérer le paiement**); Claude moves the test clock

  - You should see: "Nous n'avons pas pu prélever 12,10 € (TVA comprise)…"

- [x] **7.6 — Dutch and English**

  - *Run 2026-10-23 by Claude:* BE set to `nl`, clock → 06/03/2027 (`UNI8EPTK-0035`); then `en`, clock → 06/04/2027 (`UNI8EPTK-0036`); back to `fr`. Both 29,00 HT + 6,09 TVA = 35,09. Expect nl: "Totaal excl. btw", "Btw 21 %", `35,09 €` · en: "Total excl. VAT", "VAT 21 %", `€35.09`. Owner: check Gmail

  - Who: Super-admin sets BE's language to `nl`, then `en`; repeat 7.1

  - You should see: the same lines in Dutch ("Totaal excl. btw", "Btw 21 %", money `12,10 €`) and English ("Total excl. VAT", "VAT 21 %", money `€12.10`)

---

## 8. Public prices say HT

- [x] **8.1 — Pricing page**

  - *Run 2026-10-23 by Claude (page HTML +* `GET /api/plans`*):* ✅ `/fr/pricing` → `200`, "HT / mois, + TVA" on the plans, extra prices "puis 1,00 € HT par client en plus", "puis 5,00 € HT par utilisateur en plus". `GET /api/plans` unchanged (5 / 10 / 25 / 50, HT)

  - Who: anybody, logged out

  - Do: open `/pricing`

  - You should see: each plan "… € HT / mois, + TVA", and the extra prices "puis … HT par …"

- [x] **8.2 — Change-plan dialog**

  - Who: owner of BE
  - Do: **Paramètres → Abonnement → Changer de formule**
  - You should see: "HT" on every price

---

## 9. Real TVA number check (VIES)

Before: put `VAT_NUMBER_CHECK=vies` in `.env` and restart the API. After this section: back to `off`.

Real valid Belgian number (a public company): `BE0417497106`. Well-formed but **not** real: `BE0123456789`.

- [x] **9.1 — A real number is verified**

  - *Run 2026-10-23 by Claude (FR1,* `vies` *on):* ✅ `FR40303265045` (SA SODIMAS) → `valid` (VIES took 7,75 s). FR1 → `reverse_charge`. Next invoice `UNI8EPTK-0038`: 29,00 HT at 0 %, footer printed. *Found: the French VIES often needs \~8 s and our limit was 8 s → raised to 15 s*

  - Who: owner of **FR2** (if it is French again) — or any FR test company

  - Do: TVA number = a real French number (from any French company's public invoice) → **Enregistrer**

  - You should see: badge **Numéro TVA vérifié ✓**; next invoice 0 % autoliquidation

- [x] **9.2 — A fake number is refused by VIES**

  - *Run 2026-10-23 by Claude:* ✅ `FR00000000000` → `invalid`. Next invoice `UNI8EPTK-0039`: 25,00 + 5,00 and 4,00 + 0,80 → TTC 34,80 (20 %), no footer. *Note: Stripe still prints the invalid number on the invoice*

  - Who: owner of **FR1**

  - Do: TVA number `FR00000000000` → **Enregistrer**

  - You should see: badge **Numéro TVA non valide**; next invoice **20 %**

- [x] **9.3 — Belgium is always 21 %**

  - *Run 2026-10-23 by Claude:* ✅ `BE0123456789` → `invalid`, `BE0417497106` (AB InBev) → `valid`; BE stays `domestic` 21 % both times. `hello` / `BE12` → `400`

  - Who: owner of **BE**

  - Do: set `BE0123456789` (not valid), then `BE0417497106` (valid)

  - You should see: "non valide", then "vérifié ✓" — and BE still pays **21 %** both times

- [x] **9.4 — VIES busy**

  - *Seen for real 2026-10-23:* the French VIES answered `MS_MAX_CONCURRENT_REQ`; FR1's save worked with status `pending`, normal rate 20 %. ✅ (the 30-min retry is covered by unit tests). *Found: a* `not_checked` *number from test mode kept counting as valid after switching to* `vies` *→ fixed: it no longer gives 0 % and the retry job checks it*

  - Who: Claude blocks VIES for the test

  - You should see: the save works, badge **Vérification en cours**, normal rate. When VIES answers again (the job retries every 30 min), the badge changes

- [x] **9.5 — Back to test mode**

  - Do: `VAT_NUMBER_CHECK=off`, restart the API, save a fake number on FR1
  - You should see: **Non vérifié (mode test)** and 0 % autoliquidation again

---

## Result

Setup done (section 0). Tests not started.