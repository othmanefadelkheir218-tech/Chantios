# ChantierOS — Full Page Inventory, by Role

Every page below is either (a) confirmed in the technical audit of the live app, (b) a dynamic/detail route implied by the module (marked **\[implied\]**), or (c) a page that's genuinely missing and needs to be built (marked **\[new\]**). Each page lists its route and what it needs to contain. A page count is given at the end of each section.

---

## 1. SUPER-ADMIN — Platform Owner (manages the whole SaaS, all tenants)

A real platform owner needs more than monitoring — they need full oversight and control over every company on the platform: create accounts manually, suspend/ban/delete a company, and drill into a company's actual business data (clients, projects, financials) for support and account-management purposes. Expanded below.

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Login (2FA) | `/admin/login` | Email + password + TOTP code. Separate auth system from tenant login. |
| 2 | Dashboard | `/admin/dashboard` | Global KPIs: MRR, ARR, total active tenants, total chantiers platform-wide, token consumption, active alerts. |
| 3 | Tenants (list) | `/admin/tenants` | Every company account: name, plan, status, created date, MRR contribution. Actions per row: suspend, ban, delete. |
| 4 | Create tenant **\[new\]** | `/admin/tenants/nouveau` | Manually create a company account from the admin side — for sales-assisted onboarding, without the client going through self-signup. |
| 5 | Tenant detail — Overview | `/admin/tenants/[id]` | Company profile: contact info, plan, status, billing history. Action buttons: **Suspend**, **Ban**, **Delete**, **Impersonate / "Log in as this company"** (for support access). |
| 6 | Tenant detail — Clients **\[new\]** | `/admin/tenants/[id]/clients` | Full list of *this company's own clients* — the super-admin can see who this tenant is doing business with. |
| 7 | Tenant detail — Projects & Margins **\[new\]** | `/admin/tenants/[id]/projets` | This tenant's projects, including their real cost, budget, and **profit/margin per project** — visible to the platform owner, not just the tenant. |
| 8 | Tenant detail — Financials **\[new\]** | `/admin/tenants/[id]/financier` | Aggregated view: this company's total revenue, total profit, outstanding/overdue invoices, payment health. |
| 9 | Tenant detail — Team **\[new\]** | `/admin/tenants/[id]/equipe` | This company's employees and roles — useful for support ("who has admin access at this company?"). |
| 10 | Subscriptions | `/admin/abonnements` | All active subscriptions across tenants, filterable by plan, MRR breakdown per plan. |
| 11 | Tokens & Costs | `/admin/tokens` | AI token balance per tenant, consumption history, recharge button (50k/150k/500k packs + custom). |
| 12 | Onboarding tracker | `/admin/onboarding` | Progress checklist per new client. |
| 13 | Agents IA (platform-wide) | `/admin/agents-ia` | AI agent activity across ALL tenants — active count, token spend per tenant, fallback/error rate. |
| 14 | Monitoring | `/admin/monitoring` | Health of core services: database, app server, AI API, Redis, backups. |
| 15 | Analytics (platform web) | `/admin/analytics` | Page-view/usage analytics across the marketing site and tenant apps. |
| 16 | Support (all tickets) | `/admin/support` | Every support ticket from every tenant, filter by status/tenant, assign to staff. |
| 17 | Support ticket detail | `/admin/support/[id]` **\[implied\]** | Full thread, attachments, internal notes, reply box. |
| 18 | Feedback board | `/admin/feedback` | Feature requests from tenants, sorted by votes, status. |
| 19 | Logs & Audit | `/admin/logs` | Full audit trail of admin + AI actions (GDPR), filterable by tenant/action/date. |
| 20 | Platform settings **\[new\]** | `/admin/settings` | Manage integration keys (email provider, payment gateway) from a UI instead of editing raw server env variables. |

**Super-Admin total: 20 pages**, plus 3 account-lifecycle actions that live on the tenant list/detail rather than as separate pages: **Suspend**, **Ban**, **Delete**, and **Impersonate ("view/log in as this company")**.

---

## 2. COMPANY DASHBOARD — Admin & Manager (the paying tenant)

### 2.1 Core (3 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Login | `/login` | Email + password, session cookie. |
| 2 | Signup | `/signup` | Company registration, plan selection, Stripe checkout. |
| 3 | Dashboard | `/dashboard` | Active projects, revenue this month, overdue invoices, upcoming deadlines, alerts. |

### 2.2 Clients & Sales (5 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Clients (list) | `/clients` | Name, type, phone, active projects count. |
| 2 | Client detail | `/clients/[id]` | Info, edit form, linked projects, linked quotes/invoices, activity history. |
| 3 | Devis (list) | `/devis` | All quotes, filterable by status. |
| 4 | New devis | `/devis/nouveau` | Client selector (required), catalogue-based line items, auto-calculated total (must not show `NaN`), VAT. |
| 5 | Devis detail/edit | `/devis/[id]/modifier` | Must be editable after creation. |

### 2.3 Projects (8 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Projects (list) | `/projets` | Title, client, status, estimated amount, dates. |
| 2 | New project | `/projets/nouveau` | Title, client (pre-filled if from a client page), status, priority, dates (validated), site address, estimated amount. |
| 3 | Project — Aperçu | `/projets/[id]` | Summary: status, dates, budget vs. real cost snapshot, quick actions. |
| 4 | Project — Communication | `/projets/[id]/communication` | Client message thread, internal notes. |
| 5 | Project — Documents | `/projets/[id]/documents` | Uploaded files/photos. |
| 6 | Project — Équipe & Sous-traitance | `/projets/[id]/equipe` | Internal team + linked subcontractors. |
| 7 | Project — Financier | `/projets/[id]/financier` | Devis, factures, factures d'achat, and margin for this project. |
| 8 | Edit project | `/projets/[id]/modifier` **\[implied\]** | Same fields as creation, for updates. |

### 2.4 Planning & Execution (4 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Planning / Gantt | `/planning` | Timeline across active projects, tasks assigned only to real employee accounts. |
| 2 | Pointages (manager view) | `/pointages` | All logged hours, filterable by employee/project/date. |
| 3 | Rapports chantier (list) | `/rapports` | Date, progress %, weather, personnel, photos. |
| 4 | Rapport detail | `/rapports/[id]` **\[implied\]** | Full report content, photo gallery. |

### 2.5 Money (5 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Factures (list) | `/factures` | Status: brouillon, envoyée, partiellement payée, payée, retard, reminder count. |
| 2 | New facture | `/factures/nouveau` | Client, linked project/devis, line items, VAT, due date. |
| 3 | Facture detail/edit | `/factures/[id]` | Manual "mark as paid" action, payment history. |
| 4 | Factures d'achat (list) | `/factures-achat` | Amounts owed to suppliers/subcontractors, must be linked to `projet_id`. |
| 5 | Marges (Margins) | `/marges` | Budget vs. real cost per project, profitability %, early-loss alerts. |

### 2.6 Resources (4 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Stocks & Matériaux | `/stocks` | Company-wide inventory, linkable to the price catalogue. |
| 2 | Catalogue de prix | `/bibliotheque` | Priced service/labor items, used by the AI agent for quotes. |
| 3 | Sous-traitance (list) | `/sous-traitance` | Directory with edit function and phone validation. |
| 4 | Sous-traitant detail/edit **\[new\]** | `/sous-traitance/[id]` | Edit info, view all contracts across projects. |

### 2.7 Team & Company (6 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Équipe (list) | `/equipe` | Employees with role. |
| 2 | Employee detail/edit **\[new\]** | `/equipe/[id]` | Edit role/permissions, view logged hours, deactivate access. |
| 3 | Paramètres (Settings) | `/settings` | Company info, plan change **(new)**, notification preferences. |
| 4 | Connecteurs | `/connectors` | Email (IMAP) and payment integration setup. |
| 5 | Support (tenant-side) **\[new\]** | `/support` | Where the company opens a ticket to the platform. |
| 6 | Support ticket detail | `/support/[id]` **\[implied\]** | Thread with platform support staff. |

### 2.8 AI Layer (2 pages)

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Agents IA (legacy) | `/agents` | Old single-shot AI tools. |
| 2 | HITL (validations) | `/hitl` | AI-proposed actions awaiting approval — needs a real executor. |

**Company Dashboard total: 3 + 5 + 8 + 4 + 5 + 4 + 6 + 2 = 37 pages**

---

## 3. NORMAL EMPLOYEES (mobile-first, restricted) — 5 pages

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Simple login **\[new\]** | `/mobile/login` | Phone number + short code. |
| 2 | My tasks today | `/mobile` | Tasks assigned to this person, today/this week. |
| 3 | Log my hours | `/mobile/pointage` | Per-project, per-day entry, tied to their own account. |
| 4 | Site report | `/mobile/rapport` | Notes + photo upload. |
| 5 | Chat (AI, scoped) | `/mobile/chat` | Simple AI chat, restricted to what an `ouvrier` role can ask. |

No access to: clients, quotes, invoices, margins, stock costs, admin data.

---

## 4. CLIENT PORTAL (public link, no login, 90-day validity) — 1 page

| \# | Page | Route | Contains |
| --- | --- | --- | --- |
| 1 | Portal view | `/portail/[token]` | Accepted quote (read-only), project progress, invoices with payment status, shared documents, contact button. |

---

## Grand total: 20 + 37 + 5 + 1 = **63 pages/views** across the whole platform

(Support pages are already counted inside the Super-Admin and Company Dashboard sections above — not counted twice.)