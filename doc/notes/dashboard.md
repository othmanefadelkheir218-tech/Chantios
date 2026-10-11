# ChantierOS — Tenant Dashboard

## What it is

The first page a company user sees after login. It answers one question: **"what needs my attention today?"** Numbers only, each one a link to the page that lists the rows.

## One route — `GET /api/dashboard`

One call returns every widget, so the page loads in one request instead of eight.

- Behind the normal tenant guards. No extra permission of its own.
- **Each widget is included only if the user can view its module** (resolved permissions, same as `PermissionGuard`). A widget the user cannot see is **left out** of the response — not `null`, not zero.
- **`scope = own` is respected**: a user with `own` scope on a module gets numbers for their own rows only. Today only `tasks` (assigned to me) and `time_entries` (my hours) have "own" rows; the other modules have no per-user filter on their own list either, so their widget follows that list.
- No date filter in v1. "Today" and "this week" use the tenant's `timezone`.
- Every number comes from the module that owns it, through that module's service. **No business rule is written twice**: "overdue invoice", "low stock", "due soon" and the margin alert levels already exist — reuse them.
- The dashboard module has **no repository and no table** of its own.

## Widgets (v1)

| Key | Module | Numbers |
|---|---|---|
| `projects` | `projects` | count per status for open projects (not `completed`, not `cancelled`) |
| `tasks` | `tasks` | open tasks due today, overdue open tasks |
| `hours` | `time_entries` | hours logged this week (Monday → today) |
| `quotes` | `quotes` | `sent` quotes waiting for the client: count + total incl. VAT |
| `invoices` | `invoices` | unpaid: count + balance due; overdue: count + balance due |
| `purchase_invoices` | `purchase_invoices` | bills due soon (same window as `/purchase-invoices/due-soon`): count + amount |
| `stock` | `stock` | materials under their low-stock level (same rule as `/materials/low-stock`) |
| `margins` | `margins` | open projects at each margin alert level |

Unread notifications and unread chat are **not** in this response — they already have their own routes and live socket updates.

## Related notes

- [roles-permissions.md](roles-permissions.md)
- [margin-profitability.md](margin-profitability.md)
- [purchase-invoices.md](purchase-invoices.md)
