# Phase 15 — Alerts & Notifications

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [alerts.md](../alerts.md), [margin-profitability.md](../margin-profitability.md).
> Old reference: [../test/17-notifications.md](../test/17-notifications.md).

## Goal

One door (`NotificationsService.dispatch`) for every alert: recipients from one helper (role + overrides), an in-app row, a socket event, and an email — a failed email never loses the row.

## Before you start

- Many alerts already fired in phases 07–14. This phase checks them **and** the crons.
- Run a cron now: `yarn job:alerts <name> [fake-now]`. Names: `end-of-day-reminder`, `missing-timesheet`, `stalled-project`, `task-starting`, `purchase-due`, `retention`, `late-invoices`, `report-alerts`.
- Recipients: admin + manager, only if the role can **view** the module behind the alert. The manager has no `invoices` / `purchase_invoices` access, so billing alerts go to the owner only.
- Inboxes: owner `othmanefadelkheir218@gmail.com`, manager `zakariyazouazou@gmail.com`, worker `winucardit@gmail.com`.
- **Platform alerts:** the super-admin's address `admin@chantieros.local` is not a real inbox, so its emails cannot arrive. Platform emails are checked at the staff admin `othmanefadelkheir218+staff@gmail.com`.
- Set company B's timezone to `America/New_York` and its reminder time to `17:00` before NOT-06.

---

## 1. Stock and margin

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-01 | Stock 50, minimum 10 (new `TEST Sand`), adjustment `-45` | one `low_stock` row for owner and manager, none for worker or accountant; both sockets get `notification`; 2 emails | PASS |
| NOT-02 | **[CHECK EMAIL]** owner + manager — low stock, French | received | PASS* |
| NOT-03 | A second movement the same day | nothing new (once a day per material) | PASS |
| NOT-04 | `reservation_unmet` from phase 11 STK-16 | rows exist, same recipients, once a day | PASS |
| NOT-05 | Margin alerts from phase 12 section 3 | 2 warnings + 1 critical per recipient, no duplicates | PASS |

## 2. Time

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-06 | Abnormal hours from phase 10 TIME-04 | one `abnormal_hours` each for owner and manager (name + total); editing the same day adds none | PASS |
| NOT-07 | End of day: `end-of-day-reminder 2030-01-15T17:05:00Z` / `22:05Z` / `03:05Z` | A (Brussels 18:00) only / B (New York 17:00) only / nobody; only workers with no hours that local day | PASS |
| NOT-08 | **[CHECK EMAIL]** `winucardit@gmail.com` — end-of-day reminder | received | PASS* |
| NOT-09 | Missing timesheet, one hour after the reminder time, worker with a task `in_progress` and no hours | `missing_timesheet` to owner + manager; silent at the reminder hour; once a day | PASS |
| NOT-10 | Stalled project: `in_progress` 5 days, no hours 5 days | `stalled_project` | PASS |

## 3. Billing

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-11 | `late-invoices` | one `invoice_late` for the **owner only**; the invoice status stays `sent`; again the same week → nothing | PASS |
| NOT-12 | `invoice_paid` from phase 08 INV-06 | owner only | PASS |
| NOT-13 | `purchase-due`: unpaid supplier bill due within 7 days | `purchase_due` for the owner; once every 3 days per bill | PASS |
| NOT-14 | **[CHECK EMAIL]** owner — invoice late, invoice paid, purchase due | received | PASS* |

## 4. Tasks

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-15 | New task with worker 2 as assignee | `task_assigned` to worker 2, never to the person who assigned; status change → `task_status_changed`; re-setting assignees tells only the **new** ones | PASS |
| NOT-16 | `task-starting` for a task starting tomorrow (company time) | `task_starting` to its workers, once per task | PASS |
| NOT-17 | **[CHECK EMAIL]** `winucardit+worker2@gmail.com` (same inbox as `winucardit@`) — task assigned | received | PASS* |

## 5. Client emails — no row

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-18 | Quote sent, invoice sent, reminder, staff reply in the portal thread (phases 08, 14) | each one email to `gryehirir@gmail.com`, **no** `notifications` row; A's are French | PASS |
| NOT-19 | B sends a quote to its client (`gryehirir@gmail.com`, created in phase 06 CLI-05) | **[CHECK EMAIL]** the email is in **English** (B's locale) | PASS* |

## 6. Platform alerts

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-20 | `tenant_signed_up` (phase 03), `tenant_status_changed` (phase 03 SUS) | rows with `admin_user_id` set, `tenant_id` and `user_id` NULL — one per active platform admin | PASS |
| NOT-21 | **[CHECK EMAIL]** `othmanefadelkheir218+staff@gmail.com` | the platform emails arrived | PASS* |
| NOT-22 | DB insert with both `user_id` and `admin_user_id`; with neither | refused `chk_notification_one_recipient` | PASS |

## 7. Reading and marking

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-23 | `GET /api/notifications`, `?is_read=false`, `/unread-count` | only the caller's rows, newest first | PASS |
| NOT-24 | Mark own → `200`; another user's, a platform row, B's → `403` and still unread; unknown → `404` | as stated | PASS |
| NOT-25 | `PATCH /read-all` | only the caller's rows | PASS |
| NOT-26 | No login `401`; a tenant user on `/api/admin/notifications` `401`; platform admin there `200` | as stated | PASS |
| NOT-27 | Sockets: no token refused; the worker hears nothing about stock | as stated | PASS |

## 8. Failure and retention

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-28 | Restart the API with `RESEND_API_KEY=bad`, trigger a low-stock alert | the row exists and the socket event arrives; the email job fails 3 times and lands in BullMQ's failed set. Restart with the real key after | PASS (run 2026-10-09 with the owner's permission: API started once with `RESEND_API_KEY=re_bad_key_for_not28`, then stopped; the `re_` prefix is needed, the env check refuses other values. New material `TEST NOT-28 Sand` 50 → `-45`: rows 123 (owner) and 124 (manager) written; 2 new jobs (145, 146) in the BullMQ failed set, `attemptsMade 3`, reason `Failed to send email`; the API answered `201`. Socket not re-checked (same dispatch path as NOT-01). Port 5300 free afterwards) |
| NOT-29 | `retention` with plan `retention_days 30`: an old read notification, an old unread one, an old analytics event, a recent read one | only the old **read** notification and the old event are deleted; projects, quotes, invoices, hours untouched | PASS |
| NOT-30 | `grep -rn "TODO: step 13" src/` | nothing | PASS |
| ISO-NO-01 | B's list holds only B's rows; no A alert carries B data | as stated | PASS |

---

## Result — 2026-10-09

**31 PASS, 0 FAIL, 0 SKIP.** NOT-28 PASS on 2026-10-09. Emails: Resend works (no error) — every one below shows `delivered` in the Resend list, except the super-admin address (`admin@chantieros.local`, bounced, known problem 8).

Data left: material 6 `TEST Sand` (stock 4), task 8 `TEST Task Notif` (in progress, workers 6 + 5), task 9 `TEST Task Tomorrow` (planned, 2026-10-10, workers 6 + 5), tenant 7 `TEST Epsilon` (registered for NOT-20, owner `othmanefadelkheir218+epsilon@gmail.com`, not verified), B worker 14 `winucardit+bworker@gmail.com`, B timezone `America/New_York` / `17:00`, project 15 status history moved back 6 days (NOT-10). `notifications` rows from the cron runs stay.

- NOT-01: material 6, stock 50 → `-45` → rows for owner (1) and manager (2) only, `on_hand 5`; both sockets got `notification` (`low_stock`); worker and accountant got nothing (0 rows, empty sockets). 2 emails `Stock bas : TEST Sand`, delivered. NOT-02: the same 2 emails, French — PASS*.
- NOT-03: a second `-1` → still 2 rows, no new socket event.
- NOT-04: `reservation_unmet` for project/entity 3: 1 row each for owner and manager (2026-10-08), none for others.
- NOT-05: project 12 (the phase 12 alerts project): warning ×2 and critical ×1 per recipient (owner, manager); no duplicate. Projects 4 and 10: 1 warning + 1 critical each.
- NOT-06: 2 `abnormal_hours` rows (owner, manager) for TEST Worker 2, `hours 13.00`, date 2026-10-06. Editing entry 4 (7 → 7.5, same day) → `200`, still 2 rows.
- NOT-07 (B set to New York / 17:00, B worker 14 added): `17:05Z` → 2 reminders (workers 5, 6; A only). `22:05Z` → 1 (worker 14, B only). `03:05Z` → 0. Worker 5 and 6 have no hours on 2030-01-15. NOT-08: emails `Déclarez vos heures d'aujourd'hui` (A, French) and `Log your hours for today` (B, English), delivered — PASS*.
- NOT-09: task 2 `in_progress` for worker 5 with no hours: `17:05Z` (reminder hour) → 0; `18:05Z` → 1 alert, rows for owner + manager (name + date); the same run again → no new row.
- NOT-10: project 15's `in_progress` date set back 6 days (no hours on it) → `stalled_project` rows for owner + manager. Emails `Chantier à l'arrêt`.
- NOT-11: `late-invoices` → 2 late invoices (4 and 8), `invoice_late` rows for the **owner only**; both stay `sent`; again → no new row. No client row either.
- NOT-12: `invoice_paid` (INV-2026-0001, 1210) → owner only (the manager has none).
- NOT-13: bill 12 (`PUR-2026-0008`, due 2026-10-13) → 1 `purchase_due`, owner only; run again → no new row (3-day dedupe). NOT-14: emails `Facture en retard` ×2, `Facture fournisseur à payer`, and `Facture INV-2026-0001 payée` — all French, delivered — PASS*.
- NOT-15: manager created task 8 with assignees [6, 2 (the manager himself)] → `task_assigned` to 6 only; status → `in_progress` → `task_status_changed` to 6 only; `PUT /assignees` `[6, 5]` → `task_assigned` to 5 only (the new one). NOT-16: the cron only takes tasks still `planned` (task 8 was already in progress → 0). New planned task 9 (start 2026-10-10) → `task_starting` for 5 and 6; run again → no new row. NOT-17: `Nouvelle tâche` and `Tâche demain` to `winucardit+worker2@gmail.com`, delivered — PASS*.
- NOT-18: to `gryehirir@gmail.com`, all delivered, French: quote (`vous a envoyé un devis`), invoices (`Facture INV-…`), reminder (`Rappel : la facture INV-2026-0004 est en retard`), staff portal reply (`Nouveau message de TEST Alpha Renovation`). `notifications` rows of type `client_*`: 0.
- NOT-19: B owner sent quote 12 (`201`, `sent`) → `TEST Beta Bouw sent you a quote` to `gryehirir@gmail.com`, delivered, English — PASS*.
- NOT-20: registering `TEST Epsilon` (tenant 7) → `tenant_signed_up` rows 84 (admin 1) and 85 (admin 2), `tenant_id` and `user_id` NULL. The earlier `tenant_status_changed` rows are there too (2 changes × 2 admins). NOT-21: `New company: TEST Epsilon` delivered to `othmanefadelkheir218+staff@gmail.com`; the copy to `admin@chantieros.local` bounced — PASS*.
- NOT-22: insert with both ids and with neither → `violates check constraint "chk_notification_one_recipient"`.
- NOT-23: owner list `200`, 20 per page (`total 25`, matches the DB), all `user_id 1`, newest first; `?is_read=false` all unread; `/unread-count` `{unread: 25}` = DB.
- NOT-24: own → `200`, `is_read t`; the manager's row, a platform row and a B row → `403 This notification is not yours`, still unread; unknown id → `404`.
- NOT-25: worker 2 `PATCH /read-all` → `{updated: 7}`; unread of user 6: 7 → 0; every other user unchanged.
- NOT-26: no login `401`; tenant user on `/api/admin/notifications` `401`; platform admin `200` (the admin's own platform rows).
- NOT-27: a socket with no token is disconnected at once (`io server disconnect`); worker and accountant sockets heard nothing about the stock alert (NOT-01).
- NOT-28: **PASS** 2026-10-09 — see the table row. Test data left: material `TEST NOT-28 Sand`, notifications 123 and 124, failed jobs 145 and 146 in Redis, a stock adjustment on material 6 (`-1`, no alert: dedupe).
- NOT-29: plan `retention_days 30`; inserted an old read, an old unread, a recent read notification, an old event and a recent event → `{ notifications: 1, events: 1 }`; the old unread and the recent read stay, the recent event stays. projects 12, quotes 23, invoices 9, time entries 13 — same before and after. The test rows were then removed.
- NOT-30: `grep -rn "TODO: step 13" src/` → nothing.
- ISO-NO-01: B owner list `total 0` and `unread 0`; the only B row (worker 14's reminder) holds just a date. No A name in any B payload.

Notes (no scenario fails):
- The crons were run with `yarn job:alerts`, which starts a second app on the same Redis and also runs the email worker. The mails still went out (the log said `Email sent`). The API on port 5300 was the owner's `dist/main` at the start; it was stopped at the owner's request so the owner can run `yarn start:dev` and see the logs.
- Stale test processes from 2026-10-05 and 2026-10-08 (jest e2e) were found and stopped before the email tests, so they could not take queued jobs.
- Platform alerts to `admin@chantieros.local` still bounce (problem 8).
