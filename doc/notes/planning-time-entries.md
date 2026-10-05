# ChantierOS — Planning & Time Entries (Scheduling & Time Tracking)

> Status: v1 (working draft). See [[business-logic-overview]] for how this fits the full picture, and [[A_progress-tracker]] for what's left to cover.

## The 3 tables

```
tasks (the SCHEDULE — what's planned)
      │
      ├── task_assignees (WHO works on it — one row per employee)
      │
      ▼ (feeds into)
time_entries (the REALITY — hours actually logged)
```

### 1) `tasks` — the Gantt chart entries
One row per scheduled task.

| Column | Meaning |
|---|---|
| `project_id` | Which project (required) |
| `title` | Task name (e.g. "Demolition") |
| `type` | `meeting` or `work` |
| `start_date`, `end_date` | Start/end dates (end can't be before start — real DB check) |
| `status` | `planned` (scheduled) → `in_progress` (happening) → `completed` (done) |

### 2) `task_assignees` — who works on the task

One row per employee on that task. A demolition task with five workers is **one** task row and five assignee rows — one bar on the Gantt chart, not five.

| Column | Meaning |
|---|---|
| `task_id` | Which task |
| `user_id` | **A real employee account** — never a typed name |

`UNIQUE (task_id, user_id)`. A task must have at least one assignee before its status can leave `planned`.

**Why a real account and never a typed name:** that same account is what the person uses to log hours later. A typed name would have nothing to attach the `time_entries` row to.

### 3) `time_entries` — the actual hours worked
One row per employee, per day, per project.

| Column | Meaning |
|---|---|
| `project_id` | Which project (required) |
| `user_id` | Which employee logged the hours (required) |
| `task_id` | Optional link to one specific `tasks` row |
| `work_date` | Which day (full date e.g. `2026-10-04`) |
| `hours` | How many hours (0–24, checked at the database level) |
| `hourly_rate` | **Frozen** hourly rate at the moment of logging (copied from `users.hourly_rate`) |
| `comment` | Short text — what was done (e.g. "finished tiling the bathroom floor") |

**Why `hourly_rate` is frozen here:** the tenant can change an employee's salary anytime on the `users` table. Freezing the rate on each `time_entries` row means past margin calculations never shift — same pattern as `stock_movements.unit_price`. See `[[catalogue-stock-tables-and-cost-storage]]` for the full explanation.

## Correcting a time entry

A submitted entry is read-only for the employee. Only a manager or admin can change it, and the entry is **not** a ledger — the row itself is corrected, and the old value is kept in `audit_logs`.

| Who | Can do |
|---|---|
| The employee | Create their own entry. Edit it only on the same day, before anyone else touched it |
| Manager / admin | Edit or delete any entry of their team, at any time |

Why not append-only like stock: an hour entry has one right answer per employee per day per project, and a correction row would break the same-day total check. Stock is different — a consumption really happened and cannot be un-happened.

## One employee, multiple projects — already supported

Nothing ties a `user_id` to a single project. An employee can be assigned tasks on several projects and log hours on all of them, no new table needed.

Example — Ahmed working on two projects the same day:

| user_id | project_id | task_id | work_date | hours | hourly_rate | comment |
|---|---|---|---|---|---|---|
| Ahmed | Project A | Demolition | 2026-10-04 | 5 | €20 | "knocked down the wall" |
| Ahmed | Project B | Painting | 2026-10-04 | 3 | €20 | "first coat done" |

Each project pays only for its own hours. No mixing.

## Full margin scenario — how the tenant knows if they win or lose money

**Setup:**
- Budget = **€1,000**
- Materials cost = **€250** (already known from `stock_movements`)
- Subcontractor cost = **€100** (from `purchase_invoice`)
- Employees: Karim (€20/h), Youssef (€15/h)

**`users` table (current rates, editable by tenant):**

| id | name | hourly_rate |
|---|---|---|
| U1 | Karim | €20 |
| U2 | Youssef | €15 |

**`time_entries` rows logged:**

| user_id | project_id | work_date | hours | hourly_rate (frozen) | comment |
|---|---|---|---|---|---|
| Karim | P1 | 2026-10-01 | 8 | €20 | "demo day 1" |
| Karim | P1 | 2026-10-02 | 8 | €20 | "demo day 2" |
| Youssef | P1 | 2026-10-01 | 6 | €15 | "tiling started" |

**Employee cost calculation:**
```
Karim:   (8 + 8) × €20 = €320
Youssef: 6       × €15 = €90
Total employees         = €410
```

**Full margin:**
```
Budget              = €1,000
− Materials         =   €250
− Subcontractor     =   €100
− Employees         =   €410
─────────────────────────────
Margin              =   €240  ✅ winning
```

**If Karim works 5 more days (8h/day):**
```
Extra cost = 5 × 8 × €20 = €800
New total  = €250 + €100 + €410 + €800 = €1,560
Margin     = €1,000 − €1,560 = −€560  ❌ LOSING MONEY → alert sent to tenant
```

**What if Karim's salary changes to €25/h next month?**
Past `time_entries` rows already have €20 frozen — nothing changes. History stays accurate.

## Daily hours limit — the rule

A `hours <= 24` check on a single row is not enough: nothing stops Ahmed logging 20h on Project A and 20h on Project B on the same Monday. Each row passes its own check, the combination is impossible.

The rule sums **all** of one employee's rows for the same `work_date`, across every project:

| Total hours, one employee, one day, all projects | Action |
|---|---|
| up to 12h | Saved normally |
| over 12h | Saved, and an **abnormal hours** alert goes to the manager |
| over 24h | **Rejected** — physically impossible |

### Where the check lives

Build the service-layer check first — it ships fast and gives the employee a clear message. Add a database trigger on `time_entries` later as a safety net, so the rule holds no matter which screen or script inserts the row.

```sql
-- the sum the rule checks
SELECT SUM(hours) FROM time_entries
WHERE user_id = :u AND work_date = :d;
```

The check runs on insert **and** on update, and excludes the row being edited.

## Manager visibility — keep it simple: just the hours

Earlier I suggested a computed "is this employee actively logging time or gone quiet" indicator — **that's dropped per your feedback.** No need to calculate an activity status. The manager view should just show the **hours themselves**, plainly:

| Employee | Project | Date | Hours |
|---|---|---|---|
| Ahmed | Project A | Monday | 5 |
| Ahmed | Project B | Monday | 3 |
| Sofia | Project C | Monday | 8 |

This matches what's already planned for the `/time-entries` manager page (per the dashboard-pages doc): all logged hours, filterable by employee/project/date. A simple sum per employee (per day/week/project) covers what's needed — no extra "activity status" logic required.

## Alerts — agreed list

### Employee side (mobile)
- End-of-day reminder if no hours logged yet today.
- Friendly error if a save would push their same-day total over 24h.
- Block logging hours on a task that isn't assigned to them.

### Manager side
- **Missing timesheet alert** — an employee has a task `in_progress` today but no `time_entries` row for today.
- **Abnormal hours alert** — someone logged unusually high hours in one day (e.g. over 12h) — worth a quick review.
- **Stalled project alert** — a project is `in_progress` but no hours have been logged on it in several days.

## Related notes
- [[business-logic-overview]]
- [[site-reports]]
- [[margin-profitability]]
- [[A_progress-tracker]]
