# Step 04 — Clients & Projects  *(phase 03)*

> The first real business domain. Everything after this hangs off a project.

## Goal

Client cards, projects, and the status transition rules — enforced in the service, not hoped for in the UI.

## Decide first

**Decided 2026-10-06 — the closing guard.** `in_progress → completed` is never blocked by payment status — unpaid invoices or `to_pay` purchase bills do not prevent closing. A cost that arrives after closure is still recorded (shows up in the live `project_margin_live`) but never retroactively changes the frozen `project_closure_snapshots` row — admin reopen/reclose refreshes it. Full writeup in [technical/phase-03-clients-projects.md](../technical/phase-03-clients-projects.md) § "The closing guard"; ticked off in [A_progress-tracker.md](../A_progress-tracker.md).

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 3.

| Table | Purpose |
|---|---|
| `clients` | who pays. `UNIQUE (tenant_id, email)` |
| `projects` | one job. **No `budget` and no `progress_pct` column** |
| `project_status_history` | every status change, with who and why |

**What `projects` deliberately does not store:**

| Not a column | Where it comes from |
|---|---|
| Budget | `SUM(quotes.amount_excl_vat)` where `status = 'accepted'`, in `project_margin_live` (step 10) |
| Progress % | `progress_pct` of the newest `reports` row (step 09) |
| Real cost, margin | `project_margin_live` (step 10) |

Do not add these columns "for convenience". A stored total drifts from the ledger.

## Modules to create

```
src/
├── clients/
│   ├── decorators/clients.swagger.ts
│   ├── dto/create-client.dto.ts, update-client.dto.ts, find-clients-query.dto.ts
│   ├── entities/client.entity.ts
│   ├── handlers/create-client.handler.ts, find-clients.handler.ts, find-client.handler.ts,
│   │            update-client.handler.ts, archive-client.handler.ts
│   ├── helpers/clients.helper.ts
│   ├── repositories/client.repository.ts
│   └── clients.service.ts / .controller.ts / .module.ts
└── projects/
    ├── dto/create-project.dto.ts, update-project.dto.ts, find-projects-query.dto.ts,
    │       change-status.dto.ts
    ├── handlers/create-project.handler.ts, find-projects.handler.ts, find-project.handler.ts,
    │            update-project.handler.ts, change-status.handler.ts, cancel-project.handler.ts,
    │            delete-project.handler.ts
    ├── helpers/project-status.helper.ts     ← the transition matrix lives here, once
    ├── repositories/project.repository.ts, project-status-history.repository.ts
    └── projects.service.ts / .controller.ts / .module.ts
```

`project-status-history` is a second repository inside `projects` because it is the same domain but a genuinely separate write path. This is the one allowed exception to "one repository per module" in this step.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/clients` | `clients:create` | |
| `GET` | `/api/clients` | `clients:view` | `?search=` on name, email, phone |
| `GET` | `/api/clients/:id` | `clients:view` | |
| `GET` | `/api/clients/:id/projects` | `clients:view` | that client's projects |
| `PATCH` | `/api/clients/:id` | `clients:edit` | |
| `DELETE` | `/api/clients/:id` | `clients:delete` | `is_active = false`, archived not deleted |
| `POST` | `/api/projects` | `projects:create` | starts at `prospect` |
| `GET` | `/api/projects` | `projects:view` | `?status=&client_id=&search=` |
| `GET` | `/api/projects/:id` | `projects:view` | |
| `PATCH` | `/api/projects/:id` | `projects:edit` | not the status |
| `PATCH` | `/api/projects/:id/status` | `projects:edit` | **goes through the matrix** |
| `GET` | `/api/projects/:id/history` | `projects:view` | `project_status_history` |
| `DELETE` | `/api/projects/:id` | `projects:delete` | **hard delete, `prospect`-status only.** Any other status → `400`. Decided in [media-files.md](../media-files.md) § cascade cleanup |

Status changes get their own route on purpose. A generic `PATCH` that accepts `status` would bypass the matrix — that was one of the bugs found in testing.

## DTOs

### `create-client.dto.ts`
`type` `@IsIn(['individual','professional','property_manager'])`. `name` required. `email` **required** `@IsEmail`. `phone` **required**, `@Matches` the format. `vat_number` **required when `type = 'professional'`** — use a custom validator or check it in the handler. `contact_name`, `phone_secondary`, address fields, `country` `@Length(2,2)`, `note` optional.

### `create-project.dto.ts`
`client_id` `@IsInt` required. `name` required. `description`, address fields optional. `start_date`, `end_date` optional ISO dates — **`end_date` not before `start_date`**. `manager_id` optional integer.

### `change-status.dto.ts`
`status` `@IsIn(['prospect','in_progress','completed','cancelled'])`. `reason` optional — stored on the history row.

## Repository methods

```ts
// client.repository.ts
create(data), findById(id), findByEmail(email), findMany(where, skip, take),
update(id, data), setActive(id, isActive), countActive()        // step 14 billing

// project.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data),
setStatus(id, status, actualEndDate?), countByClient(clientId)

// project-status-history.repository.ts
write(entry), findByProject(projectId)
```

`countActive()` on clients is the `max_clients` billing dimension — step 14 calls it through the clients **service**, never the repository.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-client.handler` | `email` unique within the tenant. `vat_number` required for `professional`. Phone format |
| `archive-client.handler` | `is_active = false`. **Never a hard delete** — invoices and projects point at it |
| `create-project.handler` | status starts at `prospect`. `client_id` must be an **active** client of this tenant. Writes the first `project_status_history` row with `from_status = NULL` |
| `change-status.handler` | the matrix below. Any other move is refused. Always writes a history row. Sets `actual_end_date` when moving to `completed` |
| `cancel-project.handler` | releases unused `stock_reservations` (step 05 wires this), then fires the alert *"don't forget to invoice the client for completed work"* (step 13 wires this) |
| `delete-project.handler` | **refused unless `status = 'prospect'`.** Calls `MediaService.deleteAllForEntity('project', id)` first (ImageKit + `media` rows gone), then deletes the `projects` row. `projects` module imports `MediaModule`, calls it through the media **service**, never its repository |

### The transition matrix — `project-status.helper.ts`

```
prospect     → in_progress, cancelled
in_progress  → completed, cancelled
completed    → in_progress   (admin only — VOIDS the closure snapshot)
cancelled    → nothing       (final)
```

| Rule | Why |
|---|---|
| `cancelled` is final | A client who comes back gets a **new** project. Reopening would mix two stories in one margin |
| `completed` reopens, admin only | Closing by mistake must be fixable. The reopen sets `voided_at` on the snapshot — it **never deletes** it |
| A quote can only be accepted on a `prospect` or `in_progress` project | Accepting on a closed project would change a budget already frozen in a snapshot |

The matrix is one constant in one helper. Step 06 (quote acceptance) and step 10 (closure) both call it. Do not re-implement it.

### Cross-step wiring left open on purpose

| Trigger | Built at |
|---|---|
| Quote accepted → project `in_progress` | step 06, calls `change-status` |
| Project cancelled → release reservations | step 05 provides the method, step 04 calls it |
| Project cancelled → alert | step 13 |
| Project `completed` → write snapshot | step 10 |

Leave a `// TODO: step NN` at each point, then come back. Do not stub a fake implementation.

## Tasks

- [x] `clients` module, full shape
- [x] `vat_number` required for `professional` — handler check **and** the DB constraint
- [x] `projects` module, full shape
- [x] `project-status.helper.ts` — the matrix as one exported constant + a `canTransition()` function
- [x] `change-status` route, separate from the generic `PATCH`
- [x] `project_status_history` written on **every** change, including creation
- [x] DB checks confirmed live: `chk_project_dates`, `chk_professional_has_vat`
- [x] `GET /api/clients/:id/projects` and `GET /api/projects/:id/history`
- [x] `// TODO: step NN` markers at the 4 wiring points above
- [x] Decide the closing guard — done, see *Decide first* above. Implement `in_progress → completed` with no payment-status check (just the matrix + history write, same as any other transition)
- [x] `delete-project.handler` — `prospect`-only hard delete, calls `MediaService.deleteAllForEntity` first. Requires step 03's `media` module (`deleteAllForEntity`) to already exist

## Acceptance

Run live 2026-10-06 against a real running app (`PORT=5391 node dist/main`), real logins (`admin@dupont.test`, `manager@dupont.test`, `sales@dupont.test`, `admin@verhelst.test`). Test data cleaned up afterward. Scenarios in [../test/08-clients-projects.md](../test/08-clients-projects.md).

- [x] Create a client of type `professional` with no `vat_number` → rejected
- [x] Two clients, same email, same tenant → rejected. Different tenant → allowed
- [x] `DELETE /api/clients/:id` → `is_active = false`, the row still exists
- [x] Create a project → status `prospect`, one history row with `from_status = NULL`
- [x] `end_date` before `start_date` → rejected (handler-level 400; the DB's `chk_project_dates` confirmed live separately during the build)
- [x] `prospect → completed` → **refused** (not in the matrix)
- [x] `prospect → in_progress` → allowed, history row written
- [x] `cancelled → in_progress` → refused, whoever asks
- [x] `completed → in_progress` as a non-admin → refused (`403`); as admin → allowed
- [x] Generic `PATCH /api/projects/:id` with a `status` field → refused outright (`400`, whitelist validation) — stricter than merely "unchanged"
- [x] `projects` has no budget or progress column
- [x] `DELETE /api/projects/:id` on a `prospect` project with 2 uploaded files → project **and** its media gone from ImageKit and the database (confirmed via direct DB query, not just the API)
- [x] `DELETE /api/projects/:id` on an `in_progress`/`completed`/`cancelled` project → refused, project and its media untouched
- [x] A `sales` user can create a client but only **view** projects
- [x] Tenant A cannot see tenant B's clients or projects
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [entity-fields.md](../entity-fields.md) — `clients` and `projects` fields, the DB checks
- [business-logic-overview.md](../business-logic-overview.md) — where a project sits in the flow
- [technical/phase-03-clients-projects.md](../technical/phase-03-clients-projects.md) — the matrix
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 3
