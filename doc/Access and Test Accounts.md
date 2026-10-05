# ChantierOS — Access & Test Accounts

> Confidential document — do not share

**Main URL:** https://chantier-os.fadelkheir.eu

---

## 1. Super Admin — Internal Back-Office

Reserved for the ChantierOS team. Manages all tenants, subscriptions, AI agents, support tickets and monitoring.

| Field | Value |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/admin/login |
| Email | admin@chantier-os.com |
| Password | Admin2026! |
| Role | super_admin — full access to every section |

**What you see after login:**
- Global dashboard — MRR, ARR, top tenants, system alerts
- Client companies — list + detail page + suspend/reactivate
- Subscriptions — MRR per plan (Starter / Pro / Business)
- AI agents — token consumption and cost per agent
- Tokens & costs — AI spending per tenant this month
- Support — tickets open, in progress, resolved
- Onboarding — progress of each new tenant
- Monitoring — status of the 6 services (DB, Next.js, Claude API…)
- Logs & audit — GDPR history of every action
- Product feedback — tenant requests sorted by votes

---

## 2. Pilot Tenant — New Détroit (Tenant 1)

Full demo account with real data. This is the main account for testing every feature.

| Field | Value |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/login |
| Email | admin@newdetroit.be |
| Password | Admin2026! |
| Role | admin — full access to the tenant |
| Plan | Pro (€179/month) |

**Data already in this account:**
- 3 clients (Martin Dubois, Société Materne, Jean Lecomte)
- 3 projects (Kitchen renovation, Facade insulation, Materne site)
- 2 quotes with detailed lines (quote 1 = €13,840 excl VAT, quote 2 = €31,290 excl VAT)
- 3 invoices (1 partially paid, 1 overdue)
- 4 Gantt planning tasks (June–July 2026)
- Site budget set on 3 projects
- 4 materials in stock (1 out of stock)
- 3 active subcontractors
- 3 support tickets created
- 1 client portal link generated (token active for 90 days)

---

## 3. Second Tenant — Test BTP SPRL (Tenant 2)

Second account created through the `/signup` page — used to test data isolation between tenants. Empty data.

| Field | Value |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/login |
| Email | test@testbtp.be |
| Password | Test2026! |
| Role | admin — full access to the tenant |
| Plan | Starter (€99/month) |

**What to check with this account:**
- New Détroit's data is not visible (multi-tenant isolation)
- Empty account — you can create your own clients, projects and quotes
- The AI agents work the same way
- Starter plan = 2 agents available

---

## 4. Public Client Portal — No Account

Direct access link for an end client. No login required. The client sees their projects, quotes and invoices in real time.

| Field | Value |
|---|---|
| Direct URL | https://chantier-os.fadelkheir.eu/portal/7d68cefa-54ca-4c5a-86aa-4b2ab43a6a12 |
| Client | Client 1 — New Détroit |
| Validity | 90 days (expires September 2026) |
| Auth required | None — direct link access |

To generate a new link: log in as New Détroit → **Client portal** menu → **Generate a link** → **Copy**.

---

## 5. Quick Links

| Page | Full URL |
|---|---|
| Landing page (public) | https://chantier-os.fadelkheir.eu/ |
| Sign up | https://chantier-os.fadelkheir.eu/signup |
| Log in | https://chantier-os.fadelkheir.eu/login |
| Dashboard | https://chantier-os.fadelkheir.eu/dashboard |
| Clients | https://chantier-os.fadelkheir.eu/clients |
| Projects | https://chantier-os.fadelkheir.eu/projects |
| Quotes | https://chantier-os.fadelkheir.eu/quote |
| Invoices | https://chantier-os.fadelkheir.eu/invoices |
| Sites | https://chantier-os.fadelkheir.eu/sites |
| Gantt planning | https://chantier-os.fadelkheir.eu/planning |
| Margins & budget | https://chantier-os.fadelkheir.eu/margins |
| Stock | https://chantier-os.fadelkheir.eu/stocks |
| AI agents | https://chantier-os.fadelkheir.eu/agents |
| HITL approvals | https://chantier-os.fadelkheir.eu/hitl |
| Analytics | https://chantier-os.fadelkheir.eu/analytics |
| Subcontracting | https://chantier-os.fadelkheir.eu/subcontracting |
| Time entries | https://chantier-os.fadelkheir.eu/time_entries |
| Portal (generation) | https://chantier-os.fadelkheir.eu/portal |
| Team | https://chantier-os.fadelkheir.eu/equipe |
| Connectors | https://chantier-os.fadelkheir.eu/connectors |
| Settings | https://chantier-os.fadelkheir.eu/settings |
| Admin — Login | https://chantier-os.fadelkheir.eu/admin/login |
| Admin — Dashboard | https://chantier-os.fadelkheir.eu/admin/dashboard |
| Admin — Tenants | https://chantier-os.fadelkheir.eu/admin/tenants |
| Admin — Support | https://chantier-os.fadelkheir.eu/admin/support |
| Admin — Monitoring | https://chantier-os.fadelkheir.eu/admin/monitoring |

> The live app still serves a few French routes (`/equipe`, `/quote`, `/stocks`). The rebuild uses English routes throughout — see `notes/naming-conventions.md`.

---

## 6. Reminder — 3 Actions Before Production

| # | Action | Where | Status |
|---|---|---|---|
| 1 | Top up Anthropic credits | console.anthropic.com/billing | ⚠️ Agents in demo mode |
| 2 | Enable PayPal Live | Platform → `/connectors` → PayPal | ⚠️ Sandbox active |
| 3 | Configure email (Brevo/Postmark) | Add to the code + env variable | ⚠️ No email is sent |

---

Confidential document — ChantierOS © 2026
