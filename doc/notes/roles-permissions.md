# ChantierOS — Roles & Permissions

> Status: v1 (working draft). See [[business-logic-overview]] for the full picture.

## Two separate user tables — never mix

| Table | Who | Scope |
|---|---|---|
| `admin_users` | ChantierOS platform staff | Full platform — all companies |
| `users` | Everyone inside a company | Scoped by `tenant_id` — own company only |

### Billing right of a platform admin (decided 2026-10-09)

- Two platform roles: `super_admin` and `staff`.
- **Changing plans and billing** (create / deactivate / set default / new version of a plan, set a company's pending plan, run a renewal) is **`super_admin` only by default**.
- A `super_admin` can give this right to one `staff` admin: `admin_users.can_manage_billing` (default `false`), set with `PATCH /api/admin/admin-users/:id`. It is read from the database on every call, so taking it away works at once.
- **Reading** plans, subscriptions and usage stays open to every platform admin.

### Suspending a company (decided 2026-10-09)

- **Suspending, reactivating, deleting or restoring a company** (`PATCH /api/admin/tenants/:id/status`, `DELETE /api/admin/tenants` and `/:id`, `PATCH /api/admin/tenants/restore` and `/:id/restore`) is **`super_admin` only by default**.
- A `super_admin` can give this right to one `staff` admin: `admin_users.can_manage_tenants` (default `false`), set with `PATCH /api/admin/admin-users/:id`. Same rule as the billing right: read from the database on every call.
- Reading, creating and editing company details, and the verification email, stay open to every platform admin.

---

## The `roles` table (v1)

Roles are **not a hardcoded enum** — they live in a `roles` table, inserted once via a seed file on first deploy. Only the platform Admin can add or deactivate roles.

Tenants use the 7 fixed roles. Fine-grained access overrides are handled via `role_permissions` — no custom role creation needed.

### The 7 roles

| id | name | label | active |
|---|---|---|---|
| 1 | admin | Main Manager | true |
| 2 | manager | Sub Manager | true |
| 3 | site_supervisor | Site Supervisor | true |
| 4 | team_leader | Team Leader | true |
| 5 | worker | Worker | true |
| 6 | sales | Sales | true |
| 7 | accountant | Accountant | true |

---

## Mobile vs Dashboard

| Access | Roles |
|---|---|
| Dashboard (full app) | `admin`, `manager`, `site_supervisor`, `team_leader`, `sales`, `accountant` |
| Mobile only | `worker` — sees only: my tasks + log my hours |

**There is no native mobile app.** "Mobile" means the responsive website opened on a phone. The `/api/mobile/*` routes (PIN login, my tasks, my hours) serve the worker's phone screens of that website — the **Field** area (`/field/...`) of the frontend.

---

## Default permissions per role

`full` = view + create + edit + delete
`view` = read only
`own` = create / edit / delete, but only their own data
`own (view)` = read only, and only their own data
`—` = no access

`module` is a fixed enum — these keys are the only valid values, used by `@Module()` and `PermissionGuard`.

| `module` key | admin | manager | site_supervisor | team_leader | worker | sales | accountant |
|---|---|---|---|---|---|---|---|
| `clients` | full | full | view | — | — | full | view |
| `projects` | full | full | full | view | — | view | view |
| `tasks` | full | full | full | full | own (view) | — | — |
| `time_entries` | full | full | full | full | own hours | — | — |
| `catalogue` | full | full | view | — | — | view | — |
| `stock` | full | full | view | view | — | — | view |
| `quotes` | full | full | — | — | — | full | view |
| `invoices` | full | — | — | — | — | view | full |
| `purchase_invoices` | full | — | — | — | — | — | full |
| `margins` | full | full | — | — | — | — | full |
| `subcontractors` | full | full | view | — | — | — | view |
| `reports` | full | full | full | full | own (view) | — | — |
| `media` | full | full | full | full | own uploads | view | view |
| `chat` | full | full | full | full | own threads | full | full |
| `team` | full | view | — | — | — | — | — |
| `settings` | full | — | — | — | — | — | — |
| `analytics` | view | — | — | — | — | — | view |
| `contacts` | view | view | — | — | — | — | — |
| `notes` | own | own | own | own | own | own | own |
| `email` | full | full | — | — | — | full | — |
| `email_gmail` | full | — | — | — | — | — | — |

---

## `role_permissions` — tenant-level overrides

The table above is the **default** for every tenant. A tenant admin can override specific permissions for their company using `role_permissions`.

Example: by default `manager` has no access to invoices. Tenant A wants their manager to see invoices → add one row to `role_permissions`:

| tenant_id | role_id | module | can_view | can_create | can_edit | can_delete | scope |
|---|---|---|---|---|---|---|---|
| T1 | 2 (manager) | `invoices` | true | false | false | false | `all` |

`UNIQUE (tenant_id, role_id, module)`.

`role_permissions` stores **only overrides**. The default matrix above lives in code, not in the database — nothing is seeded per tenant. `PermissionGuard` reads the default for the role, then applies an override row if one exists for that tenant + role + module.

This does not affect any other tenant — scoped by `tenant_id`.

### Why there is a `scope` column

The matrix above has **three** levels, not two: `full`, `view`, and **`own`**. `own` means *"yes he can see it, but only his own rows"* — a `worker` sees his own tasks and reports (read only) and logs his own hours, never the team's. Decided 2026-10-09: a worker cannot create or edit a task or a site report.

Four booleans cannot say that. `can_view = true` alone would show him everything. So one more column carries it:

| `scope` | Meaning |
|---|---|
| `all` | Every row in the tenant (the default) |
| `own` | Only rows belonging to the current user |

When `scope = 'own'`, `PermissionGuard` adds `WHERE user_id = :current` to the query. Without this column the `worker` defaults are not expressible, and a tenant could never override a role down to "own data only".

---

## Who manages the team

Only `admin` can:
- Add / deactivate users
- Change a user's role
- Set or update an employee's `hourly_rate` (hourly rate)
- Configure `role_permissions` overrides

## Company profile — the tenant edits its own data

| Route | Who | Does |
|---|---|---|
| `GET /api/tenant` | every logged-in user of the tenant | the company profile + logo URL. The app shows the company name and logo in its sidebar, so every user needs it. |
| `PATCH /api/tenant` | `settings` module, `can_edit` (by default only `admin`) | edits the profile. Writes `audit_logs` with the old and new values. |

The tenant comes from the JWT, never the URL. The logo still uses `POST /api/media/tenant-logo`.

**Editable:** `name`, `legal_name`, `vat_number`, `registration_number`, `phone`, `address_line1`, `address_line2`, `postal_code`, `city`, `country`, `iban`, `bic`, `default_vat_rate`, `default_payment_days`, `locale`, `timezone`, `end_of_day_reminder_time`.

**Not editable here:** `status`, `deleted_at`, `email_verified_at` (platform admin only). `email` and `currency` are **not editable by the tenant**. The email is the one given at registration; the currency is EUR. Both are fixed by the backend.

---

## `users` table — key fields

| Field | Meaning |
|---|---|
| `tenant_id` | Which company (required) |
| `name` | Full name |
| `email` | Login email — `UNIQUE` across the whole app, so one email belongs to one company. `NULL` only for a `worker` added without email ([[auth-tokens]] § 2b) |
| `login_code` | 8 digits, `UNIQUE` app-wide — phone login of a worker with no email. `NULL` otherwise |
| `must_change_password` | `true` after the admin created the user with a temporary password; the user must choose their own |
| `phone` | Phone |
| `password_hash` | For dashboard login |
| `mobile_pin_hash` | Short PIN for mobile login (`worker`), hashed with argon2id |
| `role_id` | FK → `roles.id` |
| `hourly_rate` | Hourly rate — used for margin calculation |
| `is_active` | Deactivated users can't log in but their history is kept |

---

## Related notes
- [[business-logic-overview]]
- [[planning-time-entries]]
- [[margin-profitability]]
- [[alerts]]
