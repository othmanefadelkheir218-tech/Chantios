# ChantierOS — Business Logic Overview (plain-English recap)

> This file is a simple recap for the founder, written from the docs in `doc/` (scenarios, dashboard pages, schema, tech stack, testing issues). Use it as a quick refresher before deep dives into one module.
> ****Status: v1 (working draft).** This reflects the docs as they exist today. When we find a better rule during discussion, we update it here — nothing in this file is final/locked.

## What is ChantierOS?

A SaaS app for renovation/construction companies. Each company is a "tenant". The app manages their clients, quotes, projects, money, and workers.

## The main flow (one project's life)

1. **Client** calls. Company creates a client card (name, phone, type).
2. **Project** is created for that client. Status starts at `prospect`.
3. **Devis (quote)** is built inside the project (line items + VAT). Client accepts it → devis = `accepte`, project auto-switches to `en_cours`. Client refuses → project stays `prospect`.
4. **Planning (Gantt)** — tasks are scheduled. Each task must be assigned to a real employee account (not free text), because that employee will log hours later.
5. **Execution** — three costs happen during the work:
   - **Stock**: materials are taken from a company-wide shared stock (not per-project). Low stock triggers an alert.
   - **Sous-traitance**: if the company hires an outside worker (e.g. plumber), that cost is tracked separately as a "purchase invoice" (`facture_achat`), linked to the project.
   - **Pointages**: employees log daily hours per project.
6. **Marge (margin)**: budget vs. real cost (materials + subcontractor + labor hours). If real cost gets close to budget before work is finished, it's a warning — losing profitability.
7. **Factures (invoices)**: money the client owes. Can be partial (deposit) then final. Status: `brouillon → envoyée → payée` (or `retard` if late). Payment is confirmed **manually** by staff, no bank auto-sync yet.
8. **Client portal**: a link (no login, valid 90 days) the company generates manually. Client sees quote, progress, invoices — read-only, real-time.

## Key business rules to remember

- **Two separate money flows**: `facture` = client pays company (in). `facture_achat` = company pays subcontractor/supplier (out). Margin = in − out.
- **Stock is shared** across all active projects, not per-project — this is where shortages happen.
- **Tasks/hours must link to a real employee account** — no typed names.
- **Employee hourly rate (`taux_horaire`) is set by the tenant on each employee** and can be changed anytime. When hours are logged, the rate is frozen on the `pointages` row — so past margin calculations never shift even if the salary changes later. See `planning-pointages.md` for full details.
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
| 3 | conducteur | Site Supervisor | true |
| 4 | chef_chantier | Team Leader | true |
| 5 | ouvrier | Worker | true |
| 6 | commercial | Sales | true |
| 7 | comptable | Accountant | true |

`users.role_id` points to this table (foreign key). Only the Admin can add or deactivate roles.

> **Seed file**: on first deploy, a seed script inserts all default roles into the `roles` table. Staff never types role names by hand.

### Access by role

| Role | Access |
| --- | --- |
| `admin` | Full dashboard — clients, projects, money, team |
| `manager` | Dashboard — limited (no billing, no team management) |
| `conducteur` / `chef_chantier` | Projects + planning + pointages |
| `ouvrier` | Mobile only — my tasks + log my hours |
| `commercial` | Clients + quotes only |
| `comptable` | Invoices + margins only |
| Super-admin (`admin_users`) | Full platform — all companies |
| Client | Portal link only — read-only |

## Known bugs (from testing doc)

- Quote/invoice creatable with no client → shows `NaN` total.
- Project end date can be before start date (no validation).
- Project status changeable to anything, no rules.
- Subcontractor can't be edited after creation; phone not validated.
- Catalogue and stock are disconnected (should be linked).

The `SchemaPropos.md` doc is the fix for all these bugs (proper foreign keys, enums, ledgers instead of running totals).

## VAT (TVA) in Devis and Invoices set by company Owners (tenants)

| Field | What it is |
| --- | --- |
| `taux_tva` | The VAT rate (e.g. 21) |
| HT | Price without VAT |
| TTC | Price with VAT added |
| Who sets it | Staff, when creating the quote |
| Default | 21.00% |

Formula: `Total TTC = sum of line items (HT) × (1 + taux_tva / 100)`

## Related docs

- `doc/ChantieOs senarios and explaination.md` — full scenario + Q&A
- `doc/ChantieOs dashbord pages.md` — pages by role
- `doc/SchemaPropos.md` — database schema
- `doc/Tech Stack.md` — backend stack
- `doc/ChantierOS — Issues found while testing (live app).md` — bug list