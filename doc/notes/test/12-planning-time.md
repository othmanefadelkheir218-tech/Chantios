# Tests — Planning & Time Entries

> Routes: `/api/tasks`, `/api/mobile/my-tasks`, `/api/time-entries`, `/api/mobile/my-entries`, `/api/mobile/time-entries`, `/api/projects/:id/labour-cost`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [planning-time-entries.md](../planning-time-entries.md), [roles-permissions.md](../roles-permissions.md), the step file [Phaces/08-planning-time.md](../Phaces/08-planning-time.md).

## Before you start

- **Guards:** every route carries `@TenantAuth()` + `@Module('tasks')`, `@Module('time_entries')` or (labour cost) `@Module('margins')`. `admin`, `manager`, `supervisor`, `leader` = full on `tasks` and `time_entries`. `worker` = scope **own**. `sales` and `accountant` = none (`403`). `margins`: `admin`, `manager`, `accountant` only.
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. You also need `manager@`, `worker@`, `sales@`, `accountant@dupont.test` and `admin@verhelst.test`.
- **Login is rate-limited** (5 per minute per address). Logging in as 7 users in a row gives `429` — space the logins or wait a minute.
- **No new migration this step** — `tasks`, `task_assignees`, `time_entries`, `chk_task_dates` and `chk_hours_range` already existed from step 01's migration.
- **Prerequisites:** a client and 3 projects (step 04).
- Every record you create should start with `TEST`.
- **Worker hour scope is project-level** (decided 2026-10-06): a worker logs on a project where they are an assignee on at least one task. `task_id` is optional and never narrows that check.
- `users.hourly_rate` is set with `PATCH /api/users/:id` `{"hourly_rate":"30.00"}` (admin). Put the original rates back when you finish.

---

## 1. Tasks

### TASK-01 — One task, five assignees

`POST /api/tasks` `{"project_id":<A>,"title":"TEST demolition","type":"work","start_date":"2026-11-02","end_date":"2026-11-06","assignee_ids":[<5 user ids>]}` → `201`, `status: "planned"`, `assignee_ids` has 5 ids. In the database: **1** `tasks` row, **5** `task_assignees` rows. Confirmed live.

### TASK-02 — The same user twice → `400`

`"assignee_ids":[<id>,<id>]` on create, or `PUT /api/tasks/:id/assignees {"user_ids":[<id>,<id>]}` → `400` `A user can only be assigned once per task`. Confirmed live.

### TASK-03 — A task with no assignee cannot leave `planned`

Create without `assignee_ids` → `201`, `assignee_ids: []`. `PATCH /api/tasks/:id/status {"status":"in_progress"}` → `400` `A task needs at least one assignee…`. After `PUT /api/tasks/:id/assignees {"user_ids":[<id>]}` → the same call → `200`. `PUT` with `[]` → `400`. Confirmed live.

### TASK-04 — `end_date` before `start_date`

API: `400` `end_date cannot be before start_date` (also on `PATCH`, checked against the stored start date). Database, straight in Postgres:

```
insert into tasks(tenant_id,project_id,title,type,start_date,end_date)
  values (1,<A>,'x','work','2026-11-10','2026-11-01');
```

→ `ERROR: … violates check constraint "chk_task_dates"`. Both confirmed live.

### TASK-05 — Assignees must be active users of this tenant

An unknown id → `400`. A user of **another** tenant → `400` (`UsersService.findActiveInTenant`, never the unscoped lookup). Confirmed live.

### TASK-06 — The Gantt feed

`GET /api/tasks?project_id=<A>&from=2026-11-04&to=2026-11-04` → every task whose date range overlaps that window, with `assignee_ids`. A window with no tasks → `total: 0`. `GET /api/tasks/:id` → the task with its assignees. Confirmed live.

### TASK-07 — Delete keeps the hours

`DELETE /api/tasks/:id` → `200`. Its `task_assignees` rows are gone; a time entry that pointed at it stays, with `task_id` `NULL`. Confirmed live.

### TASK-08 — Worker scope (`own`)

- `worker`: `GET /api/tasks` → only tasks they are on. `GET /api/tasks/:id` of a task that is not theirs → `404`. Any write (`POST`, `PATCH`, `PUT`, `DELETE`) → `403`.
- `GET /api/mobile/my-tasks` → the caller's own tasks, whatever the role (a `manager` sees only the tasks they are assigned to).
- `sales` → `403`.

All confirmed live.

---

## 2. Time entries — the frozen rate

### TIME-01 — Log 8h → the rate is copied

Set the worker's `hourly_rate` to `30.00`. As the worker: `POST /api/time-entries` `{"project_id":<A>,"work_date":"2026-11-03","hours":"8"}` → `201`, `hourly_rate: "30"`, `user_id` = the worker, `daily_total_hours: "8.00"`, `abnormal_hours: false`. Confirmed live.

### TIME-02 — Change the user's rate → the old entry keeps the old one

`PATCH /api/users/:id {"hourly_rate":"50.00"}`. `GET /api/time-entries?project_id=<A>` → the entry still says `30`. A correction of the hours later does not re-price it either. Confirmed live.

---

## 3. Time entries — the daily-hours rule (all projects together)

| Case | Result |
|---|---|
| 8h on A, then 3h on B, same day | both saved, `daily_total_hours: "11.00"` |
| 7h on A, then 6h on B (13h) | saved, `abnormal_hours: true`, `daily_total_hours: "13.00"` |
| 20h on A, then 20h on B | the second → `400` `…total … 40.00h across all projects — the maximum is 24h`, **no row written** for B |
| `hours` `0`, `-3`, `24.5` | `400` `hours must be more than 0 and at most 24` |

All confirmed live. The database also refuses it, straight in Postgres: `hours` `30` or `0` → `violates check constraint "chk_hours_range"`.

**The abnormal-hours alert** is flagged in the response (`abnormal_hours`), logged as a warning, and marked `// TODO: step 13` — step 13 raises the notification to the manager.

### TIME-03 — An edit does not count the edited row twice

Worker has 10h on B and 4h on A, same day. `PATCH` the A entry to `20` → `400` (10 + 20 = 30). `PATCH` it to `14` → `200`, `daily_total_hours: "24.00"` (14 + 10). Confirmed live.

---

## 4. Time entries — one row per day, and the correction rules

### TIME-04 — A second entry for the same user, project and day → an update

`POST` the same `project_id` + `work_date` again with other hours → `201` carrying the **same `id`**, the new hours, the same frozen rate. The database holds exactly one row. Confirmed live.

### TIME-05 — Who may edit, and when

| Who | Case | Result |
|---|---|---|
| `worker` | own entry, the day it was entered | `200` |
| `worker` | own entry, a later day (backdate `created_at` by 2 days) | `403` `read-only` |
| `worker` | own entry that a manager edited | `403` `changed by someone else` |
| `worker` | someone else's entry | `404` |
| `manager` | an entry that is days old | `200`, hourly rate unchanged |

All confirmed live. The old value is in `audit_logs` (`entity_type = 'time_entry'`, `action = 'update'`, `old_value` filled). "Nobody else touched it" is read from the audit trail — no extra column.

### TIME-06 — Delete

`worker` `DELETE /api/time-entries/:id` → `403`. `manager` → `200`, the row is gone, `audit_logs` holds `action = 'delete'` with the old value. Confirmed live.

---

## 5. Time entries — the worker hour scope (project-level)

| Case | Result |
|---|---|
| worker, project where they have **no task** | `403` `…assigned to a task` |
| worker, project where they **are** assigned, **no** `task_id` | `201`, `task_id: null` |
| `task_id` of a task from **another** project | `400` |
| `task_id` of a task of **this** project | `201` |
| worker logs for someone else (`user_id`) | `403` |
| `manager` logs for a worker (`user_id`), no assignment needed | `201`, `created_by` = the manager |

All confirmed live.

---

## 6. Reads, mobile, labour cost

### TIME-07 — Reads

- `worker` `GET /api/time-entries` → only their own rows, **even with `?user_id=<someone else>`**.
- `manager` `GET /api/time-entries?user_id=&project_id=&from=&to=` → filtered, paginated.
- `GET /api/mobile/my-entries` → only the caller's, for any role. `POST /api/mobile/time-entries` → same rules as the desktop route.
- `sales` → `403`.

All confirmed live.

### TIME-08 — Labour cost uses the frozen rates

`GET /api/projects/:id/labour-cost` → `{ project_id, labour_cost, total_hours }`. It equals `SELECT round(sum(hours * hourly_rate), 2) FROM time_entries WHERE project_id = :id`, and is **not** `total_hours × current rate`. `accountant` → `200`; `supervisor` (no `margins`) → `403`; another tenant → `404`. Confirmed live.

---

## 7. Tenant isolation

`admin@verhelst.test`: `GET /api/tasks` and `GET /api/time-entries` → `total: 0`; `GET /api/tasks/:id` of tenant A → `404`; `PATCH /api/time-entries/:id` of tenant A → `404`; `POST /api/tasks` on tenant A's project → `404`; an assignee from another tenant → `400`. All confirmed live. The e2e loop in `test/tenant-isolation.e2e-spec.ts` covers the three tables automatically.
