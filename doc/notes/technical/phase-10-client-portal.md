# Phase 10 — Client Portal

> Depends on Phase 03 (projects), Phase 05 (quote + invoices).

## Tables

- `portal_tokens` — one active token per project
- `portal_tracking` — one row per portal open or download

## Key relations

```
clients ──── portal_tokens ──── projects
```

## Key rules

### Token-based access (no password)
- URL format: `https://app.chantieros.com/portal/{token}`
- The raw token is **never stored**. Only `token_hash` (sha256). Lookup is by hash, so a DB leak gives nobody portal access
- 3 checks on every request:
  1. sha256 of the URL token matches a `token_hash` row
  2. `is_active = true`
  3. `expires_at` not passed

### Creation is manual
- Staff clicks "Generate link" on the project page
- **Never automatic on project creation** — that would open a client chat for every `prospect` the company never wins
- Generating a new link deactivates the old one

### Auto-expiry
- 90 days from generation in v1
- The value lives in the `expires_at` **column**, not a constant — so "configurable per tenant" later is a settings change, not a migration

### What the client sees

| Section | Visible? | Condition |
|---|---|---|
| Quote | Yes | Status `sent` or `accepted` |
| Invoices | Yes | Status `sent`, `partially_paid` or `paid` — a late one shows a red label |
| Progress % | Yes | From the newest `reports` row — `projects` has no progress column |
| Messages | Yes | Type = `project_client` chat |
| Subcontractor info | No | Never |
| Internal costs | No | Never |

### Revocation
- Admin sets `is_active = false` → token stops working instantly (next request check fails)
- No cache — every request hits DB

### portal_token fields

| Field | Notes |
|---|---|
| `id` | |
| `tenant_id` | |
| `client_id` | |
| `project_id` | |
| `token_hash` | sha256 of the token, unique — raw token never stored |
| `is_active` | Boolean |
| `expires_at` | Datetime |
| `created_by` | FK → `users.id` |
| `created_at` | |

## What to build

- Token generator (manual action on the project page — returns the raw token once, stores only the hash)
- Token validator middleware (runs on every `/portal/*` route)
- Portal read endpoints: quote, invoices, progress, messages
- **Accept / Refuse endpoints for a `sent` quote** — the client's only write action. Accept sets `accepted_at`, flips the project to `in_progress` and creates the stock reservations; Refuse sets `refused_at`. Both run the same service a staff member would hit
- Revoke endpoint (admin only)
- `portal_tracking` writer (one row per `view` / `download`)
- Tracking read for staff ("client opened 3 times, downloaded once")
- Auto-expiry cron (daily, marks expired tokens `is_active = false`)
- `project_client` chat auto-creation (triggered when portal token is generated)

## Dependencies

- Phase 03 (projects)
- Phase 05 (quotes + invoices)
- Phase 14 (site reports — the progress % comes from there)
- Phase 11 (chat — build it **before** this phase, the portal auto-creates the conversation)

## See also
- [[client-portal]]
- [[site-reports]]
- [[chat-conversations]]
