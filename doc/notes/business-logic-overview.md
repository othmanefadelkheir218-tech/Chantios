# ChantierOS — Business Logic Overview (plain-English recap)

> This file is a simple recap for the founder, written from the docs in `doc/` (scenarios, dashboard pages, schema, tech stack, testing issues). Use it as a quick refresher before deep dives into one module.
>
> **Status: v1 (working draft).** This reflects the docs as they exist today. When we find a better rule during discussion, we update it here — nothing in this file is final/locked.

## What is ChantierOS?
A SaaS app for renovation/construction companies. Each company is a "tenant". The app manages their clients, quotes, projects, money, and workers.

## The main flow (one project's life)
1. **Client** calls. Company creates a client card (name, phone, type).
2. **Project** is created for that client. Status starts at `prospect`.
3. **Devis (quote)** is built inside the project (line items + VAT). Client accepts it → quote status = `accepté`, project auto-switches to `en_cours`.
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
- Everything is scoped by `tenant_id` (each company's data is isolated).

## Roles
- **Super-admin**: manages the whole platform (all companies).
- **Company admin/manager**: uses the dashboard (clients, projects, money, team).
- **Normal employee** (`ouvrier`): mobile-only, sees just "my tasks" + "log my hours" — no access to money/clients.
- **Client**: only the portal link, read-only.

## Known bugs (from testing doc)
- Quote/invoice creatable with no client → shows `NaN` total.
- Project end date can be before start date (no validation).
- Project status changeable to anything, no rules.
- Subcontractor can't be edited after creation; phone not validated.
- Catalogue and stock are disconnected (should be linked).

The `SchemaPropos.md` doc is the fix for all these bugs (proper foreign keys, enums, ledgers instead of running totals).

## Related docs
- `doc/ChantieOs senarios and explaination.md` — full scenario + Q&A
- `doc/ChantieOs dashbord pages.md` — pages by role
- `doc/SchemaPropos.md` — database schema
- `doc/Tech Stack.md` — backend stack
- `doc/ChantierOS — Issues found while testing (live app).md` — bug list
