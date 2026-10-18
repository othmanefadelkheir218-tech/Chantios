# ChantierOS — Alerts & Notifications

> Status: v1 (working draft). See [[business-logic-overview]] for the full flow.

## Delivery — all roles

Every alert is delivered in **two ways simultaneously**:
- **In-app notification** — real-time via WebSocket
- **Email** — sent to the user's registered email

No SMS in v1. SMS (and Telegram/WhatsApp) are v2.

---

## 1. ChantierOS Admin (platform level)

| Alert | Trigger |
|---|---|
| New tenant signed up | A new company completes registration |
| Payment received | A tenant's subscription payment succeeds — shows who and how much |
| Payment failed | A tenant's payment fails — shows who and the amount |
| Tenant suspended / banned | Any tenant status change |
| Support ticket opened | A tenant opens a new support ticket |
| Unusual usage spike | Storage reaches **90%** of the plan's `storage_gb` (AI tokens: v2) |

---

## 2. Tenant Main Admin

| Alert | Trigger |
|---|---|
| New message | Any new message in a conversation they are part of |
| Payment received | Client pays an invoice — shows which invoice and amount |
| Payment failed | Client payment fails — shows which invoice |
| Subscription payment failed | ChantierOS could not charge the company's own subscription card (Stripe `payment_intent.payment_failed`) — asks to pay before the block date (now + 7 days) — **main admin only**, never the manager |
| Trial ending | 3 days before the trial ends (day 11) — "add a payment method". Once |
| Trial ended | The trial is over (day 14): the app still works for 7 days, banner on every page |
| Company blocked | 7 days after a trial end or a failed payment, still no payment: the company is blocked until it pays. Email |
| Subscription renewal upcoming | The next subscription payment is near (Stripe `invoice.upcoming`) — shows the date and amount — **main admin only**, never the manager |
| Invoice late | `due_date` has passed and `balance_due > 0` — calculated, not a stored status |
| Purchase bill due | A `purchase_invoices` due date is approaching — pay soon |
| Stock below minimum | A material drops to or below `minimum_stock` |
| Stock reservation unmet | A project reservation can't be covered — order more |
| Margin warning (80%) | Project real cost reaches 80% of budget — fires **once** per project |
| Margin critical (95%) | Project real cost reaches 95% of budget — fires **once** per project |
| Abnormal hours | An employee's same-day total across all projects goes over 12h |
| Missing site report | Project `in_progress` with no report for 3 days |
| Progress stalled | A project's `progress_pct` unchanged for 7 days |
| Project cancelled | Reminder: invoice client for completed work |
| Employee missing timesheet | Employee has a task `in_progress` today but no hours logged |
| New support reply | ChantierOS platform replied to a support ticket |

---

## 3. Tenant Sub Admin / Manager

Same as Main Admin **except**:
- No billing alerts (payment received, payment failed, subcontractor bill due, **subscription payment failed, subscription renewal upcoming**)
- Access depends on their `role_permissions`

---

## 4. Employee (`worker`)

| Alert | Trigger |
|---|---|
| New task assigned | Manager assigns a task to this employee |
| Task starting soon | Task `start_date` is tomorrow |
| End-of-day reminder | No hours logged today — fires at the tenant's configured time (default: 6pm) |
| Task status changed | Manager updates a task status |

---

## 5. Client

| Alert | Trigger |
|---|---|
| Quote sent | Company sends a quote — "please review" |
| Invoice sent | Company sends an invoice — "please pay" |
| Invoice late reminder | Invoice still unpaid past its due date |
| Project update | Optional — staff manually triggers a progress update |

Email only. No SMS in v1.

---

## Margin alert thresholds

| Level | Threshold | Message |
|---|---|---|
| Warning | Real cost = 80% of budget | "This project is approaching its budget limit" |
| Critical | Real cost = 95% of budget | "This project is over budget — immediate review needed" |

Both alerts go to **Tenant Main Admin** and **Manager**.

### Each level fires once

Margin is recomputed after every time entry, consumption and purchase invoice. A `project_margin_alerts` row per `(project_id, level)` records what was already sent, so a project sitting at 83% does not email on every save. If an accepted extra quote raises the budget and the cost drops back under the threshold, the rows are deleted and the levels can fire again. See [[margin-profitability]].

---

## Email templates & language (decided 2026-10-05, step 02)

- **Location**: `src/email/templates/`, one file per template (`invite-employee.template.ts`, `password-reset.template.ts`, `email-verification.template.ts`...) — same shape as the existing `tenant-email-verification.template.ts`. Each template function takes a `locale: 'fr' | 'en' | 'nl'` parameter and returns `{ subject, html }`. Every HTML email is built with the one shared layout in `src/email/templates/email-layout.ts` (see `DESIGN.md` § 6): navy header with the ChantiOs wordmark and a thin orange line, white rounded card, one orange button (white text) or a code box, small grey footer under the card. Every email is also sent with a plain-text version made from the HTML (`htmlToText`).
- **Which locale**: the invitation email and the password-reset email use the **tenant's** `locale` column — `clients` has no `locale` of its own, and these two emails never reach a client, only `users` of that tenant. A user's own emails always use their tenant's locale, not a personal preference (there is no per-user locale column).
- **Supported languages**: `fr` (default), `en`, `nl` (Dutch, Belgium). Arabic was removed (2026-10-09); a company still on `ar` was moved to `fr` by a migration, and an unknown locale falls back to `en`.
- **Unknown/missing locale**: falls back to `en`.

---

## End-of-day reminder time

- **Configurable per tenant** — set once by the Main Admin in Settings
- **Default**: 6pm if never changed
- Applies to all employees of that tenant

---

## Related notes
- [[business-logic-overview]]
- [[margin-profitability]]
- [[site-reports]]
- [[planning-time-entries]]
- [[catalogue-stock-tables-and-cost-storage]]
- [[subcontracting]]
