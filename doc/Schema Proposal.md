# ChantierOS — PostgreSQL Schema

> **This file is the single source of truth for the database.** It is generated from the decisions in `doc/notes/`. If this file and a note disagree, the note is newer — fix this file.
>
> Language is English everywhere. Read [notes/naming-conventions.md](notes/naming-conventions.md) before changing anything here.

## Design rules

1. **`tenant_id NOT NULL` on every business table**, with a FK to `tenants`. The only exceptions are the platform tables (`tenants`, `admin_users`, `plans`, `plan_features`, `stripe_events`, `roles`, `refresh_tokens`, `one_time_codes`) and two tables with a **nullable** `tenant_id` where `NULL` means a shared default (`categories`, `cost_types`).
2. **No table stores a running total.** Quantities, balances and margins are computed by a view over a ledger. The one exception is a document total: `quotes` and `invoices` store their three money columns, because a sent paper must never change.
3. **Prices are frozen on the row that uses them** — `stock_movements.unit_price` and `time_entries.hourly_rate`. Changing a price today never shifts a past cost.
4. **Every status is a Postgres enum**, never free text.
5. **Unique constraints are composite with `tenant_id`** — `UNIQUE (tenant_id, number)`, never `UNIQUE (number)`.
6. **Nothing secret is stored readable.** Every token is `token_hash` / `code_hash` (sha256); passwords and PINs are argon2id.
7. **Numeric types are fixed**: money `NUMERIC(12,2)`, quantity `NUMERIC(12,3)`, recipe `NUMERIC(12,4)`, hours `NUMERIC(5,2)`, rate `NUMERIC(5,2)`, `progress_pct` `INTEGER`.
8. **Indexes on `(tenant_id, …)`** for every table expected to grow.
9. **`id` is `SERIAL` (auto-increment integer), not UUID.** Decided 2026-10-05 — see `doc/notes/entity-fields.md`. Trade-off accepted: a sequential id is enumerable across tenants, unlike a UUID.

---

## 0. Extensions & enum types

```sql

CREATE TYPE tenant_status            AS ENUM ('active','suspended','banned');
CREATE TYPE subscription_status      AS ENUM ('trialing','active','past_due','cancelled');
CREATE TYPE client_type              AS ENUM ('individual','professional','property_manager');
CREATE TYPE project_status           AS ENUM ('prospect','in_progress','completed','cancelled');
CREATE TYPE quote_status             AS ENUM ('draft','sent','accepted','refused');
CREATE TYPE invoice_status           AS ENUM ('draft','sent','partially_paid','paid','cancelled');
CREATE TYPE payment_method           AS ENUM ('transfer','cheque','cash','stripe');
CREATE TYPE purchase_invoice_status  AS ENUM ('to_pay','paid');
CREATE TYPE purchase_invoice_type    AS ENUM ('subcontractor','supplier');
CREATE TYPE contract_status          AS ENUM ('in_progress','completed','cancelled');
CREATE TYPE stock_movement_type      AS ENUM ('purchase','consumption','adjustment');
CREATE TYPE reservation_status       AS ENUM ('active','released','consumed');
CREATE TYPE task_type                AS ENUM ('meeting','work');
CREATE TYPE task_status              AS ENUM ('planned','in_progress','completed');
CREATE TYPE conversation_type        AS ENUM ('internal','project_client','support');
CREATE TYPE sender_type              AS ENUM ('employee','client','admin');
CREATE TYPE portal_event_type        AS ENUM ('view','download');
CREATE TYPE document_type            AS ENUM ('quote','invoice','purchase_invoice');
CREATE TYPE one_time_code_type       AS ENUM ('password_reset','email_verification','admin_2fa');
CREATE TYPE margin_alert_level       AS ENUM ('warning','critical');
CREATE TYPE permission_scope         AS ENUM ('all','own');
CREATE TYPE ticket_status            AS ENUM ('open','in_progress','waiting_tenant','closed');
CREATE TYPE ticket_category          AS ENUM ('bug','question','billing','other');
CREATE TYPE ticket_priority          AS ENUM ('low','normal','high');
CREATE TYPE feedback_type            AS ENUM ('feature_request','improvement','complaint');
CREATE TYPE feedback_status          AS ENUM ('new','reviewing','planned','declined','shipped');

CREATE TYPE permission_module AS ENUM (
  'clients','projects','tasks','time_entries','catalogue','stock','quotes','invoices',
  'purchase_invoices','margins','subcontractors','reports','media','chat','team','settings'
);

CREATE TYPE media_entity_type AS ENUM (
  'user','tenant','project','report','purchase_invoice','quote','invoice','message'
);
```

`invoice_status` has **no `overdue`**. Late is calculated: `due_date < today AND balance_due > 0`.

---

## 1. Platform

```sql
CREATE TABLE tenants (
  id                       SERIAL PRIMARY KEY,
  name                     TEXT NOT NULL,
  legal_name               TEXT,
  vat_number               TEXT,
  registration_number      TEXT,
  email                    TEXT NOT NULL UNIQUE,
  phone                    TEXT,
  address_line1            TEXT,
  address_line2            TEXT,
  postal_code              TEXT,
  city                     TEXT,
  country                  CHAR(2),
  logo_media_id            INTEGER,                 -- → media.id, no FK (media is polymorphic)
  default_vat_rate         NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  default_payment_days     SMALLINT NOT NULL DEFAULT 30,   -- how long a client has to pay
  locale                   TEXT NOT NULL DEFAULT 'fr',
  currency                 CHAR(3) NOT NULL DEFAULT 'EUR',
  timezone                 TEXT NOT NULL DEFAULT 'Europe/Brussels',
  end_of_day_reminder_time TIME NOT NULL DEFAULT '18:00',
  status                   tenant_status NOT NULL DEFAULT 'active',
  deleted_at               TIMESTAMPTZ,              -- soft delete. NULL = not deleted. Independent of status
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,                   -- argon2id
  totp_secret   TEXT,                            -- otplib, for admin_2fa
  role          TEXT NOT NULL DEFAULT 'staff',   -- 'super_admin' | 'staff'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`currency` exists on `tenants`, but money columns carry no currency. **v1 is EUR-only** — one currency per deployment.

### Plans — created by the super-admin, never seeded

```sql
CREATE TABLE plans (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  base_price      NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT true,  -- false = no new signups
  is_default      BOOLEAN NOT NULL DEFAULT false, -- the plan a new signup lands on
  parent_plan_id  INTEGER REFERENCES plans(id),      -- the version this replaces
  stripe_price_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one default plan at a time
CREATE UNIQUE INDEX idx_plans_one_default ON plans (is_default) WHERE is_default = true;

CREATE TABLE plan_features (
  id           SERIAL PRIMARY KEY,
  plan_id      INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,                     -- max_workers | max_managers | max_clients
                                                  -- max_subcontractors | storage_gb | retention_days
  limit_value  INTEGER NOT NULL,
  overage_rate NUMERIC(12,2) NOT NULL DEFAULT 0,  -- retention_days has no overage
  UNIQUE (plan_id, feature_key)
);
```

A plan is **immutable once in use**. A price or limit change deactivates the old row and creates a new one with `parent_plan_id` pointing back. Existing tenants stay on the old row.

**Operational rule:** plans are never seeded, so the super-admin must create at least one plan and set `is_default = true` **before signups can work**. Registration fails without it.

### Subscriptions

```sql
CREATE TABLE tenant_subscriptions (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id                   INTEGER NOT NULL REFERENCES plans(id),
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,
  stripe_price_id           TEXT,
  status                    subscription_status NOT NULL DEFAULT 'trialing',
  period_start              TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end                TIMESTAMPTZ NOT NULL,
  pending_plan_id           INTEGER REFERENCES plans(id),
  pending_plan_effective_at TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

One row per tenant — **there is no `subscriptions` table.**

**Created at registration, in the same transaction as the tenant**: the `is_default` plan, `status = 'trialing'`, `period_end = now() + 14 days`. Without this row a new company would be locked out of its own app.

`SubscriptionGuard` allows `trialing`, `active` and `past_due`. It blocks `cancelled`, and any tenant that is `suspended` or `banned`. It **never counts resources** — going over an allowance is billed as overage, never blocked.

```sql
CREATE TABLE billing_usage_snapshots (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start       TIMESTAMPTZ NOT NULL,
  period_end         TIMESTAMPTZ NOT NULL,
  snapshot_taken_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  feature_key        TEXT NOT NULL,
  actual_count       NUMERIC(14,3) NOT NULL,
  included_allowance INTEGER NOT NULL,            -- copied at snapshot time
  overage_rate       NUMERIC(12,2) NOT NULL,      -- copied at snapshot time
  overage_amount     NUMERIC(12,2) NOT NULL,      -- max(0, actual - allowance) * rate
  stripe_invoice_id  TEXT,
  UNIQUE (tenant_id, period_start, feature_key)
);

CREATE TABLE stripe_events (
  id              SERIAL PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,           -- never process the same event twice
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Audit, analytics, feedback, support

```sql
CREATE TABLE audit_logs (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  user_id       INTEGER,                             -- tenant-side actor; no FK, history outlives the user
  action        TEXT NOT NULL,                    -- 'update' | 'delete' | 'impersonate_enter' | …
  entity_type   TEXT NOT NULL,
  entity_id     INTEGER,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs (tenant_id, created_at);

CREATE TABLE analytics_events (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    INTEGER,                   -- → users.id, FK added in section 11 (forward reference)
  event_name TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_tenant_date ON analytics_events (tenant_id, created_at);

CREATE TABLE feedback (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL,        -- → users.id, FK added in section 11 (forward reference)
  type         feedback_type NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  status       feedback_status NOT NULL DEFAULT 'new',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opened_by         INTEGER NOT NULL,   -- → users.id (role 'admin'), FK added in section 11
  subject           TEXT NOT NULL,
  category          ticket_category NOT NULL DEFAULT 'question',
  priority          ticket_priority NOT NULL DEFAULT 'normal',
  status            ticket_status NOT NULL DEFAULT 'open',
  assigned_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_tenant ON support_tickets (tenant_id, status);
```

`analytics_events` and read `notifications` are the **only** things `retention_days` deletes. Business data is kept forever, whatever the plan.

---

## 2. Auth & users

```sql
CREATE TABLE roles (
  id         SMALLINT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,   -- admin | manager | site_supervisor | team_leader
                                     -- worker | sales | accountant
  label      TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id         SMALLINT NOT NULL REFERENCES roles(id),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,           -- UNIQUE across the WHOLE app, not per tenant
  phone           TEXT,
  password_hash   TEXT,                           -- argon2id
  mobile_pin_hash TEXT,                           -- argon2id, 'worker' role only
  failed_pin_count SMALLINT NOT NULL DEFAULT 0,   -- locks at 5
  hourly_rate     NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  email_verified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_tenant ON users (tenant_id);
```

`users.email` is **globally unique** because login is email + password with no company field. One email belongs to one company.

### `role_permissions` — overrides only

```sql
CREATE TABLE role_permissions (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id    SMALLINT NOT NULL REFERENCES roles(id),
  module     permission_module NOT NULL,
  can_view   BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit   BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  scope      permission_scope NOT NULL DEFAULT 'all',
  UNIQUE (tenant_id, role_id, module)
);
```

**`scope` is why this table needs 5 columns, not 4.** The default matrix uses three levels — `full`, `view`, and **`own`**. `own` means "yes, he can see it, but only his own rows" (a `worker` sees his own tasks and his own hours). Four booleans cannot say that. `scope = 'own'` makes `PermissionGuard` add `WHERE user_id = :current` to the query.

This table stores **only overrides**. The default matrix lives in code — nothing is seeded per tenant. `PermissionGuard` reads the code default, then applies an override row if one exists for that tenant + role + module.

### Tokens — nothing stored readable

```sql
CREATE TABLE refresh_tokens (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,             -- sha256; raw value lives only in the cookie
  user_agent    TEXT,
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,             -- issued + 7 days
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, admin_user_id) = 1)
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

CREATE TABLE user_invitations (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  role_id     SMALLINT NOT NULL REFERENCES roles(id),
  token_hash  TEXT NOT NULL UNIQUE,
  invited_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at  TIMESTAMPTZ NOT NULL,               -- created + 7 days
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- One OPEN invitation per email, app-wide (same reason as users.email)
CREATE UNIQUE INDEX idx_invitations_open_email ON user_invitations (email) WHERE accepted_at IS NULL;

CREATE TABLE one_time_codes (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  type          one_time_code_type NOT NULL,
  code_hash     TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  attempt_count SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(tenant_id, user_id, admin_user_id) = 1)
);
```

| `type` | Lifetime | Max attempts |
|---|---|---|
| `password_reset` | 1 hour | 5 |
| `email_verification` | 24 hours | — |
| `admin_2fa` | 5 minutes | 3 |

argon2id settings: `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`. bcrypt is not used anywhere.

---

## 3. Clients & projects

```sql
CREATE TABLE clients (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type            client_type NOT NULL DEFAULT 'individual',
  name            TEXT NOT NULL,
  contact_name    TEXT,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL CHECK (phone ~ '^\+?[0-9 ().-]{6,20}$'),
  phone_secondary TEXT,
  vat_number      TEXT,
  address_line1   TEXT,
  address_line2   TEXT,
  postal_code     TEXT,
  city            TEXT,
  country         CHAR(2),
  note            TEXT,                            -- internal, never shown in the portal
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_professional_has_vat
    CHECK (type <> 'professional' OR vat_number IS NOT NULL),
  UNIQUE (tenant_id, email)
);
CREATE INDEX idx_clients_tenant ON clients (tenant_id);
```

`email` is required: the whole client flow is email (quote sent, invoice sent, late reminder, portal link). It is unique **per tenant** — two companies may both have the same client.

```sql
CREATE TABLE projects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  description     TEXT,
  status          project_status NOT NULL DEFAULT 'prospect',
  address_line1   TEXT,
  address_line2   TEXT,
  postal_code     TEXT,
  city            TEXT,
  start_date      DATE,
  end_date        DATE,
  actual_end_date DATE,                            -- set when status becomes 'completed'
  manager_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_projects_tenant_status ON projects (tenant_id, status);
```

**`projects` deliberately has no `budget_excl_vat` and no `progress_pct` column.** Budget is `SUM(quotes.amount_excl_vat)` of accepted quotes, in `project_margin_live`. Progress is `progress_pct` of the newest `reports` row.

```sql
CREATE TABLE project_status_history (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status project_status,                      -- NULL on creation
  to_status   project_status NOT NULL,
  reason      TEXT,
  changed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_status_history_project ON project_status_history (project_id, changed_at);
```

### Allowed status transitions — enforced in the service

```
prospect     → in_progress, cancelled
in_progress  → completed, cancelled
completed    → in_progress   (admin only — voids the closure snapshot)
cancelled    → nothing       (final)
```

`cancelled` is final: a client who comes back gets a **new** project. Reopening a `completed` project **voids** its snapshot (`voided_at`), it does not delete it — the snapshot is a financial record.

---

## 4. Catalogue & stock

```sql
CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = shared default, seeded
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description     TEXT NOT NULL,
  unit            TEXT NOT NULL,                   -- m2 | ml | h | piece
  price_excl_vat  NUMERIC(12,2) NOT NULL CHECK (price_excl_vat >= 0),
  default_vat_rate NUMERIC(5,2),                   -- NULL = fall back to tenants.default_vat_rate
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_tenant ON services (tenant_id);

CREATE TABLE materials (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description    TEXT NOT NULL,
  unit           TEXT NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0, -- today's price; the frozen one is on the movement
  minimum_stock  NUMERIC(12,3) NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_materials_tenant ON materials (tenant_id);
```

**`materials` has no quantity column.** The quantity in stock is only ever summed from the ledger.

```sql
-- The recipe: what one unit of a service consumes
CREATE TABLE service_materials (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id        INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  material_id       INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity_per_unit NUMERIC(12,4) NOT NULL CHECK (quantity_per_unit > 0),
  UNIQUE (service_id, material_id)
);
```

### `stock_movements` — the one source of truth for quantity

```sql
CREATE TABLE stock_movements (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  material_id         INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  project_id          INTEGER REFERENCES projects(id) ON DELETE RESTRICT,
  report_id           INTEGER,          -- → reports.id, FK added in section 11 (forward reference)
  purchase_invoice_id INTEGER,          -- → purchase_invoices.id, FK added in section 11
  type                stock_movement_type NOT NULL,
  quantity            NUMERIC(12,3) NOT NULL CHECK (quantity <> 0),  -- SIGNED
  unit_price          NUMERIC(12,2) NOT NULL,      -- FROZEN at the moment of the movement
  movement_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  note                TEXT,
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- a consumption must say which project it was for, and must be negative
  CONSTRAINT chk_consumption_has_project
    CHECK (type <> 'consumption' OR (project_id IS NOT NULL AND quantity < 0)),
  -- a purchase is never tied to a project (stock is a shared pool) and must be positive
  CONSTRAINT chk_purchase_no_project
    CHECK (type <> 'purchase' OR (project_id IS NULL AND quantity > 0))
);
CREATE INDEX idx_stock_mvt_tenant_material ON stock_movements (tenant_id, material_id);
CREATE INDEX idx_stock_mvt_project ON stock_movements (project_id) WHERE project_id IS NOT NULL;
```

| Column | Why it exists |
|---|---|
| `quantity` **signed** | `+` purchase, `−` consumption, either sign for `adjustment` |
| `unit_price` | Copied from `materials.purchase_price` at that moment. A price change next month never shifts a past cost |
| `project_id` nullable | A `purchase` row belongs to the shared pool, not to a project. Only `consumption` requires one |
| `report_id` | The site report that declared this consumption — traceability back to who said it and when |
| `purchase_invoice_id` | Links a `purchase` row to the supplier bill, when both exist. Either can exist alone |

The ledger is **append-only**. A mistake is corrected with a new `adjustment` row, never by editing or deleting.

```sql
CREATE TABLE stock_reservations (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id        INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  reserved_quantity  NUMERIC(12,3) NOT NULL CHECK (reserved_quantity >= 0),  -- original
  remaining_quantity NUMERIC(12,3) NOT NULL CHECK (remaining_quantity >= 0), -- what is still held
  status             reservation_status NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (remaining_quantity <= reserved_quantity),
  UNIQUE (project_id, material_id)
);
```

**Two quantity columns on purpose.** `reserved_quantity` is what the accepted quotes asked for; `remaining_quantity` is what is still held. Consuming material lowers `remaining_quantity` only — so you never lose the original figure, and `reserved → consumed` stays auditable.

`UNIQUE (project_id, material_id)` means **a second accepted quote adds to the existing row** (both quantities go up), it does not create a duplicate.

| Event | What happens |
|---|---|
| Quote accepted | Row upserted, both quantities raised, `status = 'active'` |
| Material consumed | `remaining_quantity` drops by the same amount |
| Reaches zero | `status = 'consumed'` |
| Project cancelled | `status = 'released'`, `remaining_quantity = 0` |

Only `active` rows count in `material_stock_live.reserved`.

---

## 5. Planning, time & site reports

```sql
CREATE TABLE tasks (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  type       task_type NOT NULL DEFAULT 'work',
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  status     task_status NOT NULL DEFAULT 'planned',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_task_dates CHECK (end_date >= start_date),
  UNIQUE (tenant_id, id)        -- lets task_assignees carry a composite FK
);
CREATE INDEX idx_tasks_project ON tasks (project_id);

-- Many workers, ONE task = one bar on the Gantt chart
CREATE TABLE task_assignees (
  id        SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id   INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- a real account, never a typed name
  UNIQUE (task_id, user_id),
  FOREIGN KEY (tenant_id, task_id) REFERENCES tasks(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_task_assignees_user ON task_assignees (user_id);
```

A task needs at least one assignee before its status can leave `planned` — checked in the service.

```sql
CREATE TABLE time_entries (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  work_date   DATE NOT NULL,
  hours       NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  hourly_rate NUMERIC(12,2) NOT NULL,              -- FROZEN from users.hourly_rate at write time
  comment     TEXT,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, work_date)
);
CREATE INDEX idx_time_entries_user_date ON time_entries (user_id, work_date);
CREATE INDEX idx_time_entries_project ON time_entries (project_id);
```

**Daily hours rule** — the per-row `hours <= 24` check is not enough, because 20h on project A plus 20h on project B both pass it. The service sums **all** rows for that `user_id` + `work_date` across every project:

| Same-day total, all projects | Action |
|---|---|
| up to 12h | Saved |
| over 12h | Saved + abnormal-hours alert to the manager |
| over 24h | **Rejected** |

Runs on insert **and** update, excluding the row being edited. Add a DB trigger later as a safety net.

`time_entries` is **not** append-only: the row itself is corrected and the old value goes to `audit_logs`. An hour entry has one right answer per employee per day per project, which is why `UNIQUE (user_id, project_id, work_date)` holds.

```sql
CREATE TABLE reports (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_pct INTEGER NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  weather      TEXT,
  note         TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, project_id, report_date)
);
```

One report per project per day. Re-posting the same day edits the existing row. Photos attach through `media` (`entity_type = 'report'`), not a separate photos table.

---

## 6. Client money — quotes, invoices, payments

### VAT lives on the LINE, not on the document

A Belgian renovation document often mixes **6% on labor** and **21% on supplies** in the same quote. One `vat_rate` column on the document cannot hold two rates, so `vat_rate` sits on each line. `tenants.default_vat_rate` and `services.default_vat_rate` are only pre-fills for a new line.

The document still **stores** its three totals, computed per rate group then summed:

```
for each distinct vat_rate on the lines:
    group_excl_vat = SUM(total_excl_vat) of the lines at that rate
    group_vat      = round(group_excl_vat * vat_rate / 100, 2)

amount_excl_vat = SUM(group_excl_vat)
vat_amount      = SUM(group_vat)
amount_incl_vat = amount_excl_vat + vat_amount
```

VAT is rounded **once per rate group**, never per line. The per-rate breakdown the Belgian invoice must print is computed from the lines, which are frozen on `sent` — so no extra table is needed.

```sql
CREATE TABLE document_counters (
  tenant_id     INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  year          SMALLINT NOT NULL,
  last_number   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, document_type, year)
);

CREATE TABLE quotes (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id        INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  number           TEXT NOT NULL,                  -- QUO-2026-0001
  status           quote_status NOT NULL DEFAULT 'draft',
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until      DATE,
  default_vat_rate NUMERIC(5,2) NOT NULL,          -- pre-fill for new lines, copied from the tenant
  amount_excl_vat  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  vat_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  amount_incl_vat  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  note             TEXT,
  sent_at          TIMESTAMPTZ,
  accepted_at      TIMESTAMPTZ,
  refused_at       TIMESTAMPTZ,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number),
  UNIQUE (tenant_id, id)        -- lets quote_lines carry a composite FK
);
CREATE INDEX idx_quotes_project_status ON quotes (project_id, status);

CREATE TABLE quote_lines (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id            INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id          INTEGER REFERENCES services(id) ON DELETE SET NULL,  -- NULL = free-text line
  description         TEXT NOT NULL,
  unit                TEXT,
  quantity            NUMERIC(12,3) NOT NULL CHECK (quantity <> 0),
  unit_price_excl_vat NUMERIC(12,2) NOT NULL CHECK (unit_price_excl_vat >= 0),
  vat_rate            NUMERIC(5,2) NOT NULL,       -- 6 or 21 — per line
  total_excl_vat      NUMERIC(12,2) NOT NULL DEFAULT 0,  -- set by trigger, see below
  position            SMALLINT NOT NULL DEFAULT 0,
  -- the line and its quote MUST belong to the same company
  FOREIGN KEY (tenant_id, quote_id) REFERENCES quotes(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_quote_lines_quote ON quote_lines (quote_id, position);
```

`service_id` is nullable **on purpose**: a catalogue line reserves stock through the recipe, a free-text line reserves nothing. Staff must be able to write a free line.

The DB-computed `total_excl_vat` is what fixes the `NaN` total bug — the number is never produced by client JS.

It is set by a **trigger**, not a `GENERATED` column, so Prisma can keep managing the table without reporting permanent drift:

```sql
CREATE FUNCTION set_document_line_total() RETURNS TRIGGER AS $$
BEGIN
  NEW.total_excl_vat := round(NEW.quantity * NEW.unit_price_excl_vat, 2);
  RETURN NEW;
END $$ LANGUAGE plpgsql;
-- BEFORE INSERT OR UPDATE OF quantity, unit_price_excl_vat on quote_lines and invoice_lines
```

```sql
CREATE TABLE invoices (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id        INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  quote_id         INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
  number           TEXT NOT NULL,                  -- INV-2026-0042
  status           invoice_status NOT NULL DEFAULT 'draft',
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE NOT NULL,   -- issue_date + tenants.default_payment_days, editable
  default_vat_rate NUMERIC(5,2) NOT NULL,
  amount_excl_vat  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  vat_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  amount_incl_vat  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- STORED
  note             TEXT,
  sent_at          TIMESTAMPTZ,
  reminder_count   SMALLINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number),
  UNIQUE (tenant_id, id)        -- lets invoice_lines carry a composite FK
);
CREATE INDEX idx_invoices_project ON invoices (project_id);
CREATE INDEX idx_invoices_due ON invoices (tenant_id, due_date) WHERE status IN ('sent','partially_paid');

CREATE TABLE invoice_lines (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id          INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id          INTEGER REFERENCES services(id) ON DELETE SET NULL,
  description         TEXT NOT NULL,
  unit                TEXT,
  quantity            NUMERIC(12,3) NOT NULL CHECK (quantity <> 0),
  unit_price_excl_vat NUMERIC(12,2) NOT NULL CHECK (unit_price_excl_vat >= 0),
  vat_rate            NUMERIC(5,2) NOT NULL,
  total_excl_vat      NUMERIC(12,2) NOT NULL DEFAULT 0,  -- set by trigger, see below
  position            SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id, invoice_id) REFERENCES invoices(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines (invoice_id, position);

CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id   INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method       payment_method NOT NULL,
  reference    TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON payments (invoice_id);
```

While a document is `draft`, the service recalculates the three totals on every line change. On `sent`, **lines and totals freeze together** — a sent paper never changes its total or its number.

A cancelled document keeps its number and leaves a gap. That gap is normal and expected by accountants. Numbers are never reused, and never `COUNT(*) + 1`.

---

## 7. Purchases — money out

```sql
CREATE TABLE subcontractors (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade        TEXT,
  email        TEXT,
  phone        TEXT CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ().-]{6,20}$'),
  vat_number   TEXT,
  hourly_rate  NUMERIC(12,2),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subcontractors_tenant ON subcontractors (tenant_id);

CREATE TABLE suppliers (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ().-]{6,20}$'),
  address    TEXT,
  vat_number TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subcontractor_contracts (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subcontractor_id INTEGER NOT NULL REFERENCES subcontractors(id) ON DELETE RESTRICT,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  description      TEXT,
  amount_excl_vat  NUMERIC(12,2) NOT NULL CHECK (amount_excl_vat >= 0),
  status           contract_status NOT NULL DEFAULT 'in_progress',
  start_date       DATE,
  end_date         DATE,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_contract_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_contracts_project ON subcontractor_contracts (project_id);

CREATE TABLE cost_types (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = shared default, seeded
  name       TEXT NOT NULL,      -- material | subcontractor | labor | + whatever a tenant adds
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_invoices (
  id                        SERIAL PRIMARY KEY,
  tenant_id                 INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type                      purchase_invoice_type NOT NULL,  -- WHO sent us the paper
  cost_type_id              INTEGER NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT, -- WHAT kind of cost
  subcontractor_contract_id INTEGER REFERENCES subcontractor_contracts(id) ON DELETE RESTRICT,
  supplier_id               INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
  project_id                INTEGER REFERENCES projects(id) ON DELETE RESTRICT,
  number                    TEXT NOT NULL,                  -- our number, PUR-2026-0007
  external_number           TEXT,                           -- their number, as printed
  amount_excl_vat           NUMERIC(12,2) NOT NULL CHECK (amount_excl_vat >= 0),
  vat_rate                  NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  vat_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_incl_vat           NUMERIC(12,2) NOT NULL DEFAULT 0,
  issue_date                DATE NOT NULL,
  due_date                  DATE,
  status                    purchase_invoice_status NOT NULL DEFAULT 'to_pay',
  payment_reference         TEXT,
  paid_at                   TIMESTAMPTZ,
  created_by                INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number),

  -- exactly one source
  CONSTRAINT chk_purchase_one_source CHECK (
    (type = 'subcontractor' AND subcontractor_contract_id IS NOT NULL AND supplier_id IS NULL)
 OR (type = 'supplier'      AND supplier_id IS NOT NULL AND subcontractor_contract_id IS NULL)
  ),
  -- a subcontractor bill always has a project, because its contract has one
  CONSTRAINT chk_subcontractor_has_project
    CHECK (type <> 'subcontractor' OR project_id IS NOT NULL)
);
CREATE INDEX idx_purchase_invoices_project ON purchase_invoices (project_id) WHERE project_id IS NOT NULL;
```

### The material double-count guard

A material bill **never carries a project**, because material cost has exactly one source: the `consumption` rows in the stock ledger. Every material passes through the stock, even a delivery that goes straight to site — one `purchase` row the day it arrives, one `consumption` row the day it is used. If the bill also carried a project, the same tiles would be counted twice.

This cannot be a plain `CHECK` (it has to read `cost_types.name`), so it is a trigger:

```sql
CREATE FUNCTION chk_material_bill_has_no_project() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NOT NULL
     AND (SELECT name FROM cost_types WHERE id = NEW.cost_type_id) = 'material' THEN
    RAISE EXCEPTION 'A material purchase invoice cannot carry a project_id '
                    '(cost comes from the stock ledger, not the bill)';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_material_bill_no_project
  BEFORE INSERT OR UPDATE ON purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION chk_material_bill_has_no_project();
```

`status` is `to_pay` / `paid`, all or nothing — there is no payment ledger for money out in v1. A subcontractor paid in stages gets **one bill per stage**. The received PDF attaches through `media` (`entity_type = 'purchase_invoice'`); there is no `document_url` column.

---

## 8. Margin

```sql
CREATE TABLE project_closure_snapshots (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_excl_vat NUMERIC(12,2) NOT NULL,
  total_cost      NUMERIC(12,2) NOT NULL,
  margin_excl_vat NUMERIC(12,2) NOT NULL,
  margin_pct      NUMERIC(5,2),
  closed_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at       TIMESTAMPTZ,                     -- set if an admin reopens the project
  voided_by       INTEGER REFERENCES users(id) ON DELETE SET NULL
);
-- only one LIVE snapshot per project; a voided one stays as history
CREATE UNIQUE INDEX idx_closure_one_live ON project_closure_snapshots (project_id)
  WHERE voided_at IS NULL;

-- No fixed material_cost / labor_cost columns: a tenant can add cost types, so the
-- breakdown is rows, not columns. A new cost type needs no migration.
CREATE TABLE project_closure_snapshot_costs (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_id  INTEGER NOT NULL REFERENCES project_closure_snapshots(id) ON DELETE CASCADE,
  cost_type_id INTEGER NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT,
  amount       NUMERIC(12,2) NOT NULL,
  UNIQUE (snapshot_id, cost_type_id)
);

-- One row per project per level: each alert level fires ONCE
CREATE TABLE project_margin_alerts (
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level      margin_alert_level NOT NULL,
  fired_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, level)
);
```

Reopening a `completed` project sets `voided_at` — it does **not** delete the row. A fresh snapshot is written at the next close. A financial record is never destroyed.

---

## 9. Shared — media, notifications, portal, chat

```sql
CREATE TABLE media (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type media_entity_type NOT NULL,
  entity_id   INTEGER NOT NULL,                       -- polymorphic: no FK by design
  file_name   TEXT NOT NULL,
  file_id     TEXT NOT NULL,                       -- ImageKit's own file id, needed to delete/update it later
  file_url    TEXT NOT NULL,                       -- ImageKit URL, never changes
  file_type   TEXT NOT NULL,                       -- MIME
  file_size   BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),  -- 10 MB
  is_locked   BOOLEAN NOT NULL DEFAULT false,      -- true = the frozen copy of a sent document
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  deleted_at  TIMESTAMPTZ,                         -- soft delete (trash). NULL = not deleted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_entity ON media (entity_type, entity_id);
CREATE INDEX idx_media_tenant ON media (tenant_id);
```

`is_locked` protects the PDF the client actually received. The delete endpoint refuses a locked row, soft or hard — otherwise the legal copy of a sent invoice could be deleted like any photo. `SUM(file_size)` per tenant is the number the `storage_gb` billing dimension reads, and it **still counts a soft-deleted (trashed) row** — trash is not free storage. `deleted_at` decided 2026-10-06: see `doc/notes/media-files.md`.

```sql
CREATE TABLE notifications (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER REFERENCES tenants(id) ON DELETE CASCADE,   -- NULL for platform alerts
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,        -- low_stock | late_invoice | margin_warning | …
  payload       JSONB,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, admin_user_id) = 1)
);
CREATE INDEX idx_notifications_user ON notifications (user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_admin ON notifications (admin_user_id) WHERE is_read = false;
```

**Why `admin_user_id` exists:** some alerts go to ChantierOS platform staff, not to a company — "new tenant signed up", "payment failed", "support ticket opened". A platform admin has no row in `users` and belongs to no tenant, so `user_id + tenant_id` alone cannot address them. Same pattern as `refresh_tokens`: two nullable columns, exactly one set.

```sql
CREATE TABLE portal_tokens (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,                 -- sha256; the raw token is never stored
  is_active  BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,                 -- now() + 90 days, a column not a constant
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- one ACTIVE link per project
CREATE UNIQUE INDEX idx_portal_one_active ON portal_tokens (project_id) WHERE is_active = true;

CREATE TABLE portal_tracking (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  portal_token_id INTEGER NOT NULL REFERENCES portal_tokens(id) ON DELETE CASCADE,
  event_type      portal_event_type NOT NULL,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The portal routes skip `AuthGuard` and `TenantGuard`. The token row is what supplies `tenant_id`: the validator middleware looks the hash up, then puts that row's `tenant_id` into `nestjs-cls` before any query runs. Without this step the Prisma extension would have no tenant and leak across companies.

```sql
CREATE TABLE conversations (
  id                SERIAL PRIMARY KEY,
  tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type              conversation_type NOT NULL,
  project_id        INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  support_ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
  is_archived       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_client_has_project
    CHECK (type <> 'project_client' OR project_id IS NOT NULL),
  CONSTRAINT chk_support_has_ticket
    CHECK (type <> 'support' OR support_ticket_id IS NOT NULL)
);
CREATE INDEX idx_conversations_tenant ON conversations (tenant_id);
-- a project has at most ONE client conversation: generating a new portal link reuses it
CREATE UNIQUE INDEX idx_one_client_conversation ON conversations (project_id)
  WHERE type = 'project_client';

CREATE TABLE conversation_members (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id       INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  admin_user_id   INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, client_id, admin_user_id) = 1)
);

CREATE TABLE messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- denormalized on purpose
  sender_type     sender_type NOT NULL,
  sender_id       INTEGER NOT NULL,     -- users.id | clients.id | admin_users.id, per sender_type
  content         TEXT NOT NULL,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

CREATE TABLE message_reads (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id  INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, client_id) = 1),
  UNIQUE (message_id, user_id, client_id)
);
```

**There is no `attachments` column on `messages`.** Every attachment is a `media` row with `entity_type = 'message'`. One mechanism for files in the whole app.

Conversations and messages are **archived, never deleted** — they carry `is_archived`, never `is_active`.

---

## 10. Views — raw SQL in the migration

Prisma does not manage views. All three carry `tenant_id`, and raw queries **must** filter by it: the Prisma extension cannot see inside `$queryRaw`.

```sql
CREATE VIEW material_stock_live AS
SELECT
  m.id        AS material_id,
  m.tenant_id,
  COALESCE(mv.on_hand, 0)  AS on_hand,
  COALESCE(rs.reserved, 0) AS reserved,
  COALESCE(mv.on_hand, 0) - COALESCE(rs.reserved, 0) AS available
FROM materials m
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS on_hand
  FROM stock_movements GROUP BY material_id
) mv ON mv.material_id = m.id
LEFT JOIN (
  SELECT material_id, SUM(remaining_quantity) AS reserved
  FROM stock_reservations WHERE status = 'active' GROUP BY material_id
) rs ON rs.material_id = m.id;
```

Low stock: `on_hand <= materials.minimum_stock`. Unmet reservation: `available < 0`.

```sql
CREATE VIEW invoice_balance AS
SELECT
  i.id AS invoice_id,
  i.tenant_id,
  i.amount_incl_vat,                               -- the STORED total, not recomputed from lines
  COALESCE(p.amount_paid, 0) AS amount_paid,
  i.amount_incl_vat - COALESCE(p.amount_paid, 0) AS balance_due,
  (i.due_date < CURRENT_DATE
   AND i.amount_incl_vat - COALESCE(p.amount_paid, 0) > 0
   AND i.status IN ('sent','partially_paid')) AS is_late
FROM invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount) AS amount_paid FROM payments GROUP BY invoice_id
) p ON p.invoice_id = i.id;
```

`is_late` is computed here, which is why `invoice_status` needs no `overdue`. A `sent` invoice and a `partially_paid` invoice can both be late; one stored status cannot hold both answers at once.

```sql
CREATE VIEW project_margin_live AS
SELECT
  p.id AS project_id,
  p.tenant_id,
  COALESCE(q.budget_excl_vat, 0) AS budget_excl_vat,
  COALESCE(mc.material_cost, 0)  AS material_cost,
  COALESCE(lc.labor_cost, 0)     AS labor_cost,
  COALESCE(bc.bill_cost, 0)      AS bill_cost,
  COALESCE(mc.material_cost,0) + COALESCE(lc.labor_cost,0) + COALESCE(bc.bill_cost,0)
    AS total_cost,
  COALESCE(q.budget_excl_vat,0)
    - (COALESCE(mc.material_cost,0) + COALESCE(lc.labor_cost,0) + COALESCE(bc.bill_cost,0))
    AS margin_excl_vat,
  CASE WHEN COALESCE(q.budget_excl_vat, 0) > 0 THEN
    round(((COALESCE(q.budget_excl_vat,0)
      - (COALESCE(mc.material_cost,0) + COALESCE(lc.labor_cost,0) + COALESCE(bc.bill_cost,0)))
      / q.budget_excl_vat) * 100, 2)
  END AS margin_pct                                -- NULL when there is no accepted quote yet
FROM projects p
LEFT JOIN (
  -- budget is the SUM of accepted quotes; projects has no budget column
  SELECT project_id, SUM(amount_excl_vat) AS budget_excl_vat
  FROM quotes WHERE status = 'accepted' GROUP BY project_id
) q ON q.project_id = p.id
LEFT JOIN (
  -- material cost: quantity is negative on consumption, so negate it. Uses the FROZEN unit_price
  SELECT project_id, SUM(-quantity * unit_price) AS material_cost
  FROM stock_movements WHERE type = 'consumption' GROUP BY project_id
) mc ON mc.project_id = p.id
LEFT JOIN (
  -- labor cost: uses the FROZEN hourly_rate on the row, never users.hourly_rate
  SELECT project_id, SUM(hours * hourly_rate) AS labor_cost
  FROM time_entries GROUP BY project_id
) lc ON lc.project_id = p.id
LEFT JOIN (
  -- every bill on this project EXCEPT material: those are already counted by the ledger above
  SELECT pi.project_id, SUM(pi.amount_excl_vat) AS bill_cost
  FROM purchase_invoices pi
  JOIN cost_types ct ON ct.id = pi.cost_type_id
  WHERE pi.project_id IS NOT NULL AND ct.name <> 'material'
  GROUP BY pi.project_id
) bc ON bc.project_id = p.id;
```

**Three doors, never four.** Materials enter through the stock ledger, hours through `time_entries`, and everything the company was billed for through `purchase_invoices` grouped by `cost_type_id`. The `ct.name <> 'material'` filter is belt-and-braces: the trigger in section 7 already makes a material bill projectless.

`bill_cost` counts a bill as soon as it is entered, **whatever its `status`** — a cost you owe is a cost. Paying it later changes nothing in the margin.

The breakdown screen groups `bill_cost` by `cost_type_id`, so a cost type a tenant adds later gets its own line with no code change.

### Alert thresholds

| Level | Condition | Fires |
|---|---|---|
| ⚠️ Warning | `total_cost >= 0.80 × budget_excl_vat` | once |
| 🔴 Critical | `total_cost >= 0.95 × budget_excl_vat` | once |

Dedup is `project_margin_alerts`. If an extra accepted quote raises the budget and the cost drops back under a threshold, delete the rows so the levels can fire again.

---

## 11. Deferred foreign keys

Five FKs point **forward** to a table created later in this file. Prisma orders its own DDL, so `prisma migrate` does not care — but if you run this SQL by hand, top to bottom, these five must come last or the script fails.

```sql
ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE feedback ADD CONSTRAINT fk_feedback_user
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE support_tickets ADD CONSTRAINT fk_ticket_opened_by
  FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_mvt_report
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL;

ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_mvt_purchase_invoice
  FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL;
```

---

## 12. Tables the Prisma extension must SKIP

The multi-tenancy extension injects `where: { tenant_id }` into every query and `data: { tenant_id }` into every create (see [notes/technical/build-order.md](notes/technical/build-order.md) § 1b). A table **without** a `tenant_id` column would make every such query throw `Unknown arg 'tenant_id'`.

**Every business table has `tenant_id`, including child tables.** Only the platform tables are skipped — they are shared by everyone or owned by nobody:

`tenants` · `admin_users` · `plans` · `plan_features` · `stripe_events` · `roles` · `refresh_tokens` · `one_time_codes`

That is the whole list. One rule, no exceptions to remember.

### Why child tables carry `tenant_id` too

`quote_lines`, `invoice_lines`, `task_assignees`, `project_closure_snapshot_costs`, `project_margin_alerts`, `portal_tracking`, `conversation_members` and `message_reads` are reached through a parent that is already tenant-scoped, so in theory the column is redundant. It is there anyway, for three reasons:

| | Without `tenant_id` | With `tenant_id` |
|---|---|---|
| The extension | Needs a skip list you must remember to maintain | Protects the table automatically |
| `prisma.quote_lines.findUnique({ where: { id } })` with an id from the URL | Returns another company's line. Silent leak | Filtered by the extension. Returns nothing |
| Filling the column on create | — | The extension does it, no service code |

The column costs 16 bytes a row and removes a whole class of bug. The skip list was the cheaper thing to write and the more expensive thing to live with.

### The composite foreign key

Three child tables go one step further. A plain `quote_id` FK proves the quote exists, not that it belongs to the same company. A composite FK proves both:

```sql
FOREIGN KEY (tenant_id, quote_id) REFERENCES quotes(tenant_id, id)
```

This needs `UNIQUE (tenant_id, id)` on the parent, which `quotes`, `invoices` and `tasks` now carry. The result: **a line whose `tenant_id` differs from its quote's `tenant_id` cannot be inserted at all.** Not blocked by a guard that someone might forget — blocked by the database.

`categories` and `cost_types` are the one remaining special case: they **have** `tenant_id`, but it is nullable, so they need `WHERE tenant_id IS NULL OR tenant_id = :current` through their own dedicated method, never the generic one.

---

## 13. Seed — runs once on first deploy

```sql
INSERT INTO roles (id, name, label) VALUES
  (1,'admin','Main Manager'), (2,'manager','Sub Manager'),
  (3,'site_supervisor','Site Supervisor'), (4,'team_leader','Team Leader'),
  (5,'worker','Worker'), (6,'sales','Sales'), (7,'accountant','Accountant');

INSERT INTO cost_types (tenant_id, name) VALUES
  (NULL,'material'), (NULL,'subcontractor'), (NULL,'labor');

INSERT INTO categories (tenant_id, name) VALUES
  (NULL,'Painting'), (NULL,'Tiling'), (NULL,'Plumbing'),
  (NULL,'Electricity'), (NULL,'Masonry'), (NULL,'Carpentry');
```

**Plans are never seeded** — the super-admin creates every plan as data, and must mark one `is_default` before signups work.

`categories` and `cost_types` must be read with `WHERE tenant_id IS NULL OR tenant_id = :current`. The generic tenant filter would hide the shared defaults, so these two tables go through their own dedicated method, never the generic one.

---

## 14. Not in v1

`hitl_queue`, `connectors` and `token_recharges` belong to the AI layer (phase 17). **They are not created in the first migration.** There is no AI billing dimension and no token balance on `tenants`.

---

## 15. What this schema fixes vs. the old app

| Problem found in testing | Fix |
|---|---|
| Quote/invoice created with no client, `NaN` totals | `client_id NOT NULL`; `total_excl_vat` is a DB `GENERATED` column |
| Project end date before start date | `chk_project_dates`, `chk_task_dates`, `chk_contract_dates` |
| Status changeable to anything | `project_status` enum + the transition matrix + `project_status_history` |
| "Completed" did nothing | `project_closure_snapshots`, written once on close, voided not deleted |
| Subcontractor not linked to a project | `subcontractor_contracts.project_id NOT NULL` |
| Subcontractor not editable, phone not validated | `updated_at` + a phone `CHECK` on `subcontractors` and `suppliers` |
| Catalogue and stock disconnected | `service_materials` recipe + `stock_reservations` |
| Stock was one mutable number | `stock_movements` append-only ledger + `material_stock_live` |
| Payments were a running total | `payments` ledger + `invoice_balance` view |
| Time entries not tied to an employee | `time_entries.user_id NOT NULL` + frozen `hourly_rate` |
| Tasks assignable to free text | `task_assignees.user_id` FK — a real account |
| No tenant isolation | `tenant_id NOT NULL` everywhere + composite uniques + the Prisma extension |

---

## Open questions — decide inside the phase, they do not block the migration

These are service-layer rules. The schema above supports either answer.

1. **Quote transitions.** There is no matrix like the one projects have. Can a `sent` quote go back to `draft` to fix a price? Does `valid_until` block acceptance once it has passed? Can an `accepted` quote be undone after the reservations were created? **Decided 2026-10-06** — `draft → sent`, `sent → draft/accepted/refused`, `accepted`/`refused` terminal; `valid_until` hard-blocks acceptance; undoing an accepted quote means cancelling the project, not a new transition. See `doc/notes/technical/phase-05-quotes-invoices.md`.
2. **Closing guard.** May a project become `completed` while invoices are unpaid or bills are still `to_pay`? And where does a bill that arrives *after* closure go — the snapshot is frozen. **Decided 2026-10-06** — never blocked by payment status; see `doc/notes/technical/phase-03-clients-projects.md` § "The closing guard". A late bill is still recorded (the live `project_margin_live` reflects it) but never retroactively changes the frozen snapshot; reopen/reclose (admin only) refreshes it.
3. **Cancelled projects get no snapshot.** Only `completed` writes one, so `project_margin_live` keeps computing a dead project forever. Decide whether cancellation also closes the numbers. **Decided 2026-10-06** — both `completed` and `cancelled` write a snapshot; `cancelled` is final, so its snapshot is never voided. See `doc/notes/technical/phase-08-margin-snapshot.md`.
4. **Overpayment.** `balance_due` goes negative — which status? And may a `payments` row be edited or deleted, re-opening a `paid` invoice? **Decided 2026-10-06** — no new status, `paid` already covers it; `payments` is append-only (same as `stock_movements`), a mistake gets a correcting row, and invoice status is recomputed from the ledger on every write. See `doc/notes/technical/phase-05-quotes-invoices.md`.
5. **Worker hour scope.** Assignee on any task of that *project*, or only on that *task*? And which rule applies when `time_entries.task_id` is `NULL`? **Decided 2026-10-06** — project-level: a worker may log on a project where they are an assignee on at least one task; `task_id` stays optional and the check is the same with or without it. See `doc/notes/planning-time-entries.md`.
6. **Platform admin cross-tenant read.** A support conversation is a business table, so the Prisma extension scopes it. The escape hatch for an `admin_user` needs a defined mechanism, and it must write to `audit_logs`.
7. **Delete / cascade on `media`.** It has no FK by design, so deleting a project leaves orphan rows. Decide whether a cleanup job sweeps them. **Decided 2026-10-06** — no sweep job; see `doc/notes/media-files.md`. Every entity type except `project` never hard-deletes at all, so none can orphan `media`. `project` gets the one exception — a real hard delete, `prospect`-status only — and its handler calls `MediaService.deleteAllForEntity()` synchronously first.
8. **Tenant created by the super-admin.** `POST /api/admin/tenants` writes the `tenants` row only. The notes describe the trial `tenant_subscriptions` row and the first `admin` user only for self-registration (step 02). Decide whether the super-admin route also creates them, or whether a tenant made this way stays empty until something else does.
9. **Payments cannot actually go negative.** Found during step 06's build (2026-10-06): the "Overpayment" decision above says a correction can be "a positive top-up or a negative correction" and can "naturally reopen `paid → partially_paid`," but `payments.amount` carries `CHECK (amount > 0)` (§ 6 above) — so `amount_paid` can only increase and `balance_due` can only fall, and a `paid` invoice can never reopen as built. Decide whether to relax the CHECK (a migration) or rewrite the overpayment rule to match what the constraint actually allows. See `doc/notes/technical/phase-05-quotes-invoices.md` § Overpayment and `doc/notes/test/10-quotes-invoices.md` § 4.

## Related notes

- [notes/naming-conventions.md](notes/naming-conventions.md) — names, enums, numeric types
- [notes/entity-fields.md](notes/entity-fields.md) — field meanings in plain English
- [notes/technical/build-order.md](notes/technical/build-order.md) — the build sequence
