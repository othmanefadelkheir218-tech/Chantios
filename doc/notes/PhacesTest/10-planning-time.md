# Phase 10 — Planning & Time Entries

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [planning-time-entries.md](../planning-time-entries.md).
> Old reference: [../test/12-planning-time.md](../test/12-planning-time.md).

## Goal

Tasks with many assignees, hours with a frozen rate, the same-day total rule across all projects, the correction rules, and project-level worker scope.

## Before you start

- Hourly rates from phase 03: worker `20.00`, worker 2 `25.00`, supervisor `30.00`.
- Projects: `TEST Project Main` (`in_progress`) and a new `TEST Project Side` (create it, accept a one-line quote so it is `in_progress`).
- Dates: use the **current week**, so the same-day edit rule (TIME-05) is real.
- The worker uses the mobile login (`/api/mobile/login`, PIN `1234`).

---

## 1. Tasks

| ID | Do | Expected | Result |
|---|---|---|---|
| TASK-01 | Task `TEST Painting walls` on Main, type `work`, 5 assignees (supervisor, leader, worker, worker 2, manager) | `201`, `planned`, **1** `tasks` row + **5** `task_assignees` rows | todo |
| TASK-02 | Same user twice in `assignee_ids` or in `PUT .../assignees` | `400 A user can only be assigned once per task` | todo |
| TASK-03 | Task with no assignee → `in_progress` | `400 A task needs at least one assignee…`; after `PUT assignees [worker]` → `200`; `PUT []` → `400` | todo |
| TASK-04 | `end_date` before `start_date` (API, and a direct DB insert) | `400`; DB refuses `chk_task_dates` | todo |
| TASK-05 | Assignee: an unknown id; a B user; the deactivated spare user | `400` each | todo |
| TASK-06 | Task on `TEST Project Cancel` | `400` (project cancelled) | todo |
| TASK-07 | `GET /api/tasks?project_id=&from=&to=` (Gantt feed); an empty window | overlapping tasks with `assignee_ids`; `total 0` | todo |
| TASK-08 | Worker: `GET /api/tasks` (own only), another task by id (`404`), any write (`403`); `GET /api/mobile/my-tasks` | as stated | todo |
| TASK-09 | Manager `GET /api/mobile/my-tasks` | only tasks the manager is assigned to | todo |

## 2. Time entries — the frozen rate

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-01 | Worker logs `8` h on Main today (mobile route) | `201`, `hourly_rate "20"`, `daily_total_hours "8.00"`, `abnormal_hours false` | todo |
| TIME-02 | Owner sets the worker's rate to `35.00` | the entry still says `20`; set it back to `20.00` | todo |

## 3. The day rule — all projects together

Worker 2 is assigned to a task on **both** Main and Side first.

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-03 | Worker 2: `8` h on Main, `3` h on Side, same day | both saved, `daily_total_hours "11.00"` | todo |
| TIME-04 | Another day: `7` h on Main, `6` h on Side | saved, `abnormal_hours true`, `13.00` — an `abnormal_hours` alert (phase 15) | todo |
| TIME-05 | Another day: `20` h on Main, `20` h on Side | the second → `400 …40.00h across all projects — the maximum is 24h`, **no** row for Side | todo |
| TIME-06 | `hours` `0`, `-3`, `24.5`; DB insert `30` | `400 hours must be more than 0 and at most 24`; DB `chk_hours_range` | todo |
| TIME-07 | 10 h on Side + 4 h on Main; `PATCH` Main to `20` → `400`; to `14` → `200`, `24.00` | the edited row is not counted twice | todo |
| TIME-08 | `work_date 2026-13-45` / `2026-02-30`; `?from=2026-13-45` | `400 work_date must be a valid date…` | todo |

## 4. One row per day, and corrections

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-09 | `POST` the same user, project, day again with other hours | `201`, the **same `id`**, new hours, same frozen rate — one row in the DB | todo |
| TIME-10 | Worker edits own entry the same day | `200` | todo |
| TIME-11 | Backdate that entry's `created_at` by 2 days, worker edits it | `403 read-only` | todo |
| TIME-12 | Manager edits a worker entry; then the worker edits it | `200` (rate unchanged); `403 changed by someone else` | todo |
| TIME-13 | Worker edits someone else's entry | `404` | todo |
| TIME-14 | Worker deletes; manager deletes | `403`; `200`, `audit_logs` `delete` with the old value | todo |
| TIME-15 | `audit_logs?entity_type=time_entry` | `update` and `delete` rows with `old_value` filled | todo |

## 5. Worker scope (project-level)

| ID | Do | Expected | Result |
|---|---|---|---|
| SCO-01 | Worker logs on a project where they have no task | `403 …assigned to a task` | todo |
| SCO-02 | Worker on Main, no `task_id` | `201`, `task_id null` | todo |
| SCO-03 | `task_id` of another project's task | `400` | todo |
| SCO-04 | Worker logs for worker 2 (`user_id`) | `403` | todo |
| SCO-05 | Manager logs for the worker, no assignment needed | `201`, `created_by` = manager | todo |

## 6. Reads, labour cost, roles

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-16 | Worker `GET /api/time-entries?user_id=<worker 2>` | only own rows | todo |
| TIME-17 | Manager `GET /api/time-entries?user_id=&project_id=&from=&to=` | filtered | todo |
| TIME-18 | `GET /api/projects/<Main>/labour-cost` | `{ labour_cost, total_hours }` = `sum(hours × hourly_rate)` with the **frozen** rates | todo |
| TIME-19 | Accountant labour-cost `200`; supervisor `403`; sales `GET /api/time-entries` `403` | as stated | todo |
| TIME-20 | `DELETE` a task that has hours | `200`; its assignees gone; the entries stay with `task_id null` | todo |
| ISO-PT-01 | B owner: `GET /api/tasks`, `/api/time-entries` → `total 0`; A's task by id → `404`; `POST /api/tasks` on A's project → `404` | as stated | todo |
