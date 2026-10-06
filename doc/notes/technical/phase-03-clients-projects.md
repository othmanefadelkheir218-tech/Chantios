# Phase 03 — Clients & Projects

> Depends on Phase 02 (users must exist to create/manage clients and projects).

## Tables

- `clients` — one row per client (individual or company)
- `projects` — one row per construction project
- `project_status_history` — every status change logged

## Key relations

```
tenants ──── clients ──── projects
                    └──── project_status_history
users   ──────────────── project_status_history (who changed the status)
```

## Key rules

### Client
- `type` = `individual` / `professional` / `property_manager`
- `email` and `phone` are **required** — the whole client flow is email (quote sent, invoice sent, late reminder, portal link)
- `vat_number` required when `type = 'professional'`
- `is_active = false` → client is archived, not deleted
- One client can have multiple projects
- Full field list in [[entity-fields]]

### Project statuses (4 only)

| Status | Meaning |
|---|---|
| `prospect` | Created, not confirmed |
| `in_progress` | Quote accepted — work active |
| `completed` | Work finished |
| `cancelled` | Cancelled |

- Quote accepted → project auto-switches to `in_progress`
- Quote refused → project stays `prospect`
- Every status change → one row written to `project_status_history`

### The allowed transitions

```
prospect     → in_progress, cancelled
in_progress  → completed, cancelled
completed    → in_progress   (admin only — VOIDS the closure snapshot)
cancelled    → nothing       (final)
```

Anything else is refused by the service.

| Rule | Why |
|---|---|
| `cancelled` is final | A client who comes back gets a **new** project. Reopening would mix two different stories in one margin |
| `completed` can be reopened, by an admin only | Closing by mistake must be fixable. The reopen sets `voided_at` on the `project_closure_snapshots` row — it never **deletes** it, because a snapshot is a financial record. A fresh snapshot is written at the next close, and a partial unique index keeps only one live row per project |
| A quote can only be accepted on a `prospect` or `in_progress` project | Accepting on a closed project would change a budget that is already frozen in a snapshot |

### The closing guard — decided 2026-10-06

**`in_progress → completed` is never blocked by payment status.** Unpaid invoices or `to_pay` purchase bills do **not** prevent closing a project.

- `completed` means *work finished*, not *fully paid*. Clients commonly pay weeks after the job is done, and a supplier bill can arrive late — gating closure on money actually moving would leave a finished job stuck open waiting on accounting, which doesn't match how the business runs.
- **A cost (or invoice) that arrives after closure is still recorded against the project** — nothing locks writes to a `completed` project's ledger. It shows up in `project_margin_live` (a live view, so the *current* true margin always stays accurate), but it does **not** retroactively change the frozen `project_closure_snapshots` row written at the moment of closing — that row stays exactly as it was, a historical record.
- To correct the *official* closeout number after a late cost lands, reuse the mechanism already decided above: admin reopens (`completed → in_progress`), which voids the old snapshot, then re-closes — a fresh snapshot is written with the up-to-date numbers. No new mechanism needed.
- Trade-off accepted: `project_margin_live` and the frozen snapshot can disagree for a while after a late cost lands, until someone reopens/recloses. Preferred over blocking real operational work on accounting catching up.

### Project cancellation rule
When project moves to `cancelled`:
- Unused stock reservations released automatically
- Alert fires: "don't forget to invoice client for completed work"

### Budget — not a column
- `projects` has **no budget column**
- `budget_excl_vat = SUM(quotes.amount_excl_vat)` where `status = 'accepted'`, computed in `project_margin_live`
- Extra work = a **second** accepted quote, never an edit of the first → budget grows automatically
- Budget history needs no table: the accepted quotes with their `accepted_at` *are* the history

### Progress % — not a column either
- `projects` has **no progress column**
- The portal and dashboard read `progress_pct` from the newest `reports` row → see [[site-reports]]

## What to build

- `clients` CRUD
- `projects` CRUD
- Project status transition logic (the matrix above — every other move refused)
- DB checks: `end_date` not before `start_date`; a quote cannot be `accepted` with zero lines
- Auto-switch to `in_progress` when quote is accepted (event trigger)
- Cancellation handler (release reservations + fire alert)
- `project_status_history` writer

## Dependencies

- Phase 01 + 02
- Phase 05 (quote) triggers status change — wire up after quote module is built

## See also
- [[entity-fields]]
- [[business-logic-overview]]
- [[site-reports]]
- [[margin-profitability]]
