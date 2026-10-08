# Phase 04 — Permissions & Isolation

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [roles-permissions.md](../roles-permissions.md).

## Goal

Every role gets exactly the access in the default matrix — no more, no less. Overrides stay inside one company. `scope = own` hides other people's rows. Company B never sees company A.

## Before you start

- A has one active user per role (phase 03). Log each one in once and keep 7 cookie files (`jar-admin.txt` … `jar-accountant.txt`), plus `jar-b-admin.txt`.
- Guards run **before** validation. So a request with an empty or wrong body tells us the guard's answer:
  - `403` → the role is **not** allowed
  - `400` (validation) or `404` (unknown id) → the role **is** allowed and the request reached the handler
- No data is written in section 1: the bodies are empty and the ids (`999999`) do not exist.

---

## 1. The full matrix — 7 roles × 16 modules

For each cell, send:

| Check | Request | Allowed means | Refused means |
|---|---|---|---|
| view | `GET` list route | `200` | `403` |
| create | `POST` create route, body `{}` | `400` | `403` |
| edit | `PATCH <route>/999999`, body `{}` | `404` or `400` | `403` |
| delete | `DELETE <route>/999999` | `404` | `403` |

### Route used per module

| Module | List / create | Edit / delete |
|---|---|---|
| `clients` | `/api/clients` | `/api/clients/999999` |
| `projects` | `/api/projects` | `/api/projects/999999` |
| `tasks` | `/api/tasks` | `/api/tasks/999999` |
| `time_entries` | `/api/time-entries` | `/api/time-entries/999999` |
| `catalogue` | `/api/services` | `/api/services/999999` |
| `stock` | `/api/materials` | `/api/materials/999999` |
| `quotes` | `/api/quotes` | `/api/quotes/999999` (edit only) |
| `invoices` | `/api/invoices` | — |
| `purchase_invoices` | `/api/purchase-invoices` | `/api/purchase-invoices/999999` (edit) |
| `margins` | `GET /api/margins` (view only — no write route exists) | — |
| `subcontractors` | `/api/subcontractors` | `/api/subcontractors/999999` |
| `reports` | `/api/reports` | `/api/reports/999999` (edit) |
| `media` | `GET /api/media`; create = `POST /api/media` multipart with no file | `PATCH /api/media/999999`; delete = `DELETE /api/media` `{ "ids": [999999] }` |
| `chat` | `/api/conversations` | — |
| `team` | `GET /api/users` | `PATCH /api/users/999999` (admin only) |
| `settings` | `GET /api/media/storage/usage`, `GET /api/billing/subscription` | — |

### Expected — view (`GET`)

`Y` = `200`, `-` = `403`, `own` = `200` but only the caller's rows (section 3).

| Module | admin | manager | supervisor | leader | worker | sales | accountant | Result |
|---|---|---|---|---|---|---|---|---|
| `clients` | Y | Y | Y | - | - | Y | Y | todo |
| `projects` | Y | Y | Y | Y | - | Y | Y | todo |
| `tasks` | Y | Y | Y | Y | own | - | - | todo |
| `time_entries` | Y | Y | Y | Y | own | - | - | todo |
| `catalogue` | Y | Y | Y | - | - | Y | - | todo |
| `stock` | Y | Y | Y | Y | - | - | Y | todo |
| `quotes` | Y | Y | - | - | - | Y | Y | todo |
| `invoices` | Y | - | - | - | - | Y | Y | todo |
| `purchase_invoices` | Y | - | - | - | - | - | Y | todo |
| `margins` | Y | Y | - | - | - | - | Y | todo |
| `subcontractors` | Y | Y | Y | - | - | - | Y | todo |
| `reports` | Y | Y | Y | Y | own | - | - | todo |
| `media` | Y | Y | Y | Y | own | Y | Y | todo |
| `chat` | Y | Y | Y | Y | own | Y | Y | todo |
| `team` | Y | Y | - | - | - | - | - | todo |
| `settings` | Y | - | - | - | - | - | - | todo |

### Expected — create / edit / delete

`Y` = passes the guard on all three, `-` = `403` on all three.

| Module | admin | manager | supervisor | leader | worker | sales | accountant | Result |
|---|---|---|---|---|---|---|---|---|
| `clients` | Y | Y | - | - | - | Y | - | todo |
| `projects` | Y | Y | Y | - | - | - | - | todo |
| `tasks` | Y | Y | Y | Y | - (1) | - | - | todo |
| `time_entries` | Y | Y | Y | Y | own (2) | - | - | todo |
| `catalogue` | Y | Y | - | - | - | - | - | todo |
| `stock` | Y | Y | - | - | - | - | - | todo |
| `quotes` | Y | Y | - | - | - | Y | - | todo |
| `invoices` | Y | - | - | - | - | - | Y | todo |
| `purchase_invoices` | Y | - | - | - | - | - | Y | todo |
| `subcontractors` | Y | Y | - | - | - | - | - | todo |
| `reports` | Y | Y | Y | Y | - (3) | - | - | todo |
| `media` | Y | Y | Y | Y | own | - | - | todo |
| `chat` | Y | Y | Y | Y | own | Y | Y | todo |

1. A worker reads only their own tasks and never writes one (`403`).
2. A worker may create and edit their **own** time entries (same-day rule, phase 10); delete → `403`.
3. A worker is refused inside the handler: `403 ...can only log hours`.

### Admin-only routes (`@Roles('admin')`)

| Route | Only admin passes | Result |
|---|---|---|
| `POST /api/invitations`, `PATCH /api/users/:id`, `POST /api/users/:id/pin` | every other role → `403 Insufficient role` | todo |
| `POST/PATCH/DELETE /api/categories`, `POST/PATCH /api/cost-types` | every other role → `403` | todo |
| `PUT/DELETE /api/roles/:roleId/permissions/:module` | every other role → `403` | todo |
| `POST /api/billing/change-plan` | every other role → `403` | todo |
| `POST /api/media/tenant-logo` (`settings`) | manager → `403` | todo |
| `POST /api/stock/adjustment` | admin + manager pass, all others `403` | todo |
| `POST /api/support/tickets` | admin only — manager `403` | todo |

---

## 2. Overrides stay inside one company

| ID | Do | Expected | Result |
|---|---|---|---|
| OVR-01 | `GET /api/roles` | 7 roles, ids 1–7 | todo |
| OVR-02 | `GET /api/roles/permissions` | 7 × 16 = 112 rows, equal to the tables above | todo |
| OVR-03 | A owner: `PUT /api/roles/2/permissions/invoices` `{ can_view: true, can_create: false, can_edit: false, can_delete: false, scope: "all" }` | `200`; A's manager `GET /api/invoices` → `200` now | todo |
| OVR-04 | B owner: `GET /api/roles/permissions` | B's manager still has **no** invoices access | todo |
| OVR-05 | A owner overrides `worker` / `projects` to `can_view: true, scope: "own"` | the worker can now `GET /api/projects` | todo |
| OVR-06 | `DELETE` both overrides | back to the defaults: manager `403` on invoices, worker `403` on projects | todo |
| OVR-07 | Body with a bad `scope` (`"team"`) or a module that does not exist | `400` | todo |

## 3. `scope = own`

Needs data from later phases. Re-run this section at the end of phase 11.

| ID | Do | Expected | Result |
|---|---|---|---|
| OWN-01 | Worker `GET /api/auth/me` | `tasks`, `time_entries`, `reports`, `media`, `chat` have `scope: "own"`; for admin/manager they are `"all"` | todo |
| OWN-02 | Worker `GET /api/tasks` | only tasks they are assigned to; another task by id → `404` | todo |
| OWN-03 | Worker `GET /api/time-entries?user_id=<worker 2>` | still only their own rows | todo |
| OWN-04 | Worker `GET /api/media` | only files they uploaded; admin sees all | todo |
| OWN-05 | Worker `GET /api/conversations` | only threads they are a member of | todo |

## 4. Company isolation (A vs B)

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-01 | A and B: `GET /api/users` | A `total 9` (8 + the deactivated spare), B `total 1`; every row carries its own `tenant_id` | todo |
| ISO-02 | B owner: `GET`, `PATCH`, `DELETE`, `POST .../pin` on an A user | `404 User not found` each; the A user unchanged in the DB | todo |
| ISO-03 | B owner: `GET /api/invitations` | none of A's invitations; deleting one of A's by id → `404` | todo |
| ISO-04 | `tenant_id` sent in any body or query | `400 property tenant_id should not exist` | todo |
| ISO-05 | Every later phase has its own isolation check | listed as `ISO-*` in each phase file | todo |
| ISO-06 | `yarn test:e2e` (phase 01 AUTO-02) | the 44-table isolation loop passes | todo |

## 5. Platform admin roles

| ID | Do | Expected | Result |
|---|---|---|---|
| PLR-01 | Staff admin: `GET /admin/tenants`, `/admin/plans`, `/admin/subscriptions` | `200` | todo |
| PLR-02 | Staff admin: `/admin/admin-users`, `/admin/audit-logs`, `POST /admin/plans`, `PATCH /admin/tenants/:id/status` | `403 Not allowed for your admin role` | todo |
