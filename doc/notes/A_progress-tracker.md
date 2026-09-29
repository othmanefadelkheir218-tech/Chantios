# ChantierOS — Understanding Progress Tracker

> Status: v1 (working draft). Checklist of business-logic topics discussed so far, and what's left. Update this file as we go — check a box when a topic is done.

## ✅ Done

- [x] **Overall business flow** — client → project → devis → planning → execution (stock + subcontractor + labor) → margin → invoices → client portal. See \[\[business-logic-overview\]\].

- [x] **Project status** (`projet_statut`) — meaning of each value + open question on devis→project auto-link. See \[\[qa-project-devis-stock-invoices\]\] (section 1).

- [x] **Devis vs. Invoice** — confirmed as two different documents. See \[\[qa-project-devis-stock-invoices\]\] (section 2).

- [x] **Devis status** (`devis_statut`) — meaning of each value. See \[\[qa-project-devis-stock-invoices\]\] (section 3).

- [x] **Stock logic** — `materiaux`, `stock_mouvements` (ledger), `prestation_materiaux` (recipe), no reservation system today. See \[\[qa-project-devis-stock-invoices\]\] (sections 4, 5, 7, 10) and \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Invoices, both types** — `facture` (client, money in) vs `facture_achat` (purchase, money out), statuses, why `projet_id` is required. See \[\[qa-project-devis-stock-invoices\]\] (sections 6, 8).

- [x] **Catalogue tables + cost math** — `prestations`, `categorie` (currently just text, not a table), worked numeric example, and where cost calculations actually get stored (live vs. the one-time frozen snapshot). See \[\[catalogue-stock-tables-and-cost-storage\]\].

- [x] **Sous-traitance details** — subcontractor directory (`sous_traitants`, reusable) + contract per project (`contrats_sous_traitance`, statuses `en_cours`/`termine`/`annule`) + confirmed the contract and subcontractor identity are never shown to the client invoice. See \[\[sous-traitance\]\].

- [x] **Planning & Pointages** — how tasks, assigned employees, and daily hour logs connect (`planning_taches`, `pointages`); confirmed one employee can work multiple projects; flagged the same-day total-hours gap + fix; agreed alert list. See \[\[planning-pointages\]\].

## ⬜ To do (big topics)

- [ ] **Roles & permissions** — the 8 roles (`admin`, `manager`, `conducteur`, `chef_chantier`, `ouvrier`, `commercial`, `comptable`, `member`) and `role_permissions`.

- [ ] **Client portal mechanics** — how the 90-day link is generated, tracked, kept in sync.

- [ ] **Platform / super-admin side** — tenants, subscriptions, AI token packs, audit logs, impersonation.

- [ ] **AI layer** — HITL (human-in-the-loop approvals) and connectors (email, Stripe...).

- [ ] **Chat/conversations** — the 3 chat types (internal, project↔client, support) and tenant isolation rule.

- [ ] **Known bug list review** — going through each bug from the testing doc and deciding the correct fix/rule.

## Related notes

- \[\[business-logic-overview\]\]
- \[\[qa-project-devis-stock-invoices\]\]
- \[\[catalogue-stock-tables-and-cost-storage\]\]
- \[\[sous-traitance\]\]
- \[\[planning-pointages\]\]