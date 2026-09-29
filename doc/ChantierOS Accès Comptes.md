# ChantierOS — Accès & Comptes de test

> Document confidentiel — à ne pas partager

**URL principale :** https://chantier-os.fadelkheir.eu

---

## 1. Super Admin — Accès Back-Office Interne

Accès réservé à l'équipe ChantierOS. Gestion de tous les clients, abonnements, agents IA, tickets support et monitoring.

| Champ | Valeur |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/admin/login |
| Email | admin@chantier-os.com |
| Mot de passe | Admin2026! |
| Rôle | super_admin — accès complet à toutes les sections |

**Ce que vous verrez en vous connectant :**
- Dashboard global — MRR, ARR, top clients, alertes système
- Entreprises clientes — liste + fiche détail + suspendre/réactiver
- Abonnements — MRR par plan (Starter / Pro / Business)
- Agents IA — consommation tokens et coûts par agent
- Tokens & Coûts — dépenses IA par client ce mois
- Support — tickets ouverts, en cours, résolus
- Onboarding — progression de chaque nouveau client
- Monitoring — état des 6 services (DB, Next.js, Claude API…)
- Logs & Audit — historique RGPD de toutes les actions
- Feedback produit — demandes clients triées par votes

---

## 2. Client Pilote — New Détroit (Tenant 1)

Compte de démonstration complet avec données réelles. C'est le compte principal pour tester toutes les fonctionnalités.

| Champ | Valeur |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/login |
| Email | admin@newdetroit.be |
| Mot de passe | Admin2026! |
| Rôle | admin — accès complet au tenant |
| Plan | Pro (179€/mois) |

**Données déjà présentes dans ce compte :**
- 3 clients (Martin Dubois, Société Materne, Jean Lecomte)
- 3 projets (Rénovation cuisine, Isolation façade, Chantier Materne)
- 2 devis avec lignes détaillées (devis 1 = 13 840€ HT, devis 2 = 31 290€ HT)
- 3 factures (dont 1 partiellement payée, 1 en retard)
- 4 tâches planning Gantt (juin–juillet 2026)
- Budget chantier défini sur 3 projets
- 4 matériaux en stock (dont 1 en rupture)
- 3 sous-traitants actifs
- 3 tickets support créés
- 1 portail client généré (token actif 90 jours)

---

## 3. Deuxième Tenant — Test BTP SPRL (Tenant 2)

Second compte créé via la page /signup — pour tester l'isolation des données entre clients. Données vierges.

| Champ | Valeur |
|---|---|
| URL | https://chantier-os.fadelkheir.eu/login |
| Email | test@testbtp.be |
| Mot de passe | Test2026! |
| Rôle | admin — accès complet au tenant |
| Plan | Starter (99€/mois) |

**À vérifier avec ce compte :**
- Les données de New Détroit ne sont pas visibles (isolation multi-tenant)
- Compte vierge — vous pouvez créer vos propres clients, projets, devis
- Les agents IA fonctionnent de la même façon
- Plan Starter = 2 agents disponibles

---

## 4. Portail Client Public — Sans Compte

Lien d'accès direct pour un client final. Aucune connexion requise. Le client voit ses projets, devis et factures en temps réel.

| Champ | Valeur |
|---|---|
| URL directe | https://chantier-os.fadelkheir.eu/portail/7d68cefa-54ca-4c5a-86aa-4b2ab43a6a12 |
| Client | Client 1 — New Détroit |
| Durée validité | 90 jours (expire septembre 2026) |
| Auth requise | Aucune — accès direct par lien |

Pour générer un nouveau lien : connectez-vous en tant que New Détroit → menu Portail client → Générer un lien → Copier.

---

## 5. Liens Rapides

| Page | URL complète |
|---|---|
| Landing page (public) | https://chantier-os.fadelkheir.eu/ |
| Inscription | https://chantier-os.fadelkheir.eu/signup |
| Connexion | https://chantier-os.fadelkheir.eu/login |
| Dashboard | https://chantier-os.fadelkheir.eu/dashboard |
| Clients | https://chantier-os.fadelkheir.eu/clients |
| Projets | https://chantier-os.fadelkheir.eu/projets |
| Devis | https://chantier-os.fadelkheir.eu/devis |
| Factures | https://chantier-os.fadelkheir.eu/factures |
| Chantiers | https://chantier-os.fadelkheir.eu/chantiers |
| Planning Gantt | https://chantier-os.fadelkheir.eu/planning |
| Marges & Budget | https://chantier-os.fadelkheir.eu/marges |
| Stocks | https://chantier-os.fadelkheir.eu/stocks |
| Agents IA | https://chantier-os.fadelkheir.eu/agents |
| Validations HITL | https://chantier-os.fadelkheir.eu/hitl |
| Analytics | https://chantier-os.fadelkheir.eu/analytics |
| Sous-traitance | https://chantier-os.fadelkheir.eu/sous-traitance |
| Pointages | https://chantier-os.fadelkheir.eu/pointages |
| Portail (génération) | https://chantier-os.fadelkheir.eu/portail |
| Équipe | https://chantier-os.fadelkheir.eu/equipe |
| Connecteurs | https://chantier-os.fadelkheir.eu/connectors |
| Paramètres | https://chantier-os.fadelkheir.eu/settings |
| Admin — Login | https://chantier-os.fadelkheir.eu/admin/login |
| Admin — Dashboard | https://chantier-os.fadelkheir.eu/admin/dashboard |
| Admin — Tenants | https://chantier-os.fadelkheir.eu/admin/tenants |
| Admin — Support | https://chantier-os.fadelkheir.eu/admin/support |
| Admin — Monitoring | https://chantier-os.fadelkheir.eu/admin/monitoring |

---

## 6. Rappel — 3 Actions Avant Mise en Production

| # | Action | Où le faire | Statut |
|---|---|---|---|
| 1 | Recharger crédits Anthropic | console.anthropic.com/billing | ⚠️ Agents en démo |
| 2 | Activer PayPal Live | Plateforme → /connectors → PayPal | ⚠️ Sandbox actif |
| 3 | Configurer email (Brevo/Postmark) | Intégrer dans le code + variable env | ⚠️ Aucun email envoyé |

---

Document confidentiel — ChantierOS © 2026
