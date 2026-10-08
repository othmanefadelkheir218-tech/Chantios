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
| TASK-01 | Task `TEST Painting walls` on Main, type `work`, 5 assignees (supervisor, leader, worker, worker 2, manager) | `201`, `planned`, **1** `tasks` row + **5** `task_assignees` rows | PASS |
| TASK-02 | Same user twice in `assignee_ids` or in `PUT .../assignees` | `400 A user can only be assigned once per task` | PASS |
| TASK-03 | Task with no assignee → `in_progress` | `400 A task needs at least one assignee…`; after `PUT assignees [worker]` → `200`; `PUT []` → `400` | PASS |
| TASK-04 | `end_date` before `start_date` (API, and a direct DB insert) | `400`; DB refuses `chk_task_dates` | PASS |
| TASK-05 | Assignee: an unknown id; a B user; the deactivated spare user | `400` each | PASS |
| TASK-06 | Task on `TEST Project Cancel` | `400` (project cancelled) | PASS |
| TASK-07 | `GET /api/tasks?project_id=&from=&to=` (Gantt feed); an empty window | overlapping tasks with `assignee_ids`; `total 0` | PASS |
| TASK-08 | Worker: `GET /api/tasks` (own only), another task by id (`404`), any write (`403`); `GET /api/mobile/my-tasks` | as stated | PASS |
| TASK-09 | Manager `GET /api/mobile/my-tasks` | only tasks the manager is assigned to | PASS |

## 2. Time entries — the frozen rate

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-01 | Worker logs `8` h on Main today (mobile route) | `201`, `hourly_rate "20"`, `daily_total_hours "8.00"`, `abnormal_hours false` | PASS |
| TIME-02 | Owner sets the worker's rate to `35.00` | the entry still says `20`; set it back to `20.00` | PASS |

## 3. The day rule — all projects together

Worker 2 is assigned to a task on **both** Main and Side first.

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-03 | Worker 2: `8` h on Main, `3` h on Side, same day | both saved, `daily_total_hours "11.00"` | PASS |
| TIME-04 | Another day: `7` h on Main, `6` h on Side | saved, `abnormal_hours true`, `13.00` — an `abnormal_hours` alert (phase 15) | PASS |
| TIME-05 | Another day: `20` h on Main, `20` h on Side | the second → `400 …40.00h across all projects — the maximum is 24h`, **no** row for Side | PASS |
| TIME-06 | `hours` `0`, `-3`, `24.5`; DB insert `30` | `400 hours must be more than 0 and at most 24`; DB `chk_hours_range` | PASS |
| TIME-07 | 10 h on Side + 4 h on Main; `PATCH` Main to `20` → `400`; to `14` → `200`, `24.00` | the edited row is not counted twice | PASS |
| TIME-08 | `work_date 2026-13-45` / `2026-02-30`; `?from=2026-13-45` | `400 work_date must be a valid date…` | PASS |

## 4. One row per day, and corrections

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-09 | `POST` the same user, project, day again with other hours | `201`, the **same `id`**, new hours, same frozen rate — one row in the DB | PASS |
| TIME-10 | Worker edits own entry the same day | `200` | PASS |
| TIME-11 | Backdate that entry's `created_at` by 2 days, worker edits it | `403 read-only` | PASS |
| TIME-12 | Manager edits a worker entry; then the worker edits it | `200` (rate unchanged); `403 changed by someone else` | PASS |
| TIME-13 | Worker edits someone else's entry | `404` | PASS |
| TIME-14 | Worker deletes; manager deletes | `403`; `200`, `audit_logs` `delete` with the old value | PASS |
| TIME-15 | `audit_logs?entity_type=time_entry` | `update` and `delete` rows with `old_value` filled | PASS |

## 5. Worker scope (project-level)

| ID | Do | Expected | Result |
|---|---|---|---|
| SCO-01 | Worker logs on a project where they have no task | `403 …assigned to a task` | PASS |
| SCO-02 | Worker on Main, no `task_id` | `201`, `task_id null` | PASS |
| SCO-03 | `task_id` of another project's task | `400` | PASS |
| SCO-04 | Worker logs for worker 2 (`user_id`) | `403` | PASS |
| SCO-05 | Manager logs for the worker, no assignment needed | `201`, `created_by` = manager | PASS |

## 6. Reads, labour cost, roles

| ID | Do | Expected | Result |
|---|---|---|---|
| TIME-16 | Worker `GET /api/time-entries?user_id=<worker 2>` | only own rows | PASS |
| TIME-17 | Manager `GET /api/time-entries?user_id=&project_id=&from=&to=` | filtered | PASS |
| TIME-18 | `GET /api/projects/<Main>/labour-cost` | `{ labour_cost, total_hours }` = `sum(hours × hourly_rate)` with the **frozen** rates | PASS |
| TIME-19 | Accountant labour-cost `200`; supervisor `403`; sales `GET /api/time-entries` `403` | as stated | PASS |
| TIME-20 | `DELETE` a task that has hours | `200`; its assignees gone; the entries stay with `task_id null` | PASS |
| ISO-PT-01 | B owner: `GET /api/tasks`, `/api/time-entries` → `total 0`; A's task by id → `404`; `POST /api/tasks` on A's project → `404` | as stated | PASS |

## Result — 2026-10-08

**35 PASS, 0 FAIL, 0 SKIP.**

- Dates used: current week 2026-10-03 … 10-10 (today 10-08). Worker entries by the mobile route `POST /api/mobile/time-entries`.
- TIME-02: the entry stayed `20` in the DB after the user rate went to `35.00`; rate set back to `20.00`.
- TIME-11: made by moving `created_at` of the entry back 2 days in the DB.
- TIME-14 audit: the entry has `create`, `update` (old value filled) and `delete` (old value filled) rows. TIME-15 through `GET /api/admin/audit-logs?entity_type=time_entry` as super-admin: 17 rows, all updates and the delete carry `old_value`.
- TIME-18: `labour_cost` equals `sum(hours × hourly_rate)` from the DB (1405.00 / 58.00 h at that moment; 1445.00 / 60 h after TIME-20 added 2 h).
- TIME-19: the supervisor labour-cost refusal reads `No canView access to margins` (the route is guarded by the margins module).
- TASK-05 inactive user: user 7 (sales) was set inactive in the DB for one call, then set active again (A has no spare inactive user after the re-seed).
- ISO-PT-01: the `POST /api/tasks` on A's project gives `404 Project not found`.

### Data left

Project 10 `TEST Project Side` (in_progress, one accepted 100 € quote). Tasks (A): 1 `TEST Painting walls` (Main, 5 assignees), 2 `TEST No assignee` (in_progress, assignee worker), `TEST Others only` (supervisor + leader), 5 `TEST Side work` (Side, worker 2); the `TEST Delete me` task is deleted. Time entries: worker — Main 10-08 (7 h, id 1), 10-06 (2 h), 10-03 (2 h, task_id null after the task delete), Side 10-10 (3 h, logged by the manager); worker 2 — Main 10-07 8 h, Side 10-07 3 h, Main 10-06 7 h, Side 10-06 6 h, Main 10-05 20 h, Side 10-09 10 h, Main 10-09 14 h. Entry 10 was deleted. Users 5 and 6 rates are back to 20 / 25.
