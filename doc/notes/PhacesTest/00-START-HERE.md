# ChantierOS — Full Test Run (START HERE)

> The clean test plan for the whole v1 backend. One file per phase, in the order we run them.
> The old scenario files in [../test/](../test/) stay as reference. When the two disagree, **this folder wins for how to test** and `doc/notes/*.md` wins for the rule.

---

## 1. Rules for this run

| Rule | |
|---|---|
| **No code change** | A failed test is written down (what was sent, what came back, why), never fixed during the run |
| **Continue on failure** | A failure does not stop the run. It is sent on Telegram at once and logged in [RESULTS.md](RESULTS.md) |
| **Keep the data** | No cleanup after a phase. Data from one phase is used by the next |
| **Start empty** | The database was emptied on 2026-10-08 (all 52 tables, structure and migrations kept). Phase 01 adds only the reference data and the super-admin |
| **No demo companies** | `yarn seed:tenants` is **not** run. Every company and user is created through the API, with the real email addresses below |

---

## 2. Order

| # | File | What |
|---|---|---|
| 01 | [01-setup-automatic.md](01-setup-automatic.md) | Start the stack, seed reference data, automatic tests |
| 02 | [02-platform.md](02-platform.md) | Platform admin, tenants, admin users, the small test plans, audit, analytics, feedback |
| 03 | [03-auth.md](03-auth.md) | Register 2 companies, login, refresh, sessions, reset, verify, invitations for all 7 roles, PIN, admin 2FA |
| 04 | [04-permissions.md](04-permissions.md) | The full 7 roles × 16 modules matrix, overrides, `scope = own`, company isolation |
| 05 | [05-media.md](05-media.md) | Upload, rename, trash, restore, hard delete, purge, avatar, logo |
| 06 | [06-clients-projects.md](06-clients-projects.md) | Clients, projects, the status matrix, prospect-only delete |
| 07 | [07-catalogue-stock.md](07-catalogue-stock.md) | Categories, services + recipe, materials, the ledger, reservations |
| 08 | [08-quotes-invoices.md](08-quotes-invoices.md) | Quotes, VAT, numbering, acceptance chain, invoices, payments |
| 09 | [09-purchases.md](09-purchases.md) | Subcontractors, contracts, suppliers, cost types, purchase invoices |
| 10 | [10-planning-time.md](10-planning-time.md) | Tasks, assignees, time entries, the day rule, frozen rate |
| 11 | [11-site-reports.md](11-site-reports.md) | Reports, progress, material declaration, report crons |
| 12 | [12-margin.md](12-margin.md) | Live margin, breakdown, 80/95 alerts, closure snapshot |
| 13 | [13-chat.md](13-chat.md) | Conversations, sockets, attachments, read tracking, admin support door |
| 14 | [14-client-portal.md](14-client-portal.md) | Portal link, the 3 checks, allow-list, accept/refuse, documents |
| 15 | [15-notifications.md](15-notifications.md) | The one dispatch door, every alert, crons, client emails |
| 16 | [16-documents.md](16-documents.md) | Quote/invoice PDF, freezing, VAT block, email attachment |
| 17 | [17-support-feedback.md](17-support-feedback.md) | Tickets, feedback, analytics, impersonation |
| 18 | [18-subscriptions-stripe.md](18-subscriptions-stripe.md) | Plan limits, overage, the storage downgrade gate, Stripe webhooks, renewal |

Results of every phase: [RESULTS.md](RESULTS.md).

Plan limits are tested at the end (phase 18) on purpose: by then the company has workers, clients, subcontractors and files, so every dimension has real usage to count.

---

## 3. The people

All emails are real inboxes. Gmail `+tags` (`name+tag@gmail.com`) arrive in the same inbox as `name@gmail.com` but count as a different address for the app, so one inbox can hold several test roles.

| Who | Email | Role | Company |
|---|---|---|---|
| Platform super-admin | `admin@chantieros.local` (from `.env`) | `super_admin` | platform |
| Platform staff | `othmanefadelkheir218+staff@gmail.com` | `staff` | platform |
| Company A owner | `othmanefadelkheir218@gmail.com` | `admin` (1) | **A — TEST Alpha Renovation** |
| Manager | `zakariyazouazou@gmail.com` | `manager` (2) | A |
| Site supervisor | `zakariyazouazou+supervisor@gmail.com` | `site_supervisor` (3) | A |
| Team leader | `zakariyazouazou+leader@gmail.com` | `team_leader` (4) | A |
| Worker | `winucardit@gmail.com` | `worker` (5) | A |
| Worker 2 | `winucardit+worker2@gmail.com` | `worker` (5) | A |
| Sales | `zakariyazouazou+sales@gmail.com` | `sales` (6) | A |
| Accountant | `zakariyazouazou+accountant@gmail.com` | `accountant` (7) | A |
| Company B owner | `industrytechnology198@gmail.com` | `admin` (1) | **B — TEST Beta Bouw** (isolation only) |
| Client of A | `gryehirir@gmail.com` | client — no login, portal only | A |

Passwords: `TestPass@2026!` for every tenant user, `TestStaff@2026!` for the platform staff admin. Worker PINs: `1234` (worker), `5678` (worker 2).

Company A has 6 non-worker users and 2 workers. With the `TEST Small` plan (3 managers, 2 workers) this puts A **over** its manager allowance on purpose — phase 18 bills it.

---

## 4. The small test plans

Created in phase 02. Small numbers so every limit is easy to reach.

| Plan | Base | `max_workers` | `max_managers` | `max_clients` | `max_subcontractors` | `storage_gb` | `retention_days` |
|---|---|---|---|---|---|---|---|
| `TEST Small` (default) | `10.00` | 2 / `2.00` | 3 / `5.00` | 3 / `1.00` | 2 / `1.00` | 1 / `0.50` | 30 |
| `TEST Zero Storage` | `5.00` | 2 / `2.00` | 3 / `5.00` | 3 / `1.00` | 2 / `1.00` | **0** / `0` | 30 |
| `TEST Big` | `50.00` | 50 / `1.00` | 20 / `1.00` | 500 / `0.10` | 100 / `0.10` | 10 / `0.20` | 365 |

Format: `limit / overage_rate`. `storage_gb` is a whole number of GB (the column is `INT`) — 50 MB is not possible. The storage downgrade gate is tested by moving to `TEST Zero Storage`: one small file is already "above 0".

---

## 5. Telegram — how you are kept up to date

Messages go through `push.json` → the running `node telegram-bot.js`. If `push.json` does not reset to `{}` within a few seconds, the bot is restarted and the message sent again.

| When | Message |
|---|---|
| A phase starts | `START phase NN — <name>` |
| A test fails | `FAIL <ID> — <what was expected> / <what came back>` — at once, the run continues |
| You must check something | One of the tags below, with exactly what to look for |
| A phase ends | `END phase NN — X passed, Y failed, Z skipped` |

### The "you check" tags

| Tag in the files | What you do |
|---|---|
| **[CHECK EMAIL]** | Open the named inbox, find the named email, reply "ok" or "not received" |
| **[SEND ME CODE]** | Copy the code or the token from the email, send it back (Telegram reply or chat) |
| **[CHECK IMAGEKIT]** | Open the ImageKit media library, folder named in the message, confirm the file is there / gone |
| **[CHECK STRIPE]** | Open the Stripe **ChantierOS sandbox** dashboard, confirm what the message says |
| **[PAY]** | Make the payment described, with the card given in the message |

**Your answers come back through Telegram.** Reply to the bot directly (code, token, "ok"). The bot writes your last message to `inbox.json`; it is read before asking again, and acknowledged through `outbox.json` (see `CLAUDE.md` § "Reading the owner's replies from Telegram").

An invitation or reset link looks like `<APP_URL>/invitations/accept?token=XXXX`. There is no frontend, so the link will not open a page — just send the `token=` part.

### Test cards (Stripe test mode)

| Case | Card |
|---|---|
| Payment succeeds | `4242 4242 4242 4242` |
| Generic decline | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |
| 3D Secure required | `4000 0025 0000 3155` |

Any future expiry, any CVC, any postal code.

**Important:** the app has **no checkout page** today (no route creates a Stripe Checkout session). So in phase 18 payments are made through the Stripe CLI (`stripe trigger`, which pays with Stripe's own test card), not by you typing a card. A **[PAY]** request is only sent if a real payment page is ever needed.

---

## 6. Running the requests

| Thing | Value |
|---|---|
| API | `http://localhost:5300/api` (`yarn start:dev`) |
| Webhooks | `stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,customer.subscription.deleted,invoice.upcoming --forward-to localhost:5300/api/webhooks/stripe` |
| Database | `docker exec chantieros_postgres psql -U chantieros -d chantieros` |
| Cookies | one cookie file per person in the scratchpad (`jar-<role>.txt`) |

Facts true for every route:

- **Login limit:** 5 logins per minute per address. Logins are spaced and cookie files reused.
- **Access cookie lasts 15 min.** Log in again on `401 Invalid or expired session`.
- Keys are `snake_case`. Money is a string. A trailing zero is dropped (`"21"`, not `"21.00"`).
- Unknown body fields → `400`. A non-integer path id → `400`. An unknown id → `404`.
- Another company's row always answers `404`, never `403` — it must look like it does not exist.
- Every record created starts with `TEST`.

---

## 7. Marks

| Mark | Meaning |
|---|---|
| `PASS` | Every line of *Expected* is true |
| `FAIL` | Something differs — the status, the body and what was sent are written in RESULTS.md |
| `SKIP` | Not run, with the reason |
| `todo` | Not run yet |

---

## 8. Known before we start (not bugs found by this run)

| Item | Where it is tracked |
|---|---|
| `yarn seed:reset` fails on Prisma 7 (`--skip-seed` was removed) | found 2026-10-08, listed in RESULTS.md |
| No bank details on the invoice payment block | open question 11 |
| `usage_spike` threshold (90% storage) is a placeholder | open question 12 |
| A tenant created by the super-admin gets no subscription row | open question 8 |
| A negative `payments` row is impossible (`CHECK amount > 0`) though a note describes one | [../test/10-quotes-invoices.md](../test/10-quotes-invoices.md) § 4 |
| Deactivating a platform admin does not log them out; nothing stops deactivating the last super-admin | [../test/02-admin-users.md](../test/02-admin-users.md) |
| No route to switch admin 2FA on — tested by setting `totp_secret` in the DB | phase 03 |
| Platform alerts have no dedup | [../test/20-support-feedback.md](../test/20-support-feedback.md) |
| Renewal is not one transaction across snapshot → Stripe → period roll | [../test/18-subscriptions-stripe.md](../test/18-subscriptions-stripe.md) |
