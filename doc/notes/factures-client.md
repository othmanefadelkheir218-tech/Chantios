# ChantierOS — Client Invoices (`factures`)

> Status: v1 (working draft). See [[business-logic-overview]] and [[qa-project-devis-stock-invoices]] for context.

## What is a `facture`?

Money the **client pays the company**. Created inside the app by staff, sent to the client.

One project can have **multiple invoices** — the company decides how many and how to split them. No fixed rule (deposit only, 3 installments, 5 installments — all valid).

> **Soft rule**: the system warns if the total of all invoices for a project doesn't match the devis amount — but it is not blocked. Staff is responsible for the final numbers.

---

## Statuses

| Status | Meaning | Set by |
|---|---|---|
| `draft` | Being prepared, not sent yet | Staff |
| `sent` | Sent to client | Staff |
| `partially_paid` | Some payments received, not full amount | Auto (from `paiements`) |
| `paid` | Fully paid | Auto (from `paiements`) |
| `overdue` | Past due date, not fully paid | **Auto** — triggers when `date_echeance` passes |

`overdue` is set automatically by the system — staff never sets it manually.

---

## Tables involved

### `factures` — the invoice header

| Field | Meaning |
|---|---|
| `client_id` | Who pays (required) |
| `projet_id` | Which project (required) |
| `devis_id` | Linked quote (optional — not every invoice needs one) |
| `numero` | Invoice number (unique per tenant) |
| `statut` | `draft` / `sent` / `partially_paid` / `paid` / `overdue` |
| `date_emission` | Issue date |
| `date_echeance` | Due date — when overdue kicks in |
| `taux_tva` | VAT rate (default 21%) |
| `nb_relances` | How many payment reminders sent |
| `derniere_relance` | Date of last reminder |

### `facture_lignes` — the line items

One row per line. Total is always DB-computed (`quantite × prix_unitaire_ht`).

| Field | Meaning |
|---|---|
| `facture_id` | Which invoice |
| `designation` | Description (e.g. "Plomberie — installation sanitaire") |
| `quantite` | Quantity |
| `prix_unitaire_ht` | Unit price without VAT |
| `total_ht` | Computed: `quantite × prix_unitaire_ht` |

### `paiements` — the payment ledger

One row per payment received. Never a running total — always a ledger.

| Field | Meaning |
|---|---|
| `facture_id` | Which invoice |
| `montant` | Amount of this payment |
| `methode` | `virement` / `cheque` / `especes` / `stripe` |
| `reference` | Payment reference (optional) |
| `date_paiement` | Date received |
| `created_by` | Staff who recorded it |

### `facture_solde` — live balance view (never stored)

Calculated fresh every time:

```
montant_ttc     = SUM(facture_lignes.total_ht) × (1 + taux_tva / 100)
montant_paye    = SUM(paiements.montant)
solde_restant   = montant_ttc − montant_paye
```

---

## Full scenario — Mr. Dubois, bathroom renovation

**Devis accepted**: €10,000 HT. Project → `en_cours`.

Staff decides to split into **3 invoices**.

---

### Invoice 1 — Deposit (30%)

`factures` row:
| numero | projet_id | devis_id | statut | date_echeance | taux_tva |
|---|---|---|---|---|---|
| FAC-001 | Dubois | DEV-001 | `sent` | 2026-10-15 | 21% |

`facture_lignes`:
| designation | quantite | prix_unitaire_ht | total_ht |
|---|---|---|---|
| Deposit — bathroom renovation | 1 | €3,000 | €3,000 |

Mr. Dubois pays in full on 2026-10-14:

`paiements`:
| facture_id | montant | methode | date_paiement |
|---|---|---|---|
| FAC-001 | €3,630 | virement | 2026-10-14 |

`facture_solde` view:
```
montant_ttc   = €3,000 × 1.21 = €3,630
montant_paye  = €3,630
solde_restant = €0  → status auto → paid ✅
```

---

### Invoice 2 — Mid-project (40%)

`factures` row:
| numero | statut | date_echeance |
|---|---|---|
| FAC-002 | `sent` | 2026-11-01 |

`facture_lignes`:
| designation | total_ht |
|---|---|
| Progress payment — demolition + tiling | €4,000 |

Mr. Dubois pays only €2,000 on 2026-11-01:

`paiements`:
| facture_id | montant | methode | date_paiement |
|---|---|---|---|
| FAC-002 | €2,420 | cheque | 2026-11-01 |

`facture_solde` view:
```
montant_ttc   = €4,000 × 1.21 = €4,840
montant_paye  = €2,420
solde_restant = €2,420  → status → partially_paid
```

Due date passes with balance remaining → status auto → **overdue** → alert fires to tenant admin.

---

### Invoice 3 — Final (30%)

`factures` row:
| numero | statut | date_echeance |
|---|---|---|
| FAC-003 | `draft` | 2026-11-30 |

Still being prepared — not sent yet.

---

### Warning check

```
Total invoiced HT = €3,000 + €4,000 + €3,000 = €10,000
Devis total HT    = €10,000
→ ✅ match — no warning
```

If staff had set FAC-003 to €2,500 instead:
```
Total invoiced = €9,500 ≠ €10,000
→ ⚠️ warning: "invoices don't cover the full quote amount"
→ still allowed — staff decides
```

---

## Client sees invoices via portal

Via their portal link (`portail_tokens`) — read-only. They see:
- Each invoice with its status
- Amount due and amount paid
- Due dates

They never see the company's internal costs (subcontractors, margins, stock).

---

## Reminders (`relances`)

When an invoice is `overdue`:
- Staff sends a reminder manually
- `nb_relances` increments by 1
- `derniere_relance` is updated to today
- Alert fires to tenant admin (see [[alerts]])

---

## Related notes
- [[business-logic-overview]]
- [[qa-project-devis-stock-invoices]]
- [[alerts]]
- [[sous-traitance]]
