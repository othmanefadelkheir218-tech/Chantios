# Tests — Alerts & Notifications

> Routes: `/api/notifications`, `/api/admin/notifications`, WebSocket event `notification`. Crons: `yarn job:alerts <name>`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [alerts.md](../alerts.md), [margin-profitability.md](../margin-profitability.md), the step file [Phaces/13-alerts.md](../Phaces/13-alerts.md).

## Before you start

- **One door.** Every alert goes through `NotificationsService.dispatch(type, context)`. No other module writes a `notifications` row or sends its own email.
- **What `dispatch` does:** find the recipients (one helper), skip anyone already told (`dedupeDays`), write the rows, push each row on the person's socket room, then queue one email per person. A failed email never removes the row.
- **Log in first.** Login is limited to 5 per minute: space the logins. Platform admin: `POST /api/admin/auth/login`.
- **Mail provider down test:** start the server with a wrong key — `PORT=5391 RESEND_API_KEY=bad node dist/main`. Every email job then fails; the in-app rows must still exist.
- **Run a cron now:** `yarn job:alerts end-of-day-reminder 2030-01-15T17:05:00Z` (the second argument fakes "now"). Names: `end-of-day-reminder`, `missing-timesheet`, `stalled-project`, `task-starting`, `purchase-due`, `retention`, `late-invoices`, `report-alerts`.
- **Who gets what:** admin + manager, but only if their role can *view* the module behind the alert (default matrix + the company's `role_permissions` overrides). A manager has no `invoices` / `purchase_invoices` access by default, so billing alerts reach the admin only.
- Every record you create should start with `TEST`.

---

## 1. Stock

### NOT-01 — Low stock: row, socket, email
Stock 50, minimum 10. A `-45` adjustment → one `low_stock` row for the admin and one for the manager (none for worker or accountant). Both sockets receive `notification` live (snake_case). Two email jobs are queued, in the company's language. A second movement the same day adds nothing (once a day per material).

### NOT-02 — Reservation not covered
`available < 0` → `reservation_unmet`, same recipients, same once-a-day rule.

## 2. Margin

### NOT-03 — 80 % and 95 %, each once, with reset
Cost 79 % → nothing. 81 % → one `margin_warning` each (admin, manager). Saves at 82 %, 82.5 % → nothing new. 96 % → one `margin_critical`. Saving again → nothing. An extra accepted quote (cost back to 48 %) deletes the `project_margin_alerts` rows. Cost 83 % of the new budget → the warning fires again.

## 3. Time

### NOT-04 — Abnormal hours
7 h on project A: no alert. +6 h on project B (13 h): saved and flagged, one `abnormal_hours` each for admin and manager (employee name + total). Editing the same day again adds nothing.

### NOT-05 — End of day, per company
A company's `end_of_day_reminder_time` is a wall-clock time in its `timezone`. The cron runs hourly. With Dupont (Brussels, 18:00) and Verhelst (New York, 17:00): `17:05Z` in winter fires Dupont only; `22:05Z` fires Verhelst only; `03:05Z` fires nobody. Only workers with no hours that local day are reminded.

### NOT-06 — Missing timesheet
One hour after the reminder time, a worker with a task `in_progress` and no hours → `missing_timesheet` to admin + manager. Silent at the reminder hour itself. Once per day per employee.

### NOT-07 — Stalled project
`in_progress` for 5 days, no hours for 5 days → `stalled_project`. (The "5 days" is on both open lists — change `STALLED_PROJECT_DAYS` if the owner wants another number.)

## 4. Billing

### NOT-08 — Late invoice: an alert only
`yarn job:alerts late-invoices` → one `invoice_late` for the admin (not the manager). The invoice status stays `sent`. Running again the same week adds nothing.

### NOT-09 — Invoice paid, purchase due
Full payment → `invoice_paid` (admin). `yarn job:alerts purchase-due` → `purchase_due` for unpaid supplier bills due within 7 days (once every 3 days per bill).

## 5. Tasks

### NOT-10 — Worker alerts
Creating a task with an assignee → `task_assigned` to the worker, never to the person who assigned. Changing the status → `task_status_changed`. Setting the assignees again tells only the *new* ones. `yarn job:alerts task-starting` → `task_starting` for tasks starting tomorrow (the company's own tomorrow), once per task.

## 6. Client emails (no row)

### NOT-11 — Quote sent, invoice sent, reminder, portal message
Each queues one email to the client and writes **no** `notifications` row. The language is the **company's** `locale` (Dupont → French, Verhelst → English). A staff message in a `project_client` thread emails the client; a portal message notifies the employees live.

## 7. Platform alerts

### NOT-12 — New company
`POST /api/auth/register` → a row with `admin_user_id` set, `tenant_id` NULL, `user_id` NULL, pushed to the platform admin's socket. No company user ever gets it. The company is created even if the verification email fails. Suspending a company → `tenant_status_changed` to the platform admin.

### NOT-13 — The database refuses a wrong recipient
Insert with both `user_id` and `admin_user_id`, or with neither → rejected by `chk_notification_one_recipient`.

## 8. Reading and marking

### NOT-14 — Own rows only
`GET /api/notifications` lists only the caller's rows, newest first; `?is_read=false` filters. `GET /unread-count` is the bell badge. Marking your own → `200`. Marking someone else's (another user, a platform row, another company's) → `403` and it stays unread. Unknown id → `404`. `PATCH /read-all` touches only the caller's rows. No login → `401`. A company user on `/api/admin/notifications` → `401`.

### NOT-15 — Sockets
A socket with no token is refused. Each person only hears their own `notification` (the worker hears nothing about stock).

## 9. Failure and retention

### NOT-16 — Mail provider down
With a wrong `RESEND_API_KEY`, every email job fails after 3 attempts and lands in the BullMQ failed set. Every in-app row still exists and every socket event still arrived.

### NOT-17 — Retention
Plan `retention_days = 365`. An old **read** notification and an old analytics event are deleted. An old **unread** notification, a recent read one, and all projects, quotes, invoices and hours are untouched. `retention_days = 0` keeps everything.

### NOT-18 — Isolation
A company's list holds only its own rows. Company A's alerts never carry company B's data.

### NOT-19 — Nothing left to wire
`grep -rn "TODO: step 13" src/` returns nothing.

## Clean up

All test rows start with `TEST`. Delete them in this order (foreign keys): notifications, test companies, then per test project: time entries, tasks, conversations, payments, invoices, purchase invoices, stock reservations/movements, reports, portal tokens, margin alerts, quotes, the project, then clients, services, materials, suppliers, `insuranceTEST…` cost types.
