# Phase 07 — Planning & Time Entries (Time Tracking)

> Depends on Phase 02 (users = employees), Phase 03 (projects must exist).

## Tables

- `tasks` — the Gantt schedule: one row per planned task
- `task_assignees` — one row per employee on a task
- `time_entries` — the reality: one row per employee, per day, per project

## Key relations

```
projects ──── tasks ──── task_assignees ──── users
                  │
                  ▼ (optional link)
users (employees) ──── time_entries ──── projects
```

### `tasks` fields

| Field | Notes |
|---|---|
| `project_id` | Required |
| `title` | Task name |
| `type` | `meeting` / `work` |
| `start_date` / `end_date` | DB check: end not before start |
| `status` | `planned` / `in_progress` / `completed` |

### `task_assignees` — many workers, one task

| Field | Notes |
|---|---|
| `task_id` | Which task |
| `user_id` | **A real employee account** — never a typed name, because that account logs the hours later |

`UNIQUE (task_id, user_id)`. A demolition task with five workers is **one** task row and five assignee rows — one bar on the Gantt chart, not five. A task needs at least one assignee before its status can leave `planned`.

## Key rules

### `hourly_rate` frozen on record
- When time entry is saved → `hourly_rate` copied from `users.hourly_rate` at that moment
- If the employee rate changes tomorrow → past rows never shift
- This keeps `labor_cost` historically accurate

### Same employee, multiple projects, same day
- Allowed — one `time_entries` row per project worked that day
- `work_date` stores the day only, no time part

### Daily hours limit — the rule
The per-row `hours <= 24` check is not enough: 20h on Project A plus 20h on Project B both pass it. The rule sums **all** rows for that `user_id` + `work_date`, across every project:

| Same-day total, all projects | Action |
|---|---|
| up to 12h | Saved normally |
| over 12h | Saved + **abnormal hours** alert to the manager |
| over 24h | **Rejected** — physically impossible |

```sql
SELECT SUM(hours) FROM time_entries
WHERE user_id = :u AND work_date = :d;
```

- Runs on insert **and** update, excluding the row being edited
- Build it in the service layer first (ships fast, clear message to the employee)
- Add a DB trigger later as a safety net, so the rule holds whatever inserts the row
- A worker can only log hours on a project where they are an assignee on at least one task
- `time_entries.task_id` is optional. The check is project-level whether or not it is set — a worker never needs to name a task, and naming one does not narrow the check. If `task_id` is given, that task must belong to the same project

### Correcting an entry
- The employee can edit their own entry on the same day only, and only if nobody else touched it. After that it is read-only to them
- A manager or admin can edit or delete any entry of their team, at any time
- The row itself is corrected — `time_entries` is **not** append-only. The old value goes to `audit_logs`
- Why not a correction row like stock: an hour entry has one right answer per employee per day per project, and a second row would break the same-day total check

### Time entry fields

| Field | Notes |
|---|---|
| `user_id` | The employee |
| `project_id` | Which project |
| `work_date` | Day of work (date only) |
| `hours` | Hours worked |
| `hourly_rate` | Frozen from employee rate at time of entry |
| `comment` | Optional note |

### Total employee cost for a project
```
labor_cost = SUM(hours × hourly_rate) for all time_entries of this project
```
This is always computed live from the `time_entries` table — never stored as a single number.

## What to build

- `tasks` CRUD (the Gantt) + status transitions
- `time_entries` CRUD (employee records own time; manager can record for their team)
- Same-day total check in the service layer (reject > 24h, alert > 12h)
- Freeze `hourly_rate` on save (pull from `users.hourly_rate` at write time)
- Mobile PIN endpoint for `worker` to submit time entry from site
- Aggregate query: cost per project (used by margin calculation)

## Dependencies

- Phase 02 (users + hourly_rate field)
- Phase 03 (projects)

## See also
- [[planning-time-entries]]
- [[site-reports]]
- [[margin-profitability]]
- [[alerts]]
