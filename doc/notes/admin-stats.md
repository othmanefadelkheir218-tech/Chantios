# ChantierOS — Platform Admin Home Page (stats)

## What it is

The first page a platform admin sees (`/admin/dashboard`). It answers: **"how is the platform doing, and what needs action?"** Numbers and two charts on top, the product-event log ("Activité") below.

## One route — `GET /api/admin/stats`

One call returns every number, so the page loads in one request.

- Any admin staff (`AdminAuthGuard`), like `GET /api/admin/analytics`. No extra right.
- **Deleted companies (`tenants.deleted_at` set) are left out everywhere.**
- Every number comes from the module that owns it, through that module's service. The `admin-stats` module has **no repository and no table** of its own.

## Numbers

| Key | Owner | What |
|---|---|---|
| `tenants` | `tenants` | `total`, then the count per status (`active`, `suspended`, `banned`) |
| `subscriptions` | `subscriptions` | count per status (`trialing`, `active`, `past_due`, `cancelled`) |
| `support` | `support` | `open` = tickets not `closed`; `high_priority` = the `high` ones among them |
| `feedback` | `feedback` | `new` = feedback in status `new` |
| `growth` | `tenants` | new companies per calendar month, **last 12 months, the current one included**, oldest first. Months use **Brussels time**. A month with no signup is listed with `0` |
| `plan_split` | `subscriptions` + `plans` | companies per **plan name**, **`cancelled` left out**. Old versions of a plan have the same name and are added together. Biggest first |

Every status is always present (`0` when none).

## The page

- 4 cards: Entreprises, Abonnements, Support, Suggestions. Each one links to its list. A number that needs action (suspended companies, `past_due`, high-priority tickets) is red when above 0.
- Chart "Nouvelles entreprises": bars per month, value on hover.
- Chart "Répartition par formule": one bar per plan, with the count and the share.
- Below: the "Activité" section (`GET /api/admin/analytics`, filters + table), unchanged.
