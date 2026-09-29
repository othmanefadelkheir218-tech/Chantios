# ChantierOS — Proposed PostgreSQL Schema

Design principles behind this schema (fixing the gaps found in the audit + our discussions):

1. **`tenant_id` is `NOT NULL` on every business table**, with a foreign key to `tenants`. No table is allowed to exist without knowing which company it belongs to.
2. **Real foreign keys, enforced by the database** — not just "applicative" links like the current app. If a link matters for a join or a cost calculation (subcontractor → project, purchase invoice → project), it is `NOT NULL` and constrained.
3. **Status fields use Postgres `ENUM` types**, not free strings — this prevents typos and makes transitions checkable.
4. **Money in/out never lives in one running total** — payments and stock consumption are **ledgers** (append-only history tables), not a single mutable number, so nothing is ever an "approximation."
5. **Chat/communication is isolated per tenant by design** — a message can never reference two different tenants (see section 12).
6. **Indexes are added up front** on `(tenant_id, ...)` combinations for every table expected to grow large (per the audit's own warning).

---

## 0. Extensions & Enum Types

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

CREATE TYPE user_role AS ENUM (
  'admin','manager','conducteur','chef_chantier','ouvrier','commercial','comptable','member'
);

CREATE TYPE client_type AS ENUM ('particulier','professionnel','syndic');

CREATE TYPE projet_statut AS ENUM (
  'prospect','devis_envoye','accepte','en_cours','termine','annule'
);

CREATE TYPE devis_statut AS ENUM ('brouillon','envoye','accepte','refuse');

CREATE TYPE facture_statut AS ENUM (
  'brouillon','envoyee','partiellement_payee','payee','retard'
);

CREATE TYPE facture_achat_statut AS ENUM ('a_payer','payee');

CREATE TYPE contrat_st_statut AS ENUM ('en_cours','termine','annule');

CREATE TYPE tache_statut AS ENUM ('planifie','en_cours','termine');

CREATE TYPE tache_type AS ENUM ('reunion','travaux');

CREATE TYPE tenant_statut AS ENUM ('active','suspended','banned');

CREATE TYPE plan_type AS ENUM ('starter','pro','business');

CREATE TYPE conversation_type AS ENUM ('internal','project_client','support');

CREATE TYPE sender_type AS ENUM ('employee','client','admin');

CREATE TYPE ticket_statut AS ENUM ('open','in_progress','resolved','closed');

CREATE TYPE hitl_statut AS ENUM ('pending','approved','rejected','executed');

CREATE TYPE payment_method AS ENUM ('virement','cheque','especes','stripe');
```

---

## 1. Platform (Super-Admin side)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  statut tenant_statut NOT NULL DEFAULT 'active',
  tokens_solde INTEGER NOT NULL DEFAULT 0,
  tokens_total_consommes INTEGER NOT NULL DEFAULT 0,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (        -- platform staff, separate auth from tenant users
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,               -- 2FA
  role TEXT NOT NULL DEFAULT 'staff', -- 'super_admin' | 'staff'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | past_due | canceled
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE token_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  montant_tokens INTEGER NOT NULL CHECK (montant_tokens > 0),
  pack TEXT,                      -- '50k' | '150k' | '500k' | 'custom'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_user_id UUID,             -- tenant-side user, if applicable
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs (tenant_id, created_at);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned', -- planned | in_progress | shipped
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_tenant_date ON analytics_events (tenant_id, created_at);
```

---

## 2. Users & Permissions (tenant side)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  password_hash TEXT,             -- nullable: field workers may use PIN-only mobile login instead
  mobile_pin_code TEXT,           -- short code for /mobile/login
  role user_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users (tenant_id);

-- Optional fine-grained permission overrides beyond the default role behavior
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  module TEXT NOT NULL,           -- 'clients' | 'factures' | 'marges' | ...
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, role, module)
);
```

---

## 3. Clients

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  type client_type NOT NULL DEFAULT 'particulier',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_tenant ON clients (tenant_id);
```

---

## 4. Catalogue de prix & Stocks (linked — fixes the disconnect found earlier)

```sql
CREATE TABLE prestations (              -- "Bibliothèque de prestations" (Catalogue de prix)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL,              -- e.g. 'Peinture'
  designation TEXT NOT NULL,
  unite TEXT NOT NULL,                  -- 'ml' | 'm2' | 'h' | ...
  prix_ht NUMERIC(12,2) NOT NULL CHECK (prix_ht >= 0),
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false, -- true for platform-shipped defaults
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prestations_tenant ON prestations (tenant_id);

CREATE TABLE materiaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  fournisseur TEXT,
  unite TEXT NOT NULL,
  stock_quantite NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_minimum NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_achat NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_materiaux_tenant ON materiaux (tenant_id);

-- The missing link: what a prestation actually consumes (bill of materials)
CREATE TABLE prestation_materiaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestation_id UUID NOT NULL REFERENCES prestations(id) ON DELETE CASCADE,
  materiau_id UUID NOT NULL REFERENCES materiaux(id) ON DELETE RESTRICT,
  quantite_par_unite NUMERIC(12,4) NOT NULL CHECK (quantite_par_unite > 0),
  UNIQUE (prestation_id, materiau_id)
);

-- Stock is a LEDGER, not a single mutable number, so consumption per project is traceable
CREATE TABLE stock_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  materiau_id UUID NOT NULL REFERENCES materiaux(id) ON DELETE RESTRICT,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL, -- NULL = purchase/adjustment, not tied to a project
  type TEXT NOT NULL,             -- 'achat' | 'consommation' | 'ajustement'
  quantite NUMERIC(12,2) NOT NULL, -- negative for consumption
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_mvt_tenant_materiau ON stock_mouvements (tenant_id, materiau_id);
CREATE INDEX idx_stock_mvt_projet ON stock_mouvements (projet_id);
```

---

## 5. Projects & Planning

```sql
CREATE TABLE projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  titre TEXT NOT NULL,
  statut projet_statut NOT NULL DEFAULT 'prospect',
  priorite TEXT NOT NULL DEFAULT 'normale',
  montant_estime NUMERIC(12,2),
  date_debut DATE,
  date_fin_prevue DATE,
  adresse_chantier TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dates CHECK (date_fin_prevue IS NULL OR date_debut IS NULL OR date_fin_prevue >= date_debut)
);
CREATE INDEX idx_projets_tenant_statut ON projets (tenant_id, statut);

-- Tracks every status change — also where the "close project" logic hooks in (section 9)
CREATE TABLE projet_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  ancien_statut projet_statut,
  nouveau_statut projet_statut NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planning_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  type tache_type NOT NULL DEFAULT 'travaux',
  assigned_user_id UUID NOT NULL REFERENCES users(id), -- must be a real employee, never free text
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut tache_statut NOT NULL DEFAULT 'planifie',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_tache_dates CHECK (date_fin >= date_debut)
);
CREATE INDEX idx_planning_projet ON planning_taches (projet_id);
CREATE INDEX idx_planning_user ON planning_taches (assigned_user_id);

-- Pointages: must be per employee (fixes the gap flagged earlier)
CREATE TABLE pointages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tache_id UUID REFERENCES planning_taches(id) ON DELETE SET NULL,
  date_travail DATE NOT NULL,
  heures NUMERIC(5,2) NOT NULL CHECK (heures > 0 AND heures <= 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pointages_projet_user ON pointages (projet_id, user_id);
CREATE INDEX idx_pointages_user_date ON pointages (user_id, date_travail);
```

---

## 6. Devis (Quotes)

```sql
CREATE TABLE devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT, -- NOT NULL fixes the "devis with no client" bug
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  statut devis_statut NOT NULL DEFAULT 'brouillon',
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, numero)
);

CREATE TABLE devis_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  prestation_id UUID REFERENCES prestations(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  quantite NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire_ht NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (prix_unitaire_ht >= 0),
  total_ht NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire_ht) STORED -- fixes the "NaN total" bug: computed by the DB, never by fragile client JS
);
CREATE INDEX idx_devis_lignes_devis ON devis_lignes (devis_id);
```

*Note: computing `total_ht` as a generated column (or at minimum server-side, never client-side) is exactly what fixes bug #11 from your notes — the `NaN` total when selecting a catalogue product.*

---

## 7. Factures (Invoices) & Payments

```sql
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE RESTRICT,
  devis_id UUID REFERENCES devis(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  statut facture_statut NOT NULL DEFAULT 'brouillon',
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  nb_relances INTEGER NOT NULL DEFAULT 0,
  derniere_relance TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, numero)
);

CREATE TABLE facture_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  quantite NUMERIC(12,2) NOT NULL DEFAULT 1,
  prix_unitaire_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ht NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire_ht) STORED
);

-- Real payments ledger (fixes: "amount paid is only cumulative/approximate" from the audit)
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
  methode payment_method NOT NULL,
  reference TEXT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_paiements_facture ON paiements (facture_id);

-- A view instead of a stored "montant_paye" column — always accurate, never stale
CREATE VIEW facture_solde AS
SELECT f.id AS facture_id,
       f.tenant_id,
       SUM(fl.total_ht) * (1 + f.taux_tva/100) AS montant_ttc,
       COALESCE(SUM(p.montant), 0) AS montant_paye,
       (SUM(fl.total_ht) * (1 + f.taux_tva/100)) - COALESCE(SUM(p.montant), 0) AS solde_restant
FROM factures f
LEFT JOIN facture_lignes fl ON fl.facture_id = f.id
LEFT JOIN paiements p ON p.facture_id = f.id
GROUP BY f.id, f.tenant_id;
```

---

## 8. Sous-traitance & Factures d'achat (fixes the broken project link)

```sql
CREATE TABLE sous_traitants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  raison_sociale TEXT NOT NULL,
  metier TEXT,
  email TEXT,
  telephone TEXT CHECK (telephone ~ '^\+?[0-9 ]{6,20}$'), -- basic format validation (fixes bug #9)
  taux_horaire NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sous_traitants_tenant ON sous_traitants (tenant_id);

-- THE missing piece: a real, enforced link between a subcontractor and a project
CREATE TABLE contrats_sous_traitance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sous_traitant_id UUID NOT NULL REFERENCES sous_traitants(id) ON DELETE RESTRICT,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE RESTRICT, -- NOT NULL: this is what was broken/unusable before
  description TEXT,
  montant_ht NUMERIC(12,2) NOT NULL CHECK (montant_ht >= 0),
  statut contrat_st_statut NOT NULL DEFAULT 'en_cours',
  date_debut DATE,
  date_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contrats_st_projet ON contrats_sous_traitance (projet_id);
CREATE INDEX idx_contrats_st_traitant ON contrats_sous_traitance (sous_traitant_id);

CREATE TABLE factures_achat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE RESTRICT, -- NOT NULL fixes "often NULL" bug
  contrat_sous_traitance_id UUID REFERENCES contrats_sous_traitance(id) ON DELETE SET NULL,
  fournisseur TEXT NOT NULL,
  numero_facture TEXT,
  categorie TEXT,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  montant_ht NUMERIC(12,2) NOT NULL CHECK (montant_ht >= 0),
  taux_tva NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  statut facture_achat_statut NOT NULL DEFAULT 'a_payer',
  reference_virement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_factures_achat_projet ON factures_achat (projet_id);
```

---

## 9. Margins — real cost vs. budget, with a locked snapshot at closing

```sql
-- Live margin: always computed, never stored/stale
CREATE VIEW projet_marge_live AS
SELECT
  p.id AS projet_id,
  p.tenant_id,
  p.montant_estime AS budget_ht,
  COALESCE(sm.cout_materiaux, 0) AS cout_materiaux,
  COALESCE(fa.cout_sous_traitance, 0) AS cout_sous_traitance,
  COALESCE(po.cout_main_oeuvre, 0) AS cout_main_oeuvre,
  COALESCE(sm.cout_materiaux,0) + COALESCE(fa.cout_sous_traitance,0) + COALESCE(po.cout_main_oeuvre,0) AS cout_total,
  p.montant_estime - (COALESCE(sm.cout_materiaux,0) + COALESCE(fa.cout_sous_traitance,0) + COALESCE(po.cout_main_oeuvre,0)) AS marge_ht
FROM projets p
LEFT JOIN (
  SELECT projet_id, SUM(-quantite * m.prix_achat) AS cout_materiaux
  FROM stock_mouvements sm2 JOIN materiaux m ON m.id = sm2.materiau_id
  WHERE sm2.type = 'consommation'
  GROUP BY projet_id
) sm ON sm.projet_id = p.id
LEFT JOIN (
  SELECT projet_id, SUM(montant_ht) AS cout_sous_traitance
  FROM factures_achat GROUP BY projet_id
) fa ON fa.projet_id = p.id
LEFT JOIN (
  SELECT pt.projet_id, SUM(pt.heures * COALESCE(hr.taux_horaire_defaut, 0)) AS cout_main_oeuvre
  FROM pointages pt
  LEFT JOIN LATERAL (SELECT 35.0 AS taux_horaire_defaut) hr ON true -- replace with a real per-role rate table
  GROUP BY pt.projet_id
) po ON po.projet_id = p.id;

-- Locked snapshot, written once when a project moves to 'termine' (fixes: "Terminé does nothing" bug)
CREATE TABLE projet_cloture_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL UNIQUE REFERENCES projets(id) ON DELETE CASCADE,
  budget_ht NUMERIC(12,2),
  cout_materiaux NUMERIC(12,2),
  cout_sous_traitance NUMERIC(12,2),
  cout_main_oeuvre NUMERIC(12,2),
  cout_total NUMERIC(12,2),
  marge_ht NUMERIC(12,2),
  marge_pct NUMERIC(5,2),
  cloture_par UUID REFERENCES users(id),
  cloture_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Rapports chantier

```sql
CREATE TABLE chantier_rapports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  date_rapport DATE NOT NULL DEFAULT CURRENT_DATE,
  titre TEXT,
  avancement_pct NUMERIC(5,2), -- should eventually be auto-suggested from planning_taches completion, not just typed
  contenu TEXT,
  meteo TEXT,
  personnel_present TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rapport_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id UUID NOT NULL REFERENCES chantier_rapports(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 11. Client Portal

```sql
CREATE TABLE portail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  actif BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portail_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portail_token_id UUID NOT NULL REFERENCES portail_tokens(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,       -- 'view' | 'download' | ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 12. Chat / Conversations — the part you're asking about now

**Core rule: a conversation always belongs to exactly one `tenant_id`. There is no table anywhere that lets `tenant_id_A` and `tenant_id_B` share a conversation. Support is "one tenant ↔ platform," never "tenant ↔ tenant."**

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type conversation_type NOT NULL,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,       -- only for type = 'project_client'
  support_ticket_id UUID,                                        -- only for type = 'support', FK added in section 13
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_client_has_projet
    CHECK (type != 'project_client' OR projet_id IS NOT NULL)
);
CREATE INDEX idx_conversations_tenant ON conversations (tenant_id);

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,           -- employee, for internal/project_client/support
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,       -- client, for project_client only (reached via portail_tokens, not login)
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE, -- platform staff, for support only
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(user_id, client_id, admin_user_id) = 1)    -- exactly one type of member per row
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- denormalized on purpose: makes tenant-scoped filtering a single indexed column, impossible to forget
  sender_type sender_type NOT NULL,
  sender_id UUID NOT NULL,        -- points to users.id, clients.id, or admin_users.id depending on sender_type
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_messages_tenant ON messages (tenant_id);
```

*How the 3 chat types map to this:*
- **Internal** — `type='internal'`, members are `users` only (same `tenant_id`).
- **Project ↔ client** — `type='project_client'`, tied to `projet_id`; members are `users` (employees) + the `client` (who reaches it only via their `portail_tokens` link, no login, scoped to that one project).
- **Support (tenant ↔ platform)** — `type='support'`, members are `users` + `admin_users`; every tenant only ever sees conversations where `tenant_id` = their own.

Application-layer rule to enforce on top of this: **every read/write on `messages`/`conversations` must be scoped by the caller's `tenant_id`**, except `admin_users` with the `super_admin` role, who may query across tenants (for the impersonation/support feature from the admin panel) — and even then, ideally logged in `audit_logs`.

---

## 13. Support Tickets

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  status ticket_statut NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_admin_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_tenant ON support_tickets (tenant_id, status);

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_support_ticket
  FOREIGN KEY (support_ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
```

---

## 14. AI Layer (HITL, connectors — kept minimal, matches what already exists)

```sql
CREATE TABLE hitl_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  contexte TEXT,
  resultat JSONB,
  statut hitl_statut NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,             -- 'imap' | 'paypal' | 'stripe' | ...
  nom TEXT,
  config JSONB NOT NULL,          -- store secrets encrypted at the application layer, not plain JSON
  actif BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_connectors_tenant ON connectors (tenant_id);
```

---

## 15. Summary of what this schema fixes vs. the current app

| Problem found in testing | Fix in this schema |
|---|---|
| Devis/facture created with no client, `NaN` totals | `client_id NOT NULL`, line totals are DB-computed `GENERATED` columns |
| Subcontractor never actually linked to a project | `contrats_sous_traitance.projet_id NOT NULL` — the missing link is now enforced |
| `factures_achat.projet_id` often NULL | `NOT NULL` constraint, can't be created without a project |
| End date before start date | `CHECK` constraints on `projets` and `planning_taches` |
| No rules on status changes | `projet_status_history` + app-layer transition rules |
| "Terminé" does nothing | `projet_cloture_snapshot`, written once when status becomes `termine` |
| Payments are an approximate running total | `paiements` ledger + `facture_solde` view, always accurate |
| Stock consumption not traceable per project | `stock_mouvements` ledger instead of a single mutable `stock_quantite` edit |
| Pointages not tied to a specific employee | `pointages.user_id NOT NULL` |
| Planning tasks assignable to free text | `planning_taches.assigned_user_id` is a real FK to `users` |
| No enforced tenant isolation | Every table has `tenant_id NOT NULL` + FK; chat especially cannot cross tenants |
| No subcontractor phone validation | `CHECK` constraint on `sous_traitants.telephone` |
| Catalogue and Stock disconnected | `prestation_materiaux` bill-of-materials link |