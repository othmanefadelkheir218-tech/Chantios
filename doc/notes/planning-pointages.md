# ChantierOS — Planning & Pointages (Scheduling & Time Tracking)

> Status: v1 (working draft). See [[business-logic-overview]] for how this fits the full picture, and [[progress-tracker]] for what's left to cover.

## The 2 tables

```
planning_taches (the SCHEDULE — what's planned)
      │
      ▼ (feeds into)
pointages (the REALITY — hours actually logged)
```

### 1) `planning_taches` — the Gantt chart entries
One row per scheduled task.

| Column | Meaning |
|---|---|
| `projet_id` | Which project (required) |
| `titre` | Task name (e.g. "Démolition") |
| `type` | `reunion` (meeting) or `travaux` (actual work) |
| `assigned_user_id` | **Must be a real employee account** — required, no free-typed names |
| `date_debut`, `date_fin` | Start/end dates (end can't be before start — real DB check) |
| `statut` | `planifie` (scheduled) → `en_cours` (happening) → `termine` (done) |

### 2) `pointages` — the actual hours worked
One row per employee, per day, per project.

| Column | Meaning |
|---|---|
| `projet_id` | Which project (required) |
| `user_id` | Which employee logged the hours (required) |
| `tache_id` | Optional link to one specific `planning_taches` row |
| `date_travail` | Which day |
| `heures` | How many hours (0–24, checked at the database level) |

**Why `assigned_user_id` must be a real employee:** that same account is what the person uses to log hours later. A free-typed name would have nothing to attach the `pointages` row to.

## One employee, multiple projects — already supported

Nothing ties a `user_id` to a single project. An employee can be assigned tasks on several projects and log hours on all of them, no new table needed.

Example — Ahmed working on two projects the same day:

| user_id | projet_id | tache_id | date_travail | heures |
|---|---|---|---|---|
| Ahmed | Project A | Démolition | Monday | 5 |
| Ahmed | Project B | Peinture | Monday | 3 |

## ⚠️ Gap: total daily hours across projects isn't checked — and the fix

The database only checks `heures <= 24` **per single row**. It never sums up **all of one employee's rows for the same day** across every project.

**Problem this causes:** nothing stops Ahmed from logging 20h on Project A and 20h on Project B, both on Monday — 40h in one day, which is physically impossible. Each row passes its own check (20 ≤ 24), but the combination is wrong.

**Proposed fix (needs to be built, not in the schema today):** add a rule that runs every time a `pointages` row is inserted or updated, which:
1. Sums `heures` for that `user_id` + that `date_travail`, across **all** projects.
2. Rejects the save if the total goes over 24h.

This can be done two ways:
- **Database trigger** on `pointages` (safest — catches it no matter which app/screen inserts the row).
- **Application-level check** in the API, before saving (simpler to build first, but only works if every entry point goes through that same API code).

Recommendation: start with the application-level check (faster to ship), and add the database trigger later as a safety net.

## Manager visibility — keep it simple: just the hours

Earlier I suggested a computed "is this employee actively logging time or gone quiet" indicator — **that's dropped per your feedback.** No need to calculate an activity status. The manager view should just show the **hours themselves**, plainly:

| Employee | Project | Date | Hours |
|---|---|---|---|
| Ahmed | Project A | Monday | 5 |
| Ahmed | Project B | Monday | 3 |
| Sofia | Project C | Monday | 8 |

This matches what's already planned for the `/pointages` manager page (per the dashboard-pages doc): all logged hours, filterable by employee/project/date. A simple sum per employee (per day/week/project) covers what's needed — no extra "activity status" logic required.

## Alerts — agreed list

### Employee side (mobile)
- End-of-day reminder if no hours logged yet today.
- Friendly error if a save would push their same-day total over 24h (this is the app-facing side of the gap fixed above).
- Block logging hours on a task that isn't assigned to them.

### Manager side
- **Missing timesheet alert** — an employee has a task `en_cours` today but no `pointages` row for today.
- **Abnormal hours alert** — someone logged unusually high hours in one day (e.g. over 12h) — worth a quick review.
- **Stalled project alert** — a project is `en_cours` but no hours have been logged on it in several days.

## Related notes
- [[business-logic-overview]]
- [[progress-tracker]]
