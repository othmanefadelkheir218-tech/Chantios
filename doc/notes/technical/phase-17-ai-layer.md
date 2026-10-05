# Phase 17 — AI Layer

> **Not in v1.** The AI layer is v2. None of its tables — `hitl_queue`, `connectors`, `token_recharges` — are created in the first migration.
>
> This file is the design to build from when v2 starts. Nothing here blocks v1.

## Tables

- `hitl_queue` — human-in-the-loop: actions the AI proposes but a human must approve
- `connectors` — per-tenant external integrations (email, Stripe, …)

## Key relations

```
tenants ──── connectors
        └─── hitl_queue ──── users (who approved or rejected)
```

## 1. `hitl_queue` — nothing acts alone

The rule: **the AI proposes, a human approves.** No AI action reaches a client, an invoice or money without a person pressing approve.

| Field | Notes |
|---|---|
| `tenant_id` | Which company |
| `action_type` | e.g. `send_quote_email`, `create_invoice`, `reply_to_client` |
| `payload` | JSON — the exact action to perform if approved |
| `reason` | Why the AI proposed it |
| `confidence` | 0–1, from the model |
| `status` | `pending` / `approved` / `rejected` / `expired` |
| `reviewed_by` | FK → `users.id` — nullable |
| `reviewed_at` | Nullable |
| `expires_at` | Pending items expire — a stale proposal must not fire later |
| `result` | JSON — what happened after execution |

### Rules
- A `pending` row does nothing. Execution happens **only** on approve
- Approving runs the action through the **same service and the same guards** a human would hit. The AI never gets a privileged path to the database
- Rejecting keeps the row — it is the training signal and the audit trail
- Every approve and reject writes an `audit_logs` row
- Expired rows are never executed

### Who can approve

| `action_type` touches | Minimum role |
|---|---|
| Client-facing email or message | `manager` |
| Money (quote, invoice, purchase) | `admin` |
| Internal notes, tags, summaries | `manager` |

## 2. `connectors` — external integrations per tenant

| Field | Notes |
|---|---|
| `tenant_id` | Which company |
| `type` | `email` / `stripe` / … |
| `credentials` | **Encrypted at rest** — never logged, never returned by any API |
| `status` | `active` / `error` / `disconnected` |
| `last_sync_at` | — |
| `last_error` | Nullable |

### Rules
- Credentials are encrypted with a key from env, not stored in plain text
- A connector read never returns the credentials, only `status` and `last_sync_at`
- A failing connector sets `status = 'error'` and alerts the tenant admin — it never retries forever
- v1 scope is **email only**. Telegram and WhatsApp are v2

## 3. Token usage

AI consumption is metered against the tenant's token balance:

```
remaining = SUM(token_recharges.token_amount) − SUM(usage)
```

A ledger, like every other count in the app. At zero, AI features stop; the rest of the app is unaffected. AI is deliberately outside the 7 plan dimensions — see [[subscription-plans]].

## What to build

- `hitl_queue` CRUD + approve / reject endpoints
- Executor that runs an approved payload through the normal service layer and guards
- Expiry cron for pending items
- `connectors` CRUD with encrypted credential storage
- Connector health check + error alert
- Token metering + "out of tokens" state
- Audit log on every approve, reject and connector change

## Dependencies

- All earlier phases (the AI acts on their data through their services)
- Phase 16 (`token_recharges` for the balance)
- Phase 12 (alerts)

## See also
- [[subscription-plans]]
- [[alerts]]
