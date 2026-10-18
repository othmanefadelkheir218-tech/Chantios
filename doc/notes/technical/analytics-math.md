# ChantierOS — Analytics: the math, a worked example, and how it is shown

> The rules are in [../analytics.md](../analytics.md). This file explains **how each number is calculated**, works through **one small example by hand**, and gives **SQL to check the page against the database**.
>
> Code: backend `src/company-analytics/` (handler + 2 helpers) and the read methods in each source module. Frontend `app/[locale]/(tenant)/analytics/`.

---

## 1. Common rules

### 1.1 The period

| Input | Result |
|---|---|
| no `from`, no `to` | `to` = today (company timezone), `from` = the 1st of the month **11 months before** `to` → 12 months |
| only `to` | `from` = the 1st of the month 11 months before `to` |
| only `from` | `to` = today |
| `from` > `to` | `400` |
| more than **24 calendar months** touched | `400` |

"Months touched" counts calendar months, not days: `2026-01-31 → 2026-02-01` is 2 months.

Example — today is **2026-10-17**, no filter → `from = 2025-11-01`, `to = 2026-10-17`, months = `2025-11 … 2026-10` (12).

Page buttons → what is sent:

| Button | `from` | `to` |
|---|---|---|
| Ce mois | `2026-10-01` | `2026-10-17` |
| Ce trimestre | `2026-10-01` (1st month of the quarter) | `2026-10-17` |
| Cette année | `2026-01-01` | `2026-10-17` |
| 12 derniers mois | nothing (backend default) | nothing |
| Personnalisé | the two dates | the two dates |

### 1.2 Months are always complete

Every block "by month" has **one row for every month of the period**, in order. A month with no data is `0`, never missing.

How: the database gives one total **per day**; the helper `totalsByMonth` adds each day into its month (`YYYY-MM` = first 7 characters of the date) and starts every month at `0`.

### 1.3 Percent

`percentOf(part, whole) = part ÷ whole × 100`, rounded to **1 decimal** (half up).
If `whole ≤ 0` → `null` (the page shows `—`). Never a division by zero.

### 1.4 Money

- Strings with 2 decimals, never a JS float in the backend (`Prisma.Decimal`).
- **Incl. VAT**: invoiced, collected, open, top clients, purchases.
- **Excl. VAT**: margins (same as the `/margins` page).

### 1.5 Dates and timezone

- `issue_date`, `payment_date`, `work_date`, `due_date` are **date-only** columns → used as they are.
- Quote dates (`sent_at`, `accepted_at`, `refused_at`) are **moments** → turned into the local day in the **company timezone** (`Europe/Brussels`) before choosing the month.
- "Days late" uses the database date (`CURRENT_DATE`), the same as the `invoice_balance` view, so it matches the invoices list.

### 1.6 Who sees what

The page needs `analytics:view`. Each block also needs view on its module, or it is **not in the answer**:

| Block | Module |
|---|---|
| revenue, aging, top_clients | `invoices` |
| margins | `margins` |
| quotes | `quotes` |
| hours | `time_entries` (scope `own` → only my hours) |
| purchases | `purchase_invoices` |

---

## 2. The example data

Today = **2026-10-17**. Period = **2026-08-01 → 2026-10-17** → months `2026-08`, `2026-09`, `2026-10`.

### Invoices (amounts incl. VAT)

| Invoice | Client | Issue | Due | Status | Amount | Payments |
|---|---|---|---|---|---|---|
| INV-0 | C | 2026-06-01 | 2026-07-01 | sent | 3 000,00 | 1 000,00 on 2026-08-15 |
| INV-1 | A | 2026-08-10 | 2026-09-09 | paid | 1 210,00 | 1 210,00 on 2026-08-25 |
| INV-2 | A | 2026-09-05 | 2026-10-05 | partially_paid | 2 420,00 | 1 000,00 on 2026-09-20 |
| INV-3 | B | 2026-09-20 | 2026-10-20 | sent | 605,00 | — |
| INV-4 | B | 2026-10-02 | — | **draft** | 500,00 | — |

### Quotes (company timezone Europe/Brussels)

| Quote | Status now | sent_at | accepted_at | refused_at |
|---|---|---|---|---|
| Q1 | accepted | 2026-08-03 | 2026-08-12 | — |
| Q2 | refused | 2026-08-20 | — | 2026-09-01 |
| Q3 | sent | 2026-09-15 | — | — |
| Q4 | accepted | **2026-07-25** (before the period) | 2026-08-05 | — |
| Q5 | sent | **2026-09-30 22:30 UTC** = 2026-10-01 00:30 in Brussels | — | — |

### Projects (live margin, excl. VAT)

| Project | Status | Budget (accepted quotes) | Material | Labour | Bills | Total cost |
|---|---|---|---|---|---|---|
| P1 | in_progress | 10 000 | 1 500 | 120 h × 35 = 4 200 | 2 300 | 8 000 |
| P2 | in_progress | 2 000 | 400 | 40 h × 35 = 1 400 | 800 | 2 600 |
| P3 | in_progress | 5 000 | 1 000 | 50 h × 30 = 1 500 | 1 000 | 3 500 |
| P4 | prospect | 0 (no accepted quote) | — | — | — | — |

### Hours

| Month | P1 | P2 | P3 |
|---|---|---|---|
| 2026-08 | 40 | 16 | — |
| 2026-09 | 60 | — | — |
| 2026-10 | — | — | 8 |

### Supplier / subcontractor bills (incl. VAT)

| Bill | Issue | Status | Amount |
|---|---|---|---|
| PUR-1 | 2026-08-12 | paid | 1 210,00 |
| PUR-2 | 2026-09-03 | to_pay | 484,00 |
| PUR-3 | 2026-09-18 | to_pay | 2 420,00 |

---

## 3. Each block — rule, math on the example, display

### 3.1 `revenue` — invoiced vs collected per month

**Rule**
- Invoiced = Σ `invoices.amount_incl_vat`, `issue_date` in the period, status **not** `draft` / `cancelled`.
- Collected = Σ `payments.amount`, `payment_date` in the period (a negative correction row counts). A payment counts in the month it was **received**, even for an invoice issued before the period.

**Math**

| Month | Invoiced | Collected |
|---|---|---|
| 2026-08 | INV-1 = **1 210,00** | INV-1 1 210 + INV-0 1 000 = **2 210,00** |
| 2026-09 | INV-2 2 420 + INV-3 605 = **3 025,00** | INV-2 = **1 000,00** |
| 2026-10 | **0** (INV-4 is a draft) | **0** |
| **Total** | **4 235,00** | **3 210,00** |

INV-0 is not "invoiced" (issued in June) but its August payment is "collected".

**Display** — two numbers on top, then grouped bars (light = invoiced, orange = collected). See § 4.1 for the bar heights.

### 3.2 `aging` — unpaid invoices by days late (today, not the period)

**Rule** — the same unpaid set as the dashboard: status `sent` or `partially_paid` **and** `balance_due > 0` (`balance_due = amount_incl_vat − Σ payments`).

| Group | Condition |
|---|---|
| `not_due` | not late (`due_date ≥ today`) |
| `late_1_30` | today − `due_date` = 1 … 30 |
| `late_31_60` | 31 … 60 |
| `late_60_plus` | more than 60 |

Total = Σ of the 4 groups. **The period filter does not change this block.**

**Math**

| Invoice | Balance | Days late | Group |
|---|---|---|---|
| INV-0 | 3 000 − 1 000 = 2 000,00 | 17 Oct − 1 Jul = **108** | late_60_plus |
| INV-1 | 0 | — | not unpaid |
| INV-2 | 2 420 − 1 000 = 1 420,00 | 17 Oct − 5 Oct = **12** | late_1_30 |
| INV-3 | 605,00 | due 20 Oct → not late | not_due |
| INV-4 | draft | — | not unpaid |

Result: not_due 1 / 605,00 · 1–30: 1 / 1 420,00 · 31–60: 0 / 0 · 60+: 1 / 2 000,00 · **Total 3 / 4 025,00**.

**Display** — one row per group with a colored dot (green, gold, orange, red), the count and the amount; the total at the bottom, red if > 0.

### 3.3 `top_clients` — the 5 clients with the most invoiced

**Rule** — the same invoices as "invoiced" (§ 3.1). Per client: invoiced = Σ amount; collected = Σ **everything paid on those invoices** (all their payments, whatever the date); `collected_pct = collected ÷ invoiced`. Sorted by invoiced (highest first), then client id. Max 5.

**Math**

| Client | Invoiced | Collected | % |
|---|---|---|---|
| A | 1 210 + 2 420 = **3 630,00** | 1 210 + 1 000 = **2 210,00** | 2 210 ÷ 3 630 × 100 = 60,88 → **60.9** |
| B | **605,00** (INV-4 draft excluded) | **0** | **0.0** |
| C | not listed (INV-0 issued before the period) | | |

**Display** — rank, name, invoiced amount, one bar per client. The **track** length = invoiced ÷ biggest invoiced (A = 100 %, B = 605 ÷ 3 630 = 16.7 %). The **orange inner part** = collected ÷ invoiced of that client (A = 60.9 % of its bar). The text on the right shows the % with **0 decimals**: "61 % encaissé".

### 3.4 `margins` — average margin, best and worst projects (today)

**Rule** — read from the `project_margin_live` view:
- budget = Σ `amount_excl_vat` of the project's **accepted** quotes
- material = Σ (−quantity × unit_price) of `consumption` + `adjustment` stock movements of the project
- labour = Σ (hours × frozen hourly_rate) of its time entries
- bills = Σ `amount_excl_vat` of its purchase invoices, **except** cost type `material` (already counted from the stock)
- total cost = material + labour + bills · margin = budget − total cost · margin % = margin ÷ budget × 100 (2 decimals, in the view)

Only projects `prospect` / `in_progress` with **budget > 0**. Sorted by margin % (highest first).

- **Average = Σ margin ÷ Σ budget × 100** (weighted: a big project weighs more). 1 decimal.
- **Best** = the first 5. **Worst** = the last 5 of what is left after "best", worst first. A project is never in both. With 5 projects or fewer, "worst" is empty.

**Math**

| Project | Margin | % |
|---|---|---|
| P3 | 5 000 − 3 500 = 1 500 | 30.00 |
| P1 | 10 000 − 8 000 = 2 000 | 20.00 |
| P2 | 2 000 − 2 600 = −600 | −30.00 |
| P4 | excluded (budget 0) | |

Average = (1 500 + 2 000 − 600) ÷ (5 000 + 10 000 + 2 000) × 100 = 2 900 ÷ 17 000 × 100 = 17,06 → **17.1 %**.
(A simple average of the % would give (30 + 20 − 30) ÷ 3 = 6.7 % — not used, it lets a small project weigh as much as a big one.)
Best = P3, P1, P2. Worst = empty (only 3 projects).

With 7 projects sorted 1…7: best = 1, 2, 3, 4, 5; worst = 7, 6.

**Display** — two lists, each row = project name + margin amount + %. Red when the margin is negative. A row opens the project's margin tab.

### 3.5 `quotes` — sent / accepted / refused, conversion rate

**Rule**
- Each date is put in **its own month** (company timezone): sent by `sent_at`, accepted by `accepted_at`, refused by `refused_at`. A date outside the period is ignored.
- The 4 numbers on top look at the quotes **sent in the period** and their status **now**: sent, accepted, refused, waiting (status `sent`).
- **Conversion = accepted ÷ sent** (of the quotes sent in the period).

**Math**

Sent in the period: Q1, Q2, Q3, Q5 (Q5 counts in **October**, its Brussels day). Q4 was sent in July → not in the 4.
- sent **4** · accepted **1** (Q1) · refused **1** (Q2) · waiting **2** (Q3, Q5)
- conversion = 1 ÷ 4 × 100 = **25.0 %**

By month:

| Month | Sent | Accepted | Refused |
|---|---|---|---|
| 2026-08 | Q1, Q2 = **2** | Q1, Q4 = **2** | **0** |
| 2026-09 | Q3 = **1** | **0** | Q2 = **1** |
| 2026-10 | Q5 = **1** | **0** | **0** |

Note: the monthly "accepted" total (2) can be bigger than the card's "accepted" (1): Q4 was **accepted** in the period but **sent** before it. Both are correct — they answer two different questions.

**Display** — 4 small boxes, then grouped bars (grey = sent, green = accepted, red = refused).

### 3.6 `hours` — hours per month, top 5 projects

**Rule** — Σ `time_entries.hours` with `work_date` in the period. With scope `own`, only the user's entries. Top 5 projects by hours (highest first, then project id). Total = Σ of the months.

**Math** — by month: 08 = 40 + 16 = **56**, 09 = **60**, 10 = **8** → total **124**. Top: P1 100, P2 16, P3 8.

**Display** — total, bars per month, then a ranked list with one bar per project (length = hours ÷ biggest, P1 = 100 %, P2 = 16 %, P3 = 8 %). Text: "100,0 h".

### 3.7 `purchases` — bills per month

**Rule** — Σ `purchase_invoices.amount_incl_vat` with `issue_date` in the period, **every status** (paid or to pay), supplier and subcontractor bills.

**Math** — 08 = **1 210,00**, 09 = 484 + 2 420 = **2 904,00**, 10 = **0** → total **4 114,00**.

**Display** — total, one bar per month.

### 3.8 The 4 cards on top

| Card | Value | Small text | From |
|---|---|---|---|
| Encaissé | 3 210,00 € | "4 235,00 € facturé sur la période" | `revenue` |
| Marge moyenne | 17,1 % | "Sur 3 projets en cours avec budget" | `margins` |
| Taux de conversion des devis | 25,0 % | "1 acceptés sur 4 envoyés" | `quotes` |
| Reste à encaisser | 4 025,00 € | "3 factures impayées, aujourd'hui" | `aging` |

A card whose block is missing (no right) is not shown.

---

## 4. How the charts are drawn

No chart library: plain HTML bars with the theme colors (light and dark come from the tokens).

### 4.1 Month bars (`MonthBars.tsx`)

- Chart height **192 px**. `max` = the biggest value of **all series of that chart**.
- Bar height = `value ÷ max × 100 %`, at least **2 px**. A negative value is drawn as 0.
- A `0` bar is a flat line, faded (40 %).
- All values 0 → the text "Aucune donnée sur cette période".
- Label under each group: short month (`août`); the year is added (`août 26`) when the period covers 2 years.
- Hover (and screen readers): "août 2026 · Encaissé : 2 210,00 €".
- Many months on a phone → the chart scrolls sideways inside its card.

Example — revenue: `max` = 3 025 (Sept invoiced).

| Month | Invoiced bar | Collected bar |
|---|---|---|
| 2026-08 | 1 210 ÷ 3 025 = 40.0 % → 76.8 px | 2 210 ÷ 3 025 = 73.1 % → 140.3 px |
| 2026-09 | 100 % → 192 px | 1 000 ÷ 3 025 = 33.1 % → 63.5 px |
| 2026-10 | 0 → 2 px, faded | 0 → 2 px, faded |

### 4.2 Ranked bars (`RankedBars.tsx`)

Length = `value ÷ biggest value of the list`. With an inner part (top clients): inner = `part ÷ value`, capped at 100 %.

### 4.3 Number format (French)

| Kind | Example |
|---|---|
| Money | `1 234,50 €` (2 decimals) |
| Percent | `17,1 %` (1 decimal); "encaissé" on top clients: `61 %` (0 decimals) |
| Hours | `124,0 h`, `7,5 h` (always 1 decimal) |
| No value | `—` |

---

## 5. Check the page against the database

Replace `15` by the company id and the dates by the period on the page. Run in `psql` on the local DB.

```sql
-- revenue: invoiced per month
SELECT to_char(issue_date, 'YYYY-MM') AS month, SUM(amount_incl_vat) AS invoiced
FROM invoices
WHERE tenant_id = 15 AND issue_date BETWEEN '2025-11-01' AND '2026-10-17'
  AND status NOT IN ('draft', 'cancelled')
GROUP BY 1 ORDER BY 1;

-- revenue: collected per month
SELECT to_char(payment_date, 'YYYY-MM') AS month, SUM(amount) AS collected
FROM payments
WHERE tenant_id = 15 AND payment_date BETWEEN '2025-11-01' AND '2026-10-17'
GROUP BY 1 ORDER BY 1;

-- aging (today)
SELECT CASE WHEN NOT b.is_late THEN 'not_due'
            WHEN CURRENT_DATE - i.due_date <= 30 THEN 'late_1_30'
            WHEN CURRENT_DATE - i.due_date <= 60 THEN 'late_31_60'
            ELSE 'late_60_plus' END AS bucket,
       COUNT(*), SUM(b.balance_due)
FROM invoice_balance b JOIN invoices i ON i.id = b.invoice_id
WHERE b.tenant_id = 15 AND i.status IN ('sent', 'partially_paid') AND b.balance_due > 0
GROUP BY 1;

-- top clients
SELECT c.name, SUM(i.amount_incl_vat) AS invoiced, SUM(b.amount_paid) AS collected,
       ROUND(SUM(b.amount_paid) / NULLIF(SUM(i.amount_incl_vat), 0) * 100, 1) AS pct
FROM invoices i JOIN invoice_balance b ON b.invoice_id = i.id JOIN clients c ON c.id = i.client_id
WHERE i.tenant_id = 15 AND i.issue_date BETWEEN '2025-11-01' AND '2026-10-17'
  AND i.status NOT IN ('draft', 'cancelled')
GROUP BY c.id, c.name ORDER BY invoiced DESC, c.id LIMIT 5;

-- margins: rows + weighted average
SELECT p.name, m.budget_excl_vat, m.total_cost, m.margin_excl_vat, m.margin_pct
FROM project_margin_live m JOIN projects p ON p.id = m.project_id
WHERE m.tenant_id = 15 AND p.status IN ('prospect', 'in_progress') AND m.budget_excl_vat > 0
ORDER BY m.margin_pct DESC;

SELECT ROUND(SUM(m.margin_excl_vat) / SUM(m.budget_excl_vat) * 100, 1) AS average_pct
FROM project_margin_live m JOIN projects p ON p.id = m.project_id
WHERE m.tenant_id = 15 AND p.status IN ('prospect', 'in_progress') AND m.budget_excl_vat > 0;

-- quotes: sent in the period and their status now (Brussels days)
SELECT status, COUNT(*)
FROM quotes
WHERE tenant_id = 15
  AND (sent_at AT TIME ZONE 'Europe/Brussels')::date BETWEEN '2025-11-01' AND '2026-10-17'
GROUP BY status;

-- hours per month
SELECT to_char(work_date, 'YYYY-MM') AS month, SUM(hours)
FROM time_entries
WHERE tenant_id = 15 AND work_date BETWEEN '2025-11-01' AND '2026-10-17'
GROUP BY 1 ORDER BY 1;

-- purchases per month
SELECT to_char(issue_date, 'YYYY-MM') AS month, SUM(amount_incl_vat)
FROM purchase_invoices
WHERE tenant_id = 15 AND issue_date BETWEEN '2025-11-01' AND '2026-10-17'
GROUP BY 1 ORDER BY 1;
```

A month missing in these SQL results is a `0` on the page (§ 1.2).

The quotes SQL gives the 4 numbers on top: `accepted` = accepted, `refused` = refused, `sent` = waiting, all rows together = sent. Conversion = accepted ÷ all rows.

The unit tests in `src/company-analytics/handlers/get-company-analytics.handler.spec.ts` check the same rules (month filling, 24-month limit, conversion, timezone, weighted average, aging groups, blocks per permission).
