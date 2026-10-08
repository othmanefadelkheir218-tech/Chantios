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
| NOT-01 | Stock 50, minimum 10 (new `TEST Sand`), adjustment `-45` | one `low_stock` row for owner and manager, none for worker or accountant; both sockets get `notification`; 2 emails | todo |
| NOT-02 | **[CHECK EMAIL]** owner + manager — low stock, French | received | todo |
| NOT-03 | A second movement the same day | nothing new (once a day per material) | todo |
| NOT-04 | `reservation_unmet` from phase 11 STK-16 | rows exist, same recipients, once a day | todo |
| NOT-05 | Margin alerts from phase 12 section 3 | 2 warnings + 1 critical per recipient, no duplicates | todo |

## 2. Time

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-06 | Abnormal hours from phase 10 TIME-04 | one `abnormal_hours` each for owner and manager (name + total); editing the same day adds none | todo |
| NOT-07 | End of day: `end-of-day-reminder 2030-01-15T17:05:00Z` / `22:05Z` / `03:05Z` | A (Brussels 18:00) only / B (New York 17:00) only / nobody; only workers with no hours that local day | todo |
| NOT-08 | **[CHECK EMAIL]** `winucardit@gmail.com` — end-of-day reminder | received | todo |
| NOT-09 | Missing timesheet, one hour after the reminder time, worker with a task `in_progress` and no hours | `missing_timesheet` to owner + manager; silent at the reminder hour; once a day | todo |
| NOT-10 | Stalled project: `in_progress` 5 days, no hours 5 days | `stalled_project` | todo |

## 3. Billing

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-11 | `late-invoices` | one `invoice_late` for the **owner only**; the invoice status stays `sent`; again the same week → nothing | todo |
| NOT-12 | `invoice_paid` from phase 08 INV-06 | owner only | todo |
| NOT-13 | `purchase-due`: unpaid supplier bill due within 7 days | `purchase_due` for the owner; once every 3 days per bill | todo |
| NOT-14 | **[CHECK EMAIL]** owner — invoice late, invoice paid, purchase due | received | todo |

## 4. Tasks

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-15 | New task with worker 2 as assignee | `task_assigned` to worker 2, never to the person who assigned; status change → `task_status_changed`; re-setting assignees tells only the **new** ones | todo |
| NOT-16 | `task-starting` for a task starting tomorrow (company time) | `task_starting` to its workers, once per task | todo |
| NOT-17 | **[CHECK EMAIL]** `winucardit+worker2@gmail.com` (same inbox as `winucardit@`) — task assigned | received | todo |

## 5. Client emails — no row

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-18 | Quote sent, invoice sent, reminder, staff reply in the portal thread (phases 08, 14) | each one email to `gryehirir@gmail.com`, **no** `notifications` row; A's are French | todo |
| NOT-19 | B sends a quote to its client (`gryehirir@gmail.com`, created in phase 06 CLI-05) | **[CHECK EMAIL]** the email is in **English** (B's locale) | todo |

## 6. Platform alerts

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-20 | `tenant_signed_up` (phase 03), `tenant_status_changed` (phase 03 SUS) | rows with `admin_user_id` set, `tenant_id` and `user_id` NULL — one per active platform admin | todo |
| NOT-21 | **[CHECK EMAIL]** `othmanefadelkheir218+staff@gmail.com` | the platform emails arrived | todo |
| NOT-22 | DB insert with both `user_id` and `admin_user_id`; with neither | refused `chk_notification_one_recipient` | todo |

## 7. Reading and marking

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-23 | `GET /api/notifications`, `?is_read=false`, `/unread-count` | only the caller's rows, newest first | todo |
| NOT-24 | Mark own → `200`; another user's, a platform row, B's → `403` and still unread; unknown → `404` | as stated | todo |
| NOT-25 | `PATCH /read-all` | only the caller's rows | todo |
| NOT-26 | No login `401`; a tenant user on `/api/admin/notifications` `401`; platform admin there `200` | as stated | todo |
| NOT-27 | Sockets: no token refused; the worker hears nothing about stock | as stated | todo |

## 8. Failure and retention

| ID | Do | Expected | Result |
|---|---|---|---|
| NOT-28 | Restart the API with `RESEND_API_KEY=bad`, trigger a low-stock alert | the row exists and the socket event arrives; the email job fails 3 times and lands in BullMQ's failed set. Restart with the real key after | todo |
| NOT-29 | `retention` with plan `retention_days 30`: an old read notification, an old unread one, an old analytics event, a recent read one | only the old **read** notification and the old event are deleted; projects, quotes, invoices, hours untouched | todo |
| NOT-30 | `grep -rn "TODO: step 13" src/` | nothing | todo |
| ISO-NO-01 | B's list holds only B's rows; no A alert carries B data | as stated | todo |
