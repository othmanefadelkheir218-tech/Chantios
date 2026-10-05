# ChantierOS — Client Portal

> Status: v1 (working draft). See [[business-logic-overview]] for the full flow.

## What is the client portal?

A read-only page the company shares with their client. No login, no account — the **URL itself is the access key**.

The company generates the link manually from the project page. One active link per project at a time.

---

## How the link works

Staff clicks **"Generate link"** on the project page. Creation is **manual only** — never automatic on project creation, because that would open a client chat for every `prospect` the company never wins.

The backend generates a unique token → builds a URL:

```
https://app.chantieros.com/portal/{token}
```

When the client opens the URL → backend checks 3 things:

| Check | Condition |
|---|---|
| Token exists | Must be in `portal_tokens` |
| Active | `is_active = true` |
| Not expired | `expires_at > now` |

All 3 pass → portal page loads with the project's data.
Any check fails → client sees: **"This link has expired. Please contact your company."**

---

## What the client sees (read-only)

| Section | What exactly |
|---|---|
| Quote | Status `sent` or `accepted` — never `draft`, never `refused` |
| Project progress | `progress_pct` from the latest site report |
| Invoices | Only `sent`, `partially_paid`, `paid` — **not `draft`**, not `cancelled`. A late invoice shows a red label |
| Messages | Project chat (`project_client` type) — client can send and receive messages |

### The quote is the one thing the client can change

A `sent` quote shows two buttons: **Accept** and **Refuse**.

| Click | What happens |
|---|---|
| Accept | `status = 'accepted'`, `accepted_at = now`, project flips to `in_progress`, stock reservations are created |
| Refuse | `status = 'refused'`, `refused_at = now`, project stays `prospect` |

This is why the portal shows a `sent` quote at all: the client cannot decide on a paper they cannot open.

Staff can still accept a quote by hand for a client who answers by phone. Both paths write the same columns, so `accepted_at` is always real.

Everything else in the portal stays read-only.

**Never visible to client:**
- Margin / costs
- Subcontractor info
- Employee names or hours
- Stock data
- Internal notes

---

## The `portal_tokens` table

| Field | Meaning |
|---|---|
| `tenant_id` | Which company |
| `client_id` | Which client |
| `project_id` | Which project |
| `token_hash` | sha256 of the token — unique. The raw token is never stored |
| `is_active` | `true` = link works / `false` = revoked immediately |
| `expires_at` | Set to `now + 90 days` at creation |
| `created_by` | FK → `users.id` — who generated the link |

One active token per project. If a new link is generated → old one is deactivated automatically.

---

## Revocation

The company can revoke a link at any time before it expires → sets `is_active = false`.

Client opens the URL after revocation → sees the expired page immediately. No grace period.

Use case: link sent to wrong email, project cancelled, client relationship ended.

---

## Expiry

90 days in v1. The value lives in the `expires_at` **column**, not in a constant, so making it configurable per tenant later is a settings change — not a migration.

After 90 days → `expires_at < now` → link dies automatically, no manual action needed.

Company can generate a new link at any time — a fresh 90-day token is created, old one deactivated.

---

## Tracking (`portal_tracking`)

Every time the client opens the portal → one row written:

| Field | Meaning |
|---|---|
| `portal_token_id` | Which link was used |
| `event_type` | `view` / `download` |
| `created_at` | When |

The company can see: "client opened the portal 3 times, downloaded the invoice once." Useful to know if the client actually looked at the quote before calling.

---

## Client messaging

The client can send messages to the company directly from the portal — via the `project_client` conversation type.

- Client writes from the portal (no login needed — identified by their `portal_token`)
- Company staff receives it in their dashboard chat
- Company replies → client sees the reply next time they open the portal

---

## Related notes
- [[business-logic-overview]]
- [[client-invoices]]
- [[alerts]]
