# Step 08 — Planning & Time Entries  *(phase 07)*

> The Gantt schedule and the hours that feed labour cost.

## Goal

Tasks with multiple assignees, daily hour logging with a frozen rate, and the same-day total rule.

## Decide first

**1 open question — worker hour scope.** Two notes disagree:

- [technical/phase-07](../technical/phase-07-planning-time-entries.md) — assignee on **any task of that project**
- [planning-time-entries.md](../planning-time-entries.md) — blocked on a **task** not assigned to them

And `time_entries.task_id` is optional, so decide which rule applies when it is `NULL`.

**Recommendation:** project-level. A worker may log hours on a project where they are an assignee on at least one task, with `task_id` optional. Task-level is too strict — real work spills across tasks. Write the decision into both notes and tick it off in [A_progress-tracker.md](../A_progress-tracker.md).

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 5.

| Table | Purpose |
|---|---|
| `tasks` | the Gantt rows |
| `task_assignees` | one row per employee on a task. `tenant_id` + composite FK |
| `time_entries` | one row per employee per day per project. `hourly_rate` **frozen** |

```
tasks (the SCHEDULE — what is planned)
  │
  ├── task_assignees (WHO works on it)
  │
  ▼ feeds
time_entries (the REALITY — hours actually logged)
```

### `hourly_rate` is frozen on the row

Copied from `users.hourly_rate` when the entry is saved. The tenant can change a salary any time; past rows never shift, so past margins stay accurate. Same pattern as `stock_movements.unit_price`.

### One task, many workers

A demolition task with five workers is **one** `tasks` row and five `task_assignees` rows — one bar on the Gantt chart, not five. `UNIQUE (task_id, user_id)`. A task needs at least one assignee before its status can leave `planned`.

An assignee must be a **real `users` account**, never a typed name, because that account logs the hours later.

### `time_entries` is not a ledger

`UNIQUE (user_id, project_id, work_date)`. An hour entry has one right answer per employee per day per project, so the row itself is corrected and the old value goes to `audit_logs`. A correction row would break the same-day total check.

Stock is different — a consumption really happened and cannot be un-happened.

## Modules to create

```
src/
├── tasks/
│   ├── dto/create-task.dto.ts, update-task.dto.ts, set-assignees.dto.ts,
│   │       find-tasks-query.dto.ts
│   ├── handlers/create-task.handler.ts, find-tasks.handler.ts, find-task.handler.ts,
│   │            update-task.handler.ts, set-status.handler.ts, set-assignees.handler.ts,
│   │            delete-task.handler.ts, my-tasks.handler.ts
│   ├── repositories/task.repository.ts        (tasks + task_assignees)
│   └── tasks.service.ts / .controller.ts / .module.ts
└── time-entries/
    ├── dto/create-time-entry.dto.ts, update-time-entry.dto.ts, find-time-entries-query.dto.ts
    ├── handlers/create-time-entry.handler.ts, find-time-entries.handler.ts,
    │            update-time-entry.handler.ts, delete-time-entry.handler.ts,
    │            my-entries.handler.ts, project-labour-cost.handler.ts
    ├── helpers/daily-hours.helper.ts          ← the same-day total rule, once
    ├── repositories/time-entry.repository.ts
    └── time-entries.service.ts / .controller.ts / .module.ts
```

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/tasks` | `tasks:create` | |
| `GET` | `/api/tasks` | `tasks:view` | `?project_id=&status=&from=&to=` — the Gantt feed |
| `GET` | `/api/tasks/:id` | `tasks:view` | with assignees |
| `PATCH` | `/api/tasks/:id` | `tasks:edit` | |
| `PATCH` | `/api/tasks/:id/status` | `tasks:edit` | needs ≥ 1 assignee to leave `planned` |
| `PUT` | `/api/tasks/:id/assignees` | `tasks:edit` | replaces the set |
| `DELETE` | `/api/tasks/:id` | `tasks:delete` | |
| `GET` | `/api/mobile/my-tasks` | `AuthGuard` | the `worker` screen — own tasks only |
| `POST` | `/api/time-entries` | `time_entries:create` | |
| `GET` | `/api/time-entries` | `time_entries:view` | `?user_id=&project_id=&from=&to=` |
| `PATCH` | `/api/time-entries/:id` | `time_entries:edit` | the correction rules below |
| `DELETE` | `/api/time-entries/:id` | `time_entries:delete` | manager / admin only |
| `GET` | `/api/mobile/my-entries` | `AuthGuard` | own entries |
| `POST` | `/api/mobile/time-entries` | `AuthGuard` | the worker logs from site |
| `GET` | `/api/projects/:id/labour-cost` | `margins:view` | `SUM(hours × hourly_rate)` |

`tasks:view` and `time_entries:view` with `scope = 'own'` (the `worker` default) filter to that user. The `/api/mobile/*` routes are convenience wrappers over the same handlers.

## DTOs

### `create-task.dto.ts`
`project_id` `@IsInt` required. `title` required. `type` `@IsIn(['meeting','work'])`. `start_date`, `end_date` required ISO dates — **end not before start**. `assignee_ids` — array of integer, optional at creation.

### `set-assignees.dto.ts`
`user_ids` — array of integer, `@ArrayMinSize(1)`. Each must be an **active** user of this tenant.

### `create-time-entry.dto.ts`
`project_id` `@IsInt` required. `user_id` optional integer — a manager logging for someone else; defaults to the caller. `task_id` optional integer. `work_date` required ISO **date** (no time part). `hours` `@IsNumberString`, `> 0` and `<= 24`. `comment` optional.

## Repository methods

```ts
// task.repository.ts
create(data, assigneeIds, tx), findById(id), findMany(where, skip, take),
update(id, data), setStatus(id, status), delete(id)
findAssignees(taskId), replaceAssignees(taskId, userIds, tx), countAssignees(taskId)
findByAssignee(userId, where), isAssignedToProject(userId, projectId): Promise<boolean>

// time-entry.repository.ts
create(data), findById(id), findMany(where, skip, take), update(id, data), delete(id)
sumHoursForUserOnDate(userId, workDate, excludeId?): Promise<Decimal>
findByUserProjectDate(userId, projectId, workDate)
sumLabourCostByProject(projectId): Promise<Decimal>
findProjectsWithNoEntriesSince(days)        // the stalled-project alert, step 13
```

`sumHoursForUserOnDate` takes `excludeId` so an **update** does not count the row being edited against itself.

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-task.handler` | `end_date` not before `start_date`. Assignees must be active users of this tenant. Project not `cancelled` |
| `set-status.handler` | leaving `planned` requires **≥ 1 assignee** |
| `set-assignees.handler` | replaces the set in one transaction. At least one. `UNIQUE (task_id, user_id)` stops duplicates |
| `create-time-entry.handler` | **the day rule** below. Freezes `hourly_rate` from `users.hourly_rate` **now**. A worker may only log on a project where they are assigned (the decision above). `UNIQUE (user_id, project_id, work_date)` — a second row for the same day and project is an update, not an insert |
| `update-time-entry.handler` | the employee may edit **their own** entry **on the same day only**, and only if nobody else touched it. After that it is read-only to them. A manager or admin may edit or delete any entry of their team, any time. The old value goes to `audit_logs` |
| `project-labour-cost.handler` | `SUM(hours × hourly_rate)` using the **frozen** rate. Never `users.hourly_rate` |

### The daily hours rule — `daily-hours.helper.ts`

A per-row `hours <= 24` check is not enough: 20h on project A plus 20h on project B both pass it. The rule sums **all** of that employee's rows for the same `work_date`, across **every** project.

| Same-day total, all projects | Action |
|---|---|
| up to 12h | saved normally |
| over 12h | saved **+ abnormal-hours alert** to the manager |
| over 24h | **rejected** — physically impossible |

```sql
SELECT SUM(hours) FROM time_entries WHERE user_id = :u AND work_date = :d;
```

Runs on insert **and** update, excluding the row being edited. Build it in the service layer first — it ships fast and gives the employee a clear message. A DB trigger can follow later as a safety net, so the rule holds whatever inserts the row.

### One employee, many projects — already supported

Nothing ties a `user_id` to one project. No new table needed. Each project pays only for its own hours.

## Tasks

- [ ] `tasks` module + `task_assignees`
- [ ] `set-status` requires ≥ 1 assignee
- [ ] Gantt list endpoint with a date range
- [ ] `/api/mobile/my-tasks`
- [ ] `time-entries` module
- [ ] `daily-hours.helper.ts` — reject > 24h, alert > 12h, across all projects
- [ ] The rule runs on **update** too, excluding the edited row
- [ ] Freeze `hourly_rate` at write time
- [ ] Correction rules: same-day self-edit, manager any time, old value to `audit_logs`
- [ ] `/api/mobile/time-entries` for the worker
- [ ] `labour-cost` endpoint for step 10
- [ ] Project-assignment check on worker logging (the decision above)
- [ ] `// TODO: step 13` at the abnormal-hours, missing-timesheet and stalled-project points
- [ ] Decide the worker scope question and write it into both notes

## Acceptance

- [ ] Create a task with 5 assignees → **one** `tasks` row, 5 `task_assignees` rows
- [ ] Add the same user twice → rejected
- [ ] Move a task with no assignees to `in_progress` → refused
- [ ] `end_date` before `start_date` → rejected by the database
- [ ] Log 8h → saved, `hourly_rate` copied from the user
- [ ] Change `users.hourly_rate` → the old entry keeps the old rate
- [ ] Log 5h on project A and 3h on project B, same day → both saved, total 8h
- [ ] Log 7h on A then 6h on B (13h) → saved **and** an abnormal-hours alert fires
- [ ] Log 20h on A then 20h on B → the second is **rejected**
- [ ] Edit an entry from 8h to 20h when another project already has 10h that day → rejected, and the edited row is not counted twice
- [ ] A worker edits their own entry the same day → allowed. Next day → refused
- [ ] A manager edits a week-old entry → allowed, old value in `audit_logs`
- [ ] A worker logs hours on a project where they have no task → refused
- [ ] A second entry for the same user, project and day → updates, no duplicate row
- [ ] `labour-cost` uses the frozen rates, not the current ones
- [ ] A worker calling `GET /api/time-entries` sees **only their own**
- [ ] Tenant A cannot see tenant B's tasks or entries
- [ ] Update `../WhereIStop/state.md`

## Notes to read

- [planning-time-entries.md](../planning-time-entries.md) — the 3 tables, the day rule, the worked margin example
- [roles-permissions.md](../roles-permissions.md) — who may log for whom
- [technical/phase-07-planning-time-entries.md](../technical/phase-07-planning-time-entries.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 5
