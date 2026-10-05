# ChantierOS — Technical Build Order & Setup

> Status: v1 (working draft). No code here — decisions and structure only.

---

## 1. Prisma Migration — all tables & relations

### Rules
- **English only.** Every table, column, enum and status value is English. No French, no mixing. The full name list is in [[naming-conventions]] — read it before writing `schema.prisma`
- Tables are `snake_case` plural (`projects`, `time_entries`); columns are `snake_case` singular
- Every business table has `tenant_id NOT NULL` + FK to `tenants`
- All statuses are Prisma enums
- No table stores a running total. Totals come from a view over a ledger (`stock_movements`, `payments`, `time_entries`). The one exception is a document total: `quotes` and `invoices` store `amount_excl_vat`, `vat_amount` and `amount_incl_vat`, because a sent paper must never change
- **Numeric types are fixed** — money is `Decimal(12,2)`, quantity `Decimal(12,3)`, hours `Decimal(5,2)`. The full table is in [[naming-conventions]]. Never a JavaScript `number`

### Tables to migrate (full list)

**Platform level**
- `tenants`
- `admin_users`
- `plans`
- `plan_features`
- `tenant_subscriptions`
- `billing_usage_snapshots`
- `stripe_events`
- `audit_logs`
- `analytics_events`
- `feedback`

**Auth & Users**
- `roles` ← new, seeded on deploy
- `users`
- `role_permissions`
- `refresh_tokens` ← new
- `user_invitations` ← new
- `one_time_codes` ← new

**Clients & Projects**
- `clients`
- `projects`
- `project_status_history`

**Catalogue & Stock**
- `categories` ← new, seeded on deploy
- `services`
- `materials`
- `service_materials`
- `stock_movements`
- `stock_reservations` ← new

**Planning, Time & Site**
- `tasks`
- `task_assignees` ← new (one row per employee on a task)
- `time_entries`
- `reports` ← new (daily site report)

**Quotes & Invoices**
- `quotes`
- `quote_lines`
- `invoices`
- `invoice_lines`
- `payments`
- `document_counters` ← new (invoice/quote numbering)

**Purchases**
- `subcontractors`
- `suppliers` ← new
- `subcontractor_contracts`
- `purchase_invoices`

**Margin & Snapshot**
- `cost_types` ← new, seeded on deploy
- `project_closure_snapshots`
- `project_closure_snapshot_costs` ← new
- `project_margin_alerts` ← new (alert dedup)

**Media**
- `media` ← new (polymorphic file table)

**Client Portal**
- `portal_tokens`
- `portal_tracking`

**Chat**
- `conversations`
- `conversation_members`
- `messages`
- `message_reads` ← new

**Alerts**
- `notifications` ← new

**Support**
- `support_tickets`


### Views (raw SQL in migration — Prisma doesn't manage views)
- `project_margin_live` — budget vs live cost per project
- `invoice_balance` — invoice total vs payments received
- `material_stock_live` — `on_hand`, `reserved`, `available` per material

### Seed file (runs once on first deploy)
- `roles` — 7 default roles: `admin`, `manager`, `site_supervisor`, `team_leader`, `worker`, `sales`, `accountant`
- `cost_types` — 3 rows with `tenant_id = NULL`: `material`, `subcontractor`, `labor`
- `categories` — default catalogue categories with `tenant_id = NULL` (Painting, Tiling, Plumbing...)

`categories` and `cost_types` have a **nullable** `tenant_id`. `NULL` = a shared default, which is what lets a deploy-time seed work at all — a seed has no company to belong to. A tenant adding its own row writes its own `tenant_id`, and sees the defaults plus its own.

**Plans are never seeded.** There are no built-in tiers — the super-admin creates every plan as data.

---

## 1b. Multi-tenancy — how `tenant_id` is enforced

**Decision: a Prisma client extension, not Postgres RLS.**

Every request carries the `tenant_id` from the JWT. A Prisma client extension reads it from request-scoped storage (`nestjs-cls` / `AsyncLocalStorage`) and does two things on every query:

| Operation | What the extension does |
| --- | --- |
| `findMany`, `findFirst`, `count`, `aggregate` | Injects `where: { tenant_id }` |
| `create`, `createMany` | Injects `data: { tenant_id }` |
| `update`, `delete`, `upsert` | Injects `tenant_id` into the `where` clause |

### Why this and not RLS

| | Prisma extension (chosen) | Postgres RLS |
| --- | --- | --- |
| One code path | Yes | No — needs `SET LOCAL` per connection, fights the pool |
| Works with Prisma typing | Yes | Partly |
| Visible and testable in TypeScript | Yes | Lives in SQL policies |
| Protects against a raw SQL mistake | No | Yes |

RLS is the stronger guarantee but it fights connection pooling and adds a second place where rules live. The extension is chosen for v1. RLS can be added later as a second layer without changing application code.

### Rules that make this safe

- **Never bypass the extension.** The raw client is wrapped once at startup; nothing else may build a Prisma client.
- **Raw SQL (`$queryRaw`) must pass `tenant_id` explicitly** — the extension cannot see inside raw queries. Views included: `project_margin_live`, `invoice_balance` and `material_stock_live` all carry `tenant_id` and must be filtered by it.
- **Only the platform tables are excluded** from the extension: `tenants`, `admin_users`, `plans`, `plan_features`, `stripe_events`, `roles`, `refresh_tokens`, `one_time_codes`. That is the whole list — one rule, no exceptions to remember.
- **Every business table has `tenant_id`, child tables included** — `quote_lines`, `invoice_lines`, `task_assignees`, `message_reads` and the rest. The column is redundant in theory, since they are reached through a tenant-scoped parent. It is there so the extension protects them automatically: a `findUnique({ where: { id } })` with an id taken from the URL would otherwise return another company's row, silently. 16 bytes a row removes a whole class of bug.
- **`quote_lines`, `invoice_lines` and `task_assignees` also carry a composite FK** — `FOREIGN KEY (tenant_id, quote_id) REFERENCES quotes(tenant_id, id)`. A plain FK proves the quote exists; the composite one proves it belongs to the same company. A cross-tenant line cannot be inserted at all, blocked by the database rather than by a guard someone might forget.
- **The portal routes have no JWT**, so the token row supplies the tenant. The validator middleware looks up `portal_tokens` by hash, then writes that row's `tenant_id` into `nestjs-cls` **before** any other query runs. Skip this and the extension has no tenant at all.
- **`categories` and `cost_types` need their own filter**: `WHERE tenant_id IS NULL OR tenant_id = :current`. The plain extension would hide the shared defaults, so these two tables are read through a small dedicated method, never the generic one.
- **Unique constraints are composite with `tenant_id`** — e.g. invoice number is `UNIQUE (tenant_id, number)`, never `UNIQUE (number)`.
- **Every tenant-scoped FK must stay inside the tenant.** A `project_id` on an invoice must belong to the same tenant — enforced in the service layer and covered by a test.

### Package needed

`nestjs-cls` — request-scoped storage for the current `tenant_id` and `user_id`.

---

## 2. Auth — two separate systems

### Password hashing

`argon2id` only — `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`. bcrypt is not used anywhere.

### Token tables (3)

| Table | Holds |
|---|---|
| `refresh_tokens` | Hashed refresh token per session — lets you log out one device or all |
| `user_invitations` | Employee invite: email, `role_id`, hashed token, 7-day expiry |
| `one_time_codes` | Password reset, email verification and super-admin 2FA, split by a `type` enum |

Nothing is stored in plain text: every column is `token_hash` or `code_hash` (sha256). Full design in [[auth-tokens]].

### System A — `admin_users` (platform admin)
- Register (internal only — no public signup)
- Login → access token + refresh token
- Logout
- Forgot password → email OTP
- Change password
- Update account
- Profile image (single image per user via `media` table)

### System B — `users` (tenant side)
Two sub-flows:

**Tenant registration** — a NEW company signs up:
- Company fills registration form (company name, email, password)
- One transaction creates one `tenants` row + one `users` row with role `admin` + one `tenant_subscriptions` row (`is_default` plan, `status = 'trialing'`, `period_end = now() + 14 days`)
- Without that subscription row, `SubscriptionGuard` has nothing to check and the new company is locked out of its own app
- Email verification sent via Resend

**Employee invitation** — admin adds a team member:
- Admin enters employee name + email + role
- System sends invitation email with a one-time link
- Employee clicks link → sets their password
- Employee never "registers" themselves

**Standard login** (all users):
- Email + password → access token + refresh token
- Both tokens stored as **httpOnly cookies** (never exposed to JavaScript)
- Protects against XSS attacks

**Mobile PIN login** (`worker` role only):
- Separate endpoint: `/mobile/login`
- Takes **email + PIN**, checked against `mobile_pin_hash` (argon2id). Locks after 5 wrong tries
- Returns same httpOnly cookie tokens

### Token flow
```
Login
  → access token (httpOnly cookie, 15min)
  → refresh token (httpOnly cookie, 7 days)

Request with expired access token
  → client hits /auth/refresh
  → new access token issued (refresh token verified)

Logout
  → both cookies cleared
  → that `refresh_tokens` row gets `revoked_at`
```

The access token is stateless and never stored. The refresh token **is** stored (hashed) so a session can be killed. Every refresh rotates: new row issued, old row revoked. A revoked token used again → revoke every row for that user, because it was stolen.

### Profile image
- Single image per user (admin or tenant user)
- Stored via `media` table (`entity_type = 'user'`, `entity_id = user.id`)
- Uploading a new one deletes the old one automatically

---

## 3. Cross-cutting concerns — guards & decorators

### Request pipeline order (every request goes through this in order)

```
1. Auth guard          — valid JWT? who is this?
2. Tenant isolation    — scope everything to tenant_id from JWT
3. Subscription check  — is this feature allowed on their plan?
4. Permission check    — does this role have access to this module?
5. Rate limiting       — protect endpoints from abuse
6. Handler             — the actual controller method
```

### Guards / decorators

| Name | Type | What it does |
|---|---|---|
| `AuthGuard` | Guard | Validates JWT from httpOnly cookie |
| `TenantGuard` | Guard | Extracts `tenant_id` from JWT, scopes the request |
| `SubscriptionGuard` | Guard | Checks if tenant's plan allows this feature |
| `PermissionGuard` | Guard | Checks `role_permissions` for this role + module |
| `RateLimitGuard` | Guard | Blocks excessive requests |
| `@Roles(...roles)` | Decorator | Marks which roles can access an endpoint |
| `@Module(name)` | Decorator | Marks which module an endpoint belongs to (for permission check) |
| `@Public()` | Decorator | Marks an endpoint as public (skip auth) |
| `@AuditLog(action)` | Decorator | Writes to `audit_logs` after sensitive actions |

### Alert triggers
Alerts are not guards — they are **side effects** fired after a successful action:
- After a payment is recorded → check if invoice is now paid → fire alert
- After a `time entry` is saved → check daily total → fire alert if over limit
- On a schedule (cron) → alert on late invoices, check margin thresholds

---

## 4. Packages to install

### Core
| Package | Purpose |
|---|---|
| `prisma` + `@prisma/client` | ORM + migrations |
| `@nestjs/config` | `.env` management |
| `class-validator` + `class-transformer` | DTO validation |
| `@nestjs/swagger` | API docs (already enabled in `.env`) |
| `nestjs-cls` | Request-scoped `tenant_id` for the Prisma extension |

### Auth
| Package | Purpose |
|---|---|
| `@nestjs/jwt` | JWT generation + verification |
| `@nestjs/passport` + `passport` + `passport-jwt` | Auth strategy |
| `argon2` | Password hashing (argon2id — bcrypt is **not** used) |
| `@casl/ability` | Permission rules from `role_permissions` |
| `cookie-parser` | Read httpOnly cookies |

### Background jobs & real-time
| Package | Purpose |
|---|---|
| `@nestjs/bull` + `bullmq` | Job queues (alerts, emails, cron) |
| `@nestjs/websockets` + `socket.io` | Real-time notifications |
| `@nestjs/schedule` | Cron jobs (late invoices, margin checks) |

### Services
| Package | Purpose |
|---|---|
| `resend` | Email sending |
| `stripe` | Payments + webhooks |
| `imagekit` | File upload + management |
| `pdfmake` | Quote + invoice PDF generation |

### Utilities
| Package | Purpose |
|---|---|
| `@nestjs/throttler` | Rate limiting |
| `helmet` | HTTP security headers |

---

## Actual build sequence

Phase numbers are file labels, not the order. Build in this order — it follows the dependencies:

```
01 platform  → 02 auth  → 09 media  → 03 clients+projects
  → 04 catalogue+stock  → 05 quotes+invoices  → 06 purchases
  → 07 planning+time  → 14 site reports  → 08 margin
  → 11 chat  → 10 client portal  → 12 alerts  → 13 stripe
  → 15 documents (PDF)  → 16 support+feedback
```

The AI layer (phase 17) is **not in v1**. Its tables — `hitl_queue`, `connectors`, `token_recharges` — are not in the first migration.

Three positions differ from the numbering:

| Phase | Build it | Why |
|---|---|---|
| 09 Media | Right after auth | Profile images, report photos and bill PDFs all need it |
| 14 Site reports | Before 08 and 10 | Stock consumption and the portal progress % both come from it |
| 11 Chat | Before 10 | The portal auto-creates a `project_client` conversation |

## Phase files (read before building each phase)

| Phase | File | Summary |
|---|---|---|
| 01 | [phase-01-platform.md](phase-01-platform.md) | Tenants, admin auth, plans, audit logs |
| 02 | [phase-02-auth-users.md](phase-02-auth-users.md) | Auth systems, httpOnly cookies, roles, guards |
| 03 | [phase-03-clients-projects.md](phase-03-clients-projects.md) | Clients, projects, status rules |
| 04 | [phase-04-catalogue-stock.md](phase-04-catalogue-stock.md) | Categories, materials, stock ledger, reservations |
| 05 | [phase-05-quotes-invoices.md](phase-05-quotes-invoices.md) | Quote, invoices, payments, late-invoice cron |
| 06 | [phase-06-subcontracting.md](phase-06-subcontracting.md) | Subcontractors, contracts, purchase invoices |
| 07 | [phase-07-planning-time-entries.md](phase-07-planning-time-entries.md) | Time tracking, frozen hourly_rate |
| 08 | [phase-08-margin-snapshot.md](phase-08-margin-snapshot.md) | Live margin view, closure snapshot, alerts |
| 09 | [phase-09-media.md](phase-09-media.md) | Polymorphic file storage via ImageKit |
| 10 | [phase-10-client-portal.md](phase-10-client-portal.md) | Token-based client portal |
| 11 | [phase-11-chat.md](phase-11-chat.md) | Internal + client conversations |
| 12 | [phase-12-alerts.md](phase-12-alerts.md) | WebSocket + email notifications |
| 13 | [phase-13-subscriptions.md](phase-13-subscriptions.md) | Stripe webhooks, subscription guard |
| 14 | [phase-14-site-reports.md](phase-14-site-reports.md) | Daily site report, progress %, material usage |
| 15 | [phase-15-documents.md](phase-15-documents.md) | Quote + invoice PDF generation |
| 16 | [phase-16-support-feedback.md](phase-16-support-feedback.md) | Support tickets, feedback, analytics, token recharges |
| — | [phase-17-ai-layer.md](phase-17-ai-layer.md) | **v2, not built now** — HITL approvals, connectors |

## Related notes
- [[naming-conventions]]
- [[entity-fields]]
- [[auth-tokens]]
- [[document-numbering]]
- [[business-logic-overview]]
- [[roles-permissions]]
- [[alerts]]
- [[subscription-plans]]
- [[media-files]]
