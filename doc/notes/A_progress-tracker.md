# ChantierOS — Understanding Progress Tracker

> Status: v1 (working draft). Checklist of business-logic topics discussed so far, and what's left. Update this file as we go — check a box when a topic is done.

## ✅ Done

- [x] **Overall business flow** — client → project → quote → planning → execution (stock + subcontractor + labor) → margin → invoices → client portal. See \[\[business-logic-overview\]\].

- [x] **Project status** (`projects.status`) — meaning of each value + open question on quote→project auto-link. See \[\[qa-project-quote-stock-invoices\]\].

- [x] **Quote vs. Invoice** — confirmed as two different documents. See \[\[qa-project-quote-stock-invoices\]\].

- [x] **Quote status** (`quotes.status`) — meaning of each value. See \[\[qa-project-quote-stock-invoices\]\].

- [x] **Stock logic** — `materials`, `stock_movements` (ledger), `service_materials` (recipe), no reservation system today. See \[\[qa-project-quote-stock-invoices\]\] and \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Invoices, both types** — `invoice` (client, money in) vs `purchase_invoice` (purchase, money out), statuses, why `project_id` is required. See \[\[qa-project-quote-stock-invoices\]\].

- [x] **Catalogue tables + cost math** — `services`, `categories` (its own table, no free text), worked numeric example, and where cost calculations actually get stored (live vs. the one-time frozen snapshot). See \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Subcontracting details** — subcontractor directory (`subcontractors`, reusable) + contract per project (`subcontractor_contracts`, statuses `in_progress`/`completed`/`cancelled`) + confirmed the contract and subcontractor identity are never shown to the client invoice. See \[\[subcontracting\]\].

- [x] **Planning & Time Entries** — how tasks, assigned employees, and daily hour logs connect (`tasks`, `time_entries`); confirmed one employee can work multiple projects; flagged the same-day total-hours gap + fix; agreed alert list. See \[\[planning-time-entries\]\].

- [x] **Naming conventions** — English everywhere; full table, column and enum list. See \[\[naming-conventions\]\].

- [x] **Roles & permissions** — the 7 roles, the `module` enum, and how `role_permissions` overrides work. See \[\[roles-permissions\]\].

- [x] **Client portal mechanics** — token, 90-day expiry, revocation, tracking. See \[\[client-portal\]\].

- [x] **Chat/conversations** — the 3 chat types and the tenant isolation rule. See \[\[chat-conversations\]\].

- [x] **Subscriptions & billing** — versioned plans, usage-based overage, storage downgrade gate. See \[\[subscription-plans\]\].

- [x] **Multi-tenancy enforcement** — Prisma client extension, not RLS. See \[\[technical/build-order\]\] § 1b.

- [x] **Stock quantity** — one source of truth: the `stock_movements` ledger plus the `material_stock_live` view. See \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Site reports** — the `reports` table, progress %, photos, and the material-usage action. See \[\[site-reports\]\].

- [x] **Stock consumption trigger** — declared from the site report by a supervisor, recipe pre-fills, never automatic. See \[\[site-reports\]\].

- [x] **Reservation quantities** — accepted quote lines walked through the recipe; free-text lines reserve nothing. See \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Purchase invoices** — one table for subcontractor and supplier bills, nullable contract and project, plus a `suppliers` directory. See \[\[purchase-invoices\]\].

- [x] **Document numbering** — `INV-2026-0001`, `document_counters` with a row lock. See \[\[document-numbering\]\].

- [x] **Auth token tables** — 3 tables, argon2id, everything hashed. See \[\[auth-tokens\]\].

- [x] **Budget & budget history** — budget is `SUM` of accepted quotes; the accepted quotes *are* the history, no extra table. See \[\[margin-profitability\]\].

- [x] **Daily hours limit** — reject over 24h, alert over 12h, across all projects. See \[\[planning-time-entries\]\].

- [x] **Portal mechanics** — hashed token, manual creation, 90 days in a column. See \[\[client-portal\]\].

- [x] **Chat read tracking & attachments** — `message_reads` table, files only through `media`. See \[\[chat-conversations\]\].

- [x] **Margin alert dedup** — `project_margin_alerts`, one row per project per level. See \[\[margin-profitability\]\].

- [x] **Core entity fields** — `tenants`, `clients`, `projects`, `quotes` field lists and DB checks. See \[\[entity-fields\]\].

- [x] **Platform & AI phases** — support tickets, feedback, analytics, token recharges, HITL, connectors, PDF generation. See phases 15–17 in \[\[technical/build-order\]\].

- [x] **Login identity** — `users.email` is `UNIQUE` across the whole app. One email belongs to one company, because login has no company field. See \[\[auth-tokens\]\].

- [x] **Mobile login** — email + PIN, PIN hashed with argon2id, lock after 5 wrong tries. See \[\[technical/phase-02-auth-users\]\].

- [x] **Document totals** — `amount_excl_vat`, `vat_amount`, `amount_incl_vat` are **stored** on `quotes` and `invoices`; recalculated while `draft`, frozen on `sent`. See \[\[entity-fields\]\].

- [x] **Numeric types** — money `Decimal(12,2)`, quantity `Decimal(12,3)`, hours `Decimal(5,2)`; VAT rounded once on the document total. See \[\[naming-conventions\]\].

- [x] **Material counted once** — material cost comes only from `stock_movements` consumption. A bill with `cost_type = material` has no `project_id`. See \[\[purchase-invoices\]\].

- [x] **Cost types** — 3 seeded rows (`material`, `subcontractor`, `labor`) with nullable `tenant_id`; a tenant admin adds its own. `purchase_invoices.cost_type_id` is what the margin groups by. See \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Categories** — nullable `tenant_id`; `NULL` = shared default, which is what makes a deploy-time seed possible. See \[\[technical/phase-04-catalogue-stock\]\].

- [x] **No `overdue` status** — invoice status is `draft`/`sent`/`partially_paid`/`paid`/`cancelled`. Late is calculated from `due_date` + `balance_due`. See \[\[client-invoices\]\].

- [x] **Project status transitions** — the full matrix; `cancelled` is final, `completed` reopens by admin only. See \[\[technical/phase-03-clients-projects\]\].

- [x] **Plan dimensions** — 6 keys with a counting rule each; projects unlimited; retention never deletes business data. See \[\[subscription-plans\]\].

- [x] **Quote review** — a `sent` quote appears in the portal with Accept / Refuse buttons. See \[\[client-portal\]\].

- [x] **Task assignees** — `task_assignees`, one row per employee. One task, many workers, one Gantt bar. See \[\[planning-time-entries\]\].

- [x] **AI layer out of v1** — `hitl_queue`, `connectors` and `token_recharges` are v2. See \[\[technical/phase-17-ai-layer\]\].

- [x] **Per-line VAT** — `vat_rate` lives on `quote_lines` and `invoice_lines`, because one Belgian document mixes 6% labor and 21% supplies. `tenants.default_vat_rate` and `services.default_vat_rate` are pre-fills. VAT rounds once per rate group. See \[\[entity-fields\]\] § VAT.

- [x] **`role_permissions.scope`** — a 5th column (`all` / `own`), because the default matrix has three levels and `own` cannot be said with 4 booleans. See \[\[roles-permissions\]\].

- [x] **Platform-admin notifications** — `notifications` carries nullable `user_id` **and** `admin_user_id`, `tenant_id` nullable, exactly one recipient set. Same pattern as `refresh_tokens`. See \[\[technical/phase-12-alerts\]\].

- [x] **New tenant with no plan** — registration creates the `tenant_subscriptions` row in the same transaction: `is_default` plan, `status = 'trialing'`, 14 days. Guard allows `trialing`/`active`/`past_due`. See \[\[subscription-plans\]\].

- [x] **`stock_movements` + `stock_reservations` field lists** — one home, in \[\[catalogue-stock-tables-and-cost-storage\]\]. `project_id` nullable, `report_id` for traceability, `unit_price` frozen, reservations keep both `reserved_quantity` and `remaining_quantity`.

- [x] **Unpaid bills count in the margin** — a `purchase_invoices` row counts from the moment it is entered, whatever its `status`. See \[\[margin-profitability\]\].

- [x] **Closure snapshot is voided, never deleted** — reopening a `completed` project sets `voided_at`. See \[\[technical/phase-08-margin-snapshot\]\].

- [x] **`clients.email`** — `UNIQUE (tenant_id, email)`, per company, not app-wide. See \[\[entity-fields\]\].

- [x] **Sent-document PDFs are protected** — `media.is_locked = true`, delete refuses it. See \[\[media-files\]\].

- [x] **Portal routes and the tenant extension** — the `portal_tokens` row supplies `tenant_id` into `nestjs-cls` before any query. See \[\[technical/build-order\]\] § 1b.

- [x] **Currency** — v1 is EUR-only. `tenants.currency` exists but money columns carry no currency.

- [x] **`tenant_id` on every business table** — child tables included (`quote_lines`, `invoice_lines`, `task_assignees`, `message_reads`…), so the Prisma extension protects them automatically. `quote_lines`, `invoice_lines` and `task_assignees` also carry a **composite FK** `(tenant_id, parent_id)`, so a cross-tenant line cannot be inserted at all. Only the 8 platform tables are skipped. See \[\[technical/build-order\]\] § 1b.

- [x] **`invoices.due_date` is `NOT NULL`** — late is calculated from it, so an invoice with no due date could never be chased. Pre-filled from the new `tenants.default_payment_days` (30). See \[\[client-invoices\]\].

- [x] **`clients.email` is `UNIQUE (tenant_id, email)`** — one card per person, so a client's whole project history stays on one row. See \[\[entity-fields\]\].

- [x] **10 MB file limit** — confirmed, stays as a DB check on `media.file_size`.

- [x] **Prisma migration + seed built** — `prisma/schema.prisma` (52 tables), one `init` migration with the hand-written block (34 CHECKs, 3 triggers, 5 partial unique indexes, 3 composite FKs, 3 views), `prisma/seed.ts`. Every `id` is a `SERIAL` (auto-increment integer, changed from UUID on 2026-10-05) and every `updated_at` defaults to `now()`, so raw SQL inserts work. Line totals are set by a trigger. See `prisma/migrations/`.

- [x] **First super-admin comes from the seed** — `admin_users` has no public endpoint, so without a seed nobody could create one. Plans are still never seeded.

- [x] **Schema file rebuilt** — `doc/Schema Proposal.md` is regenerated from these notes and is now the single source of truth for the DDL. The old version contradicted the notes in ~25 places.

## ⬜ To do — none of these block the first migration

> These are service-layer rules. The schema supports either answer, so decide them inside their phase. **The full list also lives at the bottom of `doc/Schema Proposal.md`.** Keep the two in step.

- [x] **Quote transitions** — decided 2026-10-06: `draft → sent`, `sent → draft/accepted/refused`, `accepted`/`refused` terminal. `valid_until` hard-blocks acceptance once passed. An accepted quote can't be undone directly — cancel the project instead. See \[\[phase-05-quotes-invoices\]\].

- [x] **Closing guard** — decided 2026-10-06: never blocked by payment status. `completed` means work finished, not fully paid. A bill arriving after closure is still recorded (shows up in the live `project_margin_live`) but never retroactively changes the frozen `project_closure_snapshots` row — reopen/reclose (admin only) to refresh it. See \[\[phase-03-clients-projects\]\].

- [ ] **Cancelled projects get no snapshot** — only `completed` writes one, so `project_margin_live` computes a dead project forever.

- [x] **Overpayment** — decided 2026-10-06: no new status, `paid` already covers `balance_due ≤ 0`. `payments` is append-only (same as `stock_movements`) — a mistake gets a correcting row, never an edit/delete. Status is recomputed from the ledger on every write, so a correction can naturally reopen `paid → partially_paid`. See \[\[phase-05-quotes-invoices\]\].

- [x] **Worker hour scope** — decided 2026-10-06: **project-level**. A worker may log hours on a project where they are an assignee on at least one task. `time_entries.task_id` stays optional; the check is the same with or without it. See \[\[planning-time-entries\]\].

- [ ] **Platform-admin cross-tenant read** — the escape hatch past the Prisma extension for a support conversation, and it must write `audit_logs`.

- [x] **Delete / cascade policy** — decided 2026-10-06, no sweep job. Every entity type except `project` never hard-deletes (soft-delete, soft-cancel, archive-only, or no delete route at all), so none can orphan `media`. `project` gets one real hard delete, `prospect`-status only, and its handler calls `MediaService.deleteAllForEntity()` synchronously before removing the row. See \[\[media-files\]\].

- [ ] **Tenant created by the super-admin** — `POST /api/admin/tenants` writes the `tenants` row only. Does it also create the trial `tenant_subscriptions` row and the first `admin` user, as self-registration does?

- [ ] **Known bug list review** — going through each bug from the testing doc and confirming the rule that fixes it.

- [ ] **Payments cannot actually go negative** — found during step 06's build (2026-10-06): `payments.amount` carries a DB `CHECK (amount > 0)` (`doc/Schema Proposal.md` § 6), but the decided Overpayment rule describes "a positive top-up or a negative correction" and a correction "naturally reopening `paid → partially_paid`". Under the real constraint, `amount_paid` can only ever increase, so `balance_due` can only ever fall — a `paid` invoice can never reopen. Either the CHECK needs relaxing (a migration) or the "negative correction" language needs rewriting to describe what's actually buildable. Not decided, not invented — see \[\[phase-05-quotes-invoices\]\] § Overpayment and `doc/notes/test/10-quotes-invoices.md` § 4.

- [ ] **Frontend** — not started, backend first.

## Related notes

- \[\[naming-conventions\]\]
- \[\[entity-fields\]\]
- \[\[auth-tokens\]\]
- \[\[document-numbering\]\]
- \[\[site-reports\]\]
- \[\[purchase-invoices\]\]
- \[\[business-logic-overview\]\]
- \[\[qa-project-quote-stock-invoices\]\]
- \[\[catalogue-stock-tables-and-cost-storage\]\]
- \[\[subcontracting\]\]
- \[\[planning-time-entries\]\]