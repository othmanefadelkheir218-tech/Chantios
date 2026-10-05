# Tests — Audit logs, Analytics, Feedback

> Routes: `/api/admin/audit-logs`, `/api/admin/analytics`, `/api/admin/feedback`.
> Read [00-how-to-test.md](00-how-to-test.md) first. Run [01](01-tenants.md) to [04](04-subscriptions.md) before this file: they create the audit entries you read here.

| Method | Path | What |
|---|---|---|
| `GET` | `/api/admin/audit-logs` | Every sensitive platform action |
| `GET` | `/api/admin/analytics` | Product events |
| `GET` | `/api/admin/feedback` | Tenant feedback |
| `PATCH` | `/api/admin/feedback/:id/status` | Change a feedback status |

---

# Audit logs

An entry is written when something sensitive changes. It records **who** (empty until login exists), **what**, **which record**, the **old and new value**, and the caller's **IP**.

## AUD-01 — Creating a tenant writes one entry

1. Create `TEST Audit` (TEN-01 body, new email). Copy its `id`: `TENANT_AUDIT`.
2. `GET /api/admin/audit-logs?tenant_id=TENANT_AUDIT`

**Expected**
- `total` is **1**.
- The entry: `action` `create`, `entity_type` `tenant`, `entity_id` = `TENANT_AUDIT`, `old_value` `null`, `new_value` = the tenant.
- `admin_user_id` is `null` (no login yet). `ip_address` is your IP (like `::1` or `127.0.0.1`).
- **Keys inside `new_value` are `snake_case`** and `postal_code` is **not** hidden if you set it.

## AUD-02 — An update records old and new

`PATCH /api/admin/tenants/TENANT_AUDIT` with `{ "city": "Ghent" }`, then `{ "city": "Liège" }`.

`GET /api/admin/audit-logs?tenant_id=TENANT_AUDIT&action=update`

**Expected** 2 entries (newest first). The newest has `old_value.city` `Ghent` and `new_value.city` `Liège`. The other has `old_value.city` `null` and `new_value.city` `Ghent`.

## AUD-03 — A status change records the reason

`PATCH /api/admin/tenants/TENANT_AUDIT/status` with `{ "status": "suspended", "reason": "TEST reason" }`.

`GET /api/admin/audit-logs?tenant_id=TENANT_AUDIT&action=set_status`

**Expected** one entry: `old_value` = `{ "status": "active" }`, `new_value` = `{ "status": "suspended", "reason": "TEST reason" }`.

A refused change (same status again → `400`) writes **nothing** new.

## AUD-04 — Plans, admin users and plan changes are logged

After doing PLN and ADM and SUB scenarios:

| Request | Expected entries |
|---|---|
| `?entity_type=plan` | `create`, `deactivate`, `set_default`, `create_version` — `entity_id` is the plan id |
| `?entity_type=admin_user` | `create`, `update`, `deactivate` |
| `?entity_type=subscription` | `set_pending_plan` — `entity_id` and `tenant_id` are the tenant |

- `new_value` holds what you sent (for example `{ "plan_id": "..." }`).
- **A refused call writes no entry.** (Check: SUB-05 refusals added none.)

## AUD-05 — Secrets are hidden

`GET /api/admin/audit-logs?entity_type=admin_user&action=create`

**Expected** `new_value.password` is `[redacted]`. The password you typed is nowhere in the response. Same for `GET ...?action=update` after a password change.

## AUD-06 — Filters and paging

| Request | Expected |
|---|---|
| `?entity_type=tenant` | Only tenant entries |
| `?action=create` | Only creations |
| `?tenant_id=TENANT_AUDIT&entity_type=tenant&action=update` | Only the 2 updates |
| `?tenant_id=abc` | `400` |
| `?limit=2&page=2` | 2 rows, `page` 2, newest first |
| `?entity_type=nothing` | `data: []` |

Entries are **read-only**: there is no route to edit or delete one.

---

# Analytics

Product events (for example `quote_sent`). In this step no route creates an event: other modules will post them. The queue is tested in AN-03.

## AN-01 — Empty list

`GET /api/admin/analytics`

**Expected** `200`, `{ data: [], total: 0, page: 1, limit: 20, ... }` on a fresh database.

## AN-02 — Events by SQL, then filters

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into analytics_events (tenant_id, user_id, event_name, payload) select tenant_id, id, 'quote_sent', jsonb_build_object('test', 'true', 'quote', 'QUO-1') from users where email = 'admin@dupont.test';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into analytics_events (tenant_id, user_id, event_name, payload) select tenant_id, id, 'invoice_sent', jsonb_build_object('test', 'true') from users where email = 'admin@verhelst.test';"
```

| Request | Expected |
|---|---|
| `GET /api/admin/analytics` | 2 events, newest first, with `event_name`, `payload`, `tenant_id`, `user_id` |
| `?event_name=quote_sent` | Only the first |
| `?tenant_id=TENANT_DUPONT` | Only Dupont's |
| `?from=2020-01-01T00:00:00Z&to=2030-01-01T00:00:00Z` | Both |
| `?from=2030-01-01T00:00:00Z` | Empty |
| `?from=yesterday` | `400` |
| `?tenant_id=abc` | `400` |

## AN-03 — The queue works (optional, needs Node)

This proves an event put on the queue ends in the table, without slowing a request. In a terminal in the project folder:

```powershell
node -e "const {Queue}=require('bullmq');(async()=>{const q=new Queue('analytics',{connection:{host:'127.0.0.1',port:6390}});await q.add('track',{tenantId:'TENANT_DUPONT',eventName:'queue_test',payload:{test:'true'}});await q.close();console.log('queued')})()"
```

Replace `TENANT_DUPONT` with the real id first.

**Expected** after about 1 second, `GET /api/admin/analytics?event_name=queue_test` returns the event. The API terminal shows no error.

---

# Feedback

Tenants will write feedback in step 02 (they need a login). Here the platform staff **read** it and change its status.

## FB-01 — Add feedback by SQL

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into feedback (tenant_id, submitted_by, type, title, body) select tenant_id, id, 'feature_request', 'TEST Export to Excel', 'Please add an Excel export for invoices' from users where email = 'admin@dupont.test';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "insert into feedback (tenant_id, submitted_by, type, title) select tenant_id, id, 'complaint', 'TEST Slow dashboard' from users where email = 'admin@verhelst.test';"
```

`GET /api/admin/feedback`

**Expected** 2 items, newest first. Each has `type`, `title`, `body` (or `null`), `status` `new`, `tenant_id`, `submitted_by`. Copy one `id`: `FEEDBACK_A`.

## FB-02 — Filters

| Request | Expected |
|---|---|
| `?status=new` | Both |
| `?status=shipped` | Empty |
| `?type=complaint` | Only `TEST Slow dashboard` |
| `?type=feature_request&tenant_id=TENANT_DUPONT` | Only `TEST Export to Excel` |
| `?type=rant` | `400` |
| `?status=done` | `400` |

Statuses: `new`, `reviewing`, `planned`, `declined`, `shipped`. Types: `feature_request`, `improvement`, `complaint`.

## FB-03 — Change the status

`PATCH /api/admin/feedback/FEEDBACK_A/status`

```json
{ "status": "planned" }
```

**Expected**
- `200`, `status` is `planned`, `updated_at` is newer.
- `GET /api/admin/feedback?status=planned` lists it. `?status=new` lists only the other.
- Any status can follow any status (no order rule). Try `shipped`, then `new`.

| Request | Expected |
|---|---|
| `{ "status": "bogus" }` | `400` |
| `{}` | `400` |
| unknown id | `404`, `Feedback not found` |
| id `abc` | `400` |
| `{ "status": "planned", "title": "x" }` | `400` — only the status can change |

## FB-04 — Clean up

Use § 5 of [00-how-to-test.md](00-how-to-test.md). It deletes the `TEST` feedback and the test analytics events.

---

## Known limits (not bugs)

- No route creates analytics events or feedback in this step.
- Feedback status changes are **not** written to the audit log.
- `retention_days` clean-up of old analytics events is not built.
