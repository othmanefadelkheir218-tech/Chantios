# ChantierOS — Business Logic Overview (plain-English recap)

> This file is a simple recap for the founder, written from the docs in `doc/` (scenarios, dashboard pages, schema, tech stack, testing issues). Use it as a quick refresher before deep dives into one module.
> ****Status: v1 (working draft).** This reflects the docs as they exist today. When we find a better rule during discussion, we update it here — nothing in this file is final/locked.

## What is ChantierOS?

A SaaS app for renovation/construction companies. Each company is a "tenant". The app manages their clients, quotes, projects, money, and workers.

## The main flow (one project's life)

1. **Client** calls. Company creates a client card (name, phone, type).
2. **Project** is created for that client. Status starts at `prospect`.
3. **Quote (quote)** is built inside the project (line items + VAT). It is sent, and the client answers in the portal with an Accept or Refuse button (staff can also answer for them by phone). Accepted → project auto-switches to `in_progress`. Refused → project stays `prospect`.
4. **Planning (Gantt)** — tasks are scheduled. Each task gets one or more real employee accounts through `task_assignees` (never free text), because those employees will log hours later.
5. **Execution** — three costs happen during the work:
   - **Stock**: materials are taken from a company-wide shared stock (not per-project). Low stock triggers an alert.
   - **Subcontracting**: if the company hires an outside worker (e.g. plumber), that cost is tracked separately as a "purchase invoice" (`purchase_invoice`), linked to the project.
   - **Time Entries**: employees log daily hours per project.
6. **Margin (margin)**: budget vs. real cost (materials + subcontractor + labor hours). If real cost gets close to budget before work is finished, it's a warning — losing profitability.
7. **Invoices (invoices)**: money the client owes. Can be partial (deposit) then final. Status: `draft → sent → partially_paid → paid`. There is no `overdue` status — late is calculated from `due_date` and the balance. Payment is confirmed **manually** by staff, no bank auto-sync yet.
8. **Client portal**: a link (no login, valid 90 days) the company generates manually. Client sees quote, progress, invoices — read-only, real-time.

## Key business rules to remember

- **Two separate money flows**: `invoice` = client pays company (in). `purchase_invoice` = company pays subcontractor/supplier (out). Margin = in − out.
- **Material cost has one source only**: the stock ledger, when material is consumed. A supplier bill never counts in a project margin, or the same tiles would be counted twice.
- **Stock is shared** across all active projects, not per-project — this is where shortages happen.
- **Tasks/hours must link to a real employee account** — no typed names.
- **One email belongs to one company.** `users.email` is unique across the whole app, because login has no company field.
- **Employee hourly rate (`hourly_rate`) is set by the tenant on each employee** and can be changed anytime. When hours are logged, the rate is frozen on the `time_entries` row — so past margin calculations never shift even if the salary changes later. See `planning-time-entries.md` for full details.
- Everything is scoped by `tenant_id` (each company's data is isolated).

## Roles

There are **2 separate user tables** — they never mix:

- **`admin_users`** — ChantierOS platform level (super admin). Sees all companies.
- **`users`** — Tenant level. Scoped by `tenant_id`. Sees only their own company.

### `roles` table (v1, decided)

Roles are **not a hardcoded enum** — they live in their own `roles` table, inserted once via a seed file on first deploy. This allows adding new roles later without changing the database structure.

| id | name | label | active |
| --- | --- | --- | --- |
| 1 | admin | Main Manager | true |
| 2 | manager | Sub Manager | true |
| 3 | site_supervisor | Site Supervisor | true |
| 4 | team_leader | Team Leader | true |
| 5 | worker | Worker | true |
| 6 | sales | Sales | true |
| 7 | accountant | Accountant | true |

`users.role_id` points to this table (foreign key). Only the Admin can add or deactivate roles.

> **Seed file**: on first deploy, a seed script inserts all default roles into the `roles` table. Staff never types role names by hand.

### Access by role

| Role | Access |
| --- | --- |
| `admin` | Full dashboard — clients, projects, money, team |
| `manager` | Dashboard — limited (no billing, no team management) |
| `site_supervisor` / `team_leader` | Projects + planning + time_entries |
| `worker` | Mobile only — my tasks + log my hours |
| `sales` | Clients + quotes only |
| `accountant` | Invoices + margins only |
| Super-admin (`admin_users`) | Full platform — all companies |
| Client | Portal link only — read-only |

## Known bugs (from testing doc)

- Quote/invoice creatable with no client → shows `NaN` total.
- Project end date can be before start date (no validation).
- Project status changeable to anything, no rules.
- Subcontractor can't be edited after creation; phone not validated.
- Catalogue and stock are disconnected (should be linked).

The `Schema Proposal.md` doc is the fix for all these bugs (proper foreign keys, enums, ledgers instead of running totals).

## VAT (TVA) in Quote and Invoices set by company Owners (tenants)

| Field | What it is |
| --- | --- |
| `vat_rate` | The VAT rate **on one line** (e.g. 21, or 6) |
| `default_vat_rate` | The pre-fill for new lines — on `tenants`, copied to each document |
| `amount_excl_vat` | Document price without VAT |
| `vat_amount` | VAT, summed per rate group |
| `amount_incl_vat` | Document price with VAT added |
| Who sets it | The tenant sets the default; staff can change it on any line |
| Default | 21.00% |

**The rate is per line, not per document.** Belgian renovation work is often 6% while supplies on the same job are 21%, so one document holds both. VAT is grouped by rate, rounded once per group, then summed. Full formula in `notes/entity-fields.md` § VAT.

## Related docs

- `doc/Scenarios and Explanation.md` — full scenario + Q&A
- `doc/Dashboard Pages.md` — pages by role
- `doc/Schema Proposal.md` — database schema
- `doc/Tech Stack.md` — backend stack
- `doc/Issues Found While Testing.md` — bug list