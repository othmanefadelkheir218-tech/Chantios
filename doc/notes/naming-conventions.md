# ChantierOS — Naming Conventions

> The language of the codebase is **English**. Every table, column, enum value, route, DTO field and variable is English. Read this file before writing `schema.prisma`.

## Rules

| Thing | Rule | Example |
|---|---|---|
| Table | `snake_case`, **plural** | `projects`, `time_entries`, `purchase_invoices` |
| Column | `snake_case`, **singular** | `hourly_rate`, `due_date` |
| Foreign key | `<singular_table>_id` | `project_id`, `subcontractor_contract_id` |
| Boolean | `is_` prefix | `is_active` |
| Timestamp | `_at` suffix | `created_at`, `last_reminder_at` |
| Date only | `_date` suffix | `work_date`, `issue_date` |
| Enum value | `snake_case`, lowercase | `in_progress`, `partially_paid` |
| View | `<subject>_live` or `<subject>_balance` | `project_margin_live`, `invoice_balance` |
| Money | `_excl_vat` / `_incl_vat` suffix — never `_ht` / `_ttc` | `total_excl_vat`, `amount_incl_vat` |

No abbreviations in column names: `quantity` not `qty`, `description` not `desc`.

---

## Tables

### Platform
`tenants` · `admin_users` · `plans` · `plan_features` · `tenant_subscriptions` · `billing_usage_snapshots` · `stripe_events` · `audit_logs` · `analytics_events` · `feedback` · `support_tickets`

### Auth & users
`roles` · `users` · `role_permissions` · `refresh_tokens` · `user_invitations` · `one_time_codes`

### Clients & projects
`clients` · `projects` · `project_status_history`

### Catalogue & stock
`categories` · `services` · `materials` · `service_materials` · `stock_movements` · `stock_reservations`

### Planning, time & site
`tasks` · `task_assignees` · `time_entries` · `reports`

### Client money
`quotes` · `quote_lines` · `invoices` · `invoice_lines` · `payments` · `document_counters`

### Purchases
`subcontractors` · `subcontractor_contracts` · `suppliers` · `purchase_invoices`

### Margin
`cost_types` · `project_closure_snapshots` · `project_closure_snapshot_costs` · `project_margin_alerts`

### Shared
`media` · `notifications` · `portal_tokens` · `portal_tracking` · `conversations` · `conversation_members` · `messages` · `message_reads`

### Not in v1
`hitl_queue` · `connectors` · `token_recharges` — the AI layer is v2. These tables are not created in the first migration.

### Views
`project_margin_live` · `invoice_balance` · `material_stock_live`

---

## Enums — every value in one place

| Enum | Table | Values |
|---|---|---|
| Tenant status | `tenants.status` | `active` · `suspended` · `banned` |
| Permission scope | `role_permissions.scope` | `all` · `own` |
| Role name | `roles.name` | `admin` · `manager` · `site_supervisor` · `team_leader` · `worker` · `sales` · `accountant` |
| Client type | `clients.type` | `individual` · `professional` · `property_manager` |
| Project status | `projects.status` | `prospect` · `in_progress` · `completed` · `cancelled` |
| Quote status | `quotes.status` | `draft` · `sent` · `accepted` · `refused` |
| Invoice status | `invoices.status` | `draft` · `sent` · `partially_paid` · `paid` · `cancelled` |
| Payment method | `payments.method` | `transfer` · `cheque` · `cash` · `stripe` |
| Purchase invoice status | `purchase_invoices.status` | `to_pay` · `paid` |
| Contract status | `subcontractor_contracts.status` | `in_progress` · `completed` · `cancelled` |
| Stock movement type | `stock_movements.type` | `purchase` · `consumption` · `adjustment` |
| Reservation status | `stock_reservations.status` | `active` · `released` · `consumed` |
| Task type | `tasks.type` | `meeting` · `work` |
| Task status | `tasks.status` | `planned` · `in_progress` · `completed` |
| Cost type | `cost_types.name` | `material` · `subcontractor` · `labor` — a tenant may add its own rows |
| Conversation type | `conversations.type` | `internal` · `project_client` · `support` |
| Message sender | `messages.sender_type` | `employee` · `client` · `admin` |
| Portal event | `portal_tracking.event_type` | `view` · `download` |
| Purchase invoice kind | `purchase_invoices.type` | `subcontractor` · `supplier` |
| Document kind | `document_counters.document_type` | `quote` · `invoice` · `purchase_invoice` |
| One-time code kind | `one_time_codes.type` | `password_reset` · `email_verification` · `admin_2fa` |
| Margin alert level | `project_margin_alerts.level` | `warning` · `critical` |
| Permission module | `role_permissions.module` | `clients` · `projects` · `tasks` · `time_entries` · `catalogue` · `stock` · `quotes` · `invoices` · `purchase_invoices` · `margins` · `subcontractors` · `reports` · `media` · `chat` · `team` · `settings` |
| Media entity | `media.entity_type` | `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message` |
| Subscription status | `tenant_subscriptions.status` | `trialing` · `active` · `past_due` · `cancelled` |

`in_progress`, `completed` and `cancelled` mean the same thing everywhere they appear — they are not reused with a different meaning per table.

An invoice has no `overdue` status. Late is calculated, not stored: `due_date < today AND balance_due > 0`. See [[client-invoices]].

---

## Money column names

| Meaning | Column |
|---|---|
| Unit price, no VAT | `unit_price_excl_vat` |
| Line total, no VAT | `total_excl_vat` |
| Document total, no VAT | `amount_excl_vat` |
| Document total, with VAT | `amount_incl_vat` |
| VAT rate on a line (e.g. 21) | `vat_rate` |
| VAT rate pre-fill for new lines | `default_vat_rate` |
| Project budget | `budget_excl_vat` |
| Margin in € | `margin_excl_vat` |
| Margin in % | `margin_pct` |
| Employee rate per hour | `hourly_rate` |
| Material purchase price | `purchase_price` |
| Frozen price on a stock movement | `unit_price` |
| Amount already paid | `amount_paid` |
| VAT amount on a document | `vat_amount` |
| Amount still owed | `balance_due` |

---

## Numeric types

Fixed once, used everywhere. Money is never a JavaScript `number` — always `Prisma.Decimal`.

| Thing | Type |
|---|---|
| Any money column | `Decimal(12, 2)` |
| `vat_rate`, `default_vat_rate` | `Decimal(5, 2)` |
| `quantity` — document lines, stock movements, reservations | `Decimal(12, 3)` |
| `quantity_per_unit` — the recipe | `Decimal(12, 4)` |
| `hours` | `Decimal(5, 2)` |
| `progress_pct` | `Int`, 0–100 |
| `margin_pct` | `Decimal(5, 2)`, computed |
| `file_size` | `BigInt` (bytes) |

### Rounding

- A line total is rounded to 2 decimals: `round(quantity × unit_price_excl_vat, 2)`.
- **VAT lives on the line**, because one Belgian document mixes 6% labor and 21% supplies. See [[entity-fields]] § VAT.
- VAT is rounded **once per rate group**, never per line then summed. Two roundings give two different answers.

---

## Tokens and secrets — column names

Nothing is stored in plain text. A stored token column is always `token_hash` or `code_hash` (sha256), never `token`.

| Table | Column |
|---|---|
| `refresh_tokens` | `token_hash` |
| `user_invitations` | `token_hash` |
| `one_time_codes` | `code_hash` |
| `portal_tokens` | `token_hash` |
| `users` | `password_hash` (argon2id) |
| `users` | `mobile_pin_hash` (argon2id) |

---

## Related notes
- [[business-logic-overview]]
- [[entity-fields]]
- [[auth-tokens]]
- [[A_progress-tracker]]
