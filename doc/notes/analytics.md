# ChantierOS — Tenant Analytics

## What it is

A page for the company's **boss and accountant**. It answers one question: **"how is my company doing over time?"** Trends by month, comparisons, charts.

It is **not** the dashboard. The dashboard ([dashboard.md](dashboard.md)) says "what needs my attention today" with counts and links. Analytics shows **numbers over a period**.

It has nothing to do with the `analytics_events` table and the `src/analytics/` module (product usage events for the platform). The code lives in `src/company-analytics/`.

## Who can open it — the `analytics` permission

A new `module` key: **`analytics`** (see [roles-permissions.md](roles-permissions.md)).

| Role | Default |
|---|---|
| `admin` | view |
| `accountant` | view |
| every other role | — |

- Only **view** means something: the page is read-only, there is nothing to create, edit or delete.
- The tenant admin can give it to another role with a normal `role_permissions` override.
- **Every plan** has it. No plan limit.

## Each block follows the user's own permissions

Having `analytics` opens the page. **Each block also needs the view right on the module its numbers come from.** A block the user cannot see is **left out** of the answer (not `null`, not zero) — the same rule as the dashboard.

| Block | Needs view on |
|---|---|
| `revenue` | `invoices` |
| `aging` | `invoices` |
| `top_clients` | `invoices` |
| `margins` | `margins` |
| `quotes` | `quotes` |
| `hours` | `time_entries` (scope `own` → the user's own hours only) |
| `purchases` | `purchase_invoices` |

Example: by default the accountant has no `time_entries` right, so the `hours` block is not in their answer.

## The period

- One filter for the whole page: `from` and `to` (dates, `YYYY-MM-DD`).
- **Default: the last 12 months** — the 1st of the month 11 months ago → today.
- `from` must not be after `to`. The period is **24 months at most**.
- "Today" and the months use the tenant's `timezone`.
- **Every month of the period is in the answer, an empty month is `0`.** A chart never skips a month.
- The page offers: this month, this quarter, this year, last 12 months, custom.

Three blocks are a picture of **now**, not of the period: `aging`, the open amount to collect, and `margins`. The page says so under them.

## Money

- Invoiced, collected, open, top clients and purchases are **incl. VAT** — what really comes in and goes out of the bank, so invoiced and collected can be compared.
- Margins are **excl. VAT**, exactly as on `/margins` ([margin-profitability.md](margin-profitability.md)).
- Money is a string, as everywhere in the API.

## The blocks

| Key | What it shows | Rule |
|---|---|---|
| `revenue` | total invoiced, total collected, and both **per month** | Invoiced = invoices **issued** in the period (`issue_date`), not `draft`, not `cancelled`. Collected = `payments` dated in the period (`payment_date`), correction rows included |
| `aging` | unpaid invoices in 4 groups: **not yet due**, **1–30**, **31–60**, **60+ days late** — count + balance each, and the total open | Unpaid and late = the same rules as the dashboard (`invoice_balance`: `sent` / `partially_paid` with a balance left; late = the view's `is_late`). Days late = today − `due_date`. The total is the "open amount to collect" card |
| `top_clients` | the **5 clients** with the most invoiced in the period, with collected and % collected | Same invoices as `revenue`. Collected = paid on those invoices |
| `margins` | average margin, the **5 best** and **5 worst** projects (budget, cost, margin, %) | Open projects (`prospect`, `in_progress`) with an accepted quote, read from `project_margin_live`. Average = Σ margin ÷ Σ budget (a big project weighs more). A project is in "best" or "worst", never both |
| `quotes` | sent, accepted, refused per month; **conversion rate** | Per month: sent by `sent_at`, accepted by `accepted_at`, refused by `refused_at`. Conversion = quotes **sent in the period** that are now `accepted` ÷ quotes sent in the period |
| `hours` | hours **per month** and the **5 projects** with the most hours | `time_entries.work_date` in the period |
| `purchases` | supplier and subcontractor bills **per month** | `purchase_invoices.issue_date` in the period |

The page shows 4 cards on top, built from these blocks: **collected** (`revenue`), **average margin** (`margins`), **quote conversion** (`quotes`), **open to collect** (`aging`). A card whose block is missing is not shown.

## One route — `GET /api/analytics/overview?from=&to=`

- One call returns every block the user may see.
- Behind the normal tenant guards + `@Module('analytics')`.
- The `company-analytics` module has **no repository and no table**. Every number comes from the module that owns it, through that module's service. "Unpaid", "late" and the live margin already exist — they are reused, never written again.
- No cache in v1.

## Related notes

- [dashboard.md](dashboard.md)
- [roles-permissions.md](roles-permissions.md)
- [client-invoices.md](client-invoices.md)
- [margin-profitability.md](margin-profitability.md)
- [purchase-invoices.md](purchase-invoices.md)
- [planning-time-entries.md](planning-time-entries.md)
