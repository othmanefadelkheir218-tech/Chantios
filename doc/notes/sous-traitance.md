# ChantierOS — Sous-traitance (Subcontracting) in detail

> Status: v1 (working draft). See [[business-logic-overview]] for how this fits the full picture, and [[qa-project-devis-stock-invoices]] for the money-flow side (`facture_achat`).

## The 3 tables involved

```
sous_traitants (the person/company — reusable)
      │
      ▼
contrats_sous_traitance (one engagement — tied to ONE project)
      │
      ▼
factures_achat (the bill(s) for that engagement)
```

### 1) `sous_traitants` — the directory

One row per subcontractor, created **once**, reused every time you hire them again for a new project.

| Field | Meaning |
|---|---|
| `raison_sociale` | Company or person name |
| `metier` | Their trade (plumber, electrician...) |
| `email` | Contact email |
| `telephone` | Phone — format validated |
| `taux_horaire` | Their hourly rate (optional) |

**Simple analogy:** this is the plumber's **business card** in your address book. One card, reused on every project.

### 2) `contrats_sous_traitance` — the engagement per project

One row per project they work on. `projet_id` and `sous_traitant_id` are both required.

| Field | Meaning |
|---|---|
| `sous_traitant_id` | Which subcontractor |
| `projet_id` | Which project (required) |
| `description` | Scope of work |
| `montant_ht` | Agreed price |
| `date_debut` / `date_fin` | Timeline |
| `statut` | `en_cours` / `termine` / `annule` |

**Simple analogy:** a **sticky note per job** — *"Hired him for Dubois' bathroom, agreed €2,500."* One new sticky note every time you use him on a new project. The business card stays the same.

**This contract is purely internal.** It is never shown to the client — it just helps the company track what it agreed to pay, so the margin calculation works correctly.

### 3) `factures_achat` — the bill(s)

One contract can produce **several bills** (e.g. one mid-job, one at the end). Each bill requires both `projet_id` and `contrat_sous_traitance_id` — no bill without a contract.

See [[qa-project-devis-stock-invoices]] for the full `facture_achat` table structure.

## Example — hiring a plumber for Mr. Dubois' bathroom

1. Plumber never worked with the company before → create **one** `sous_traitants` row: *"Plombier Martin, Plomberie, 06 12 34 56 78"* — reusable forever.
2. Hired for **this** project → create one `contrats_sous_traitance` row: this project, €2,500, `en_cours`.
3. Work done → contract status → `termine`.
4. Plumber sends his bill → one `factures_achat` row: linked to that contract and project, `a_payer`.
5. Company pays him → `payee`. That €2,500 now counts as `cout_sous_traitance` in this project's margin.

**Later, same plumber, different project:** reuse the existing `sous_traitants` row — just add a new `contrats_sous_traitance` row for the new project.

## Does the client ever see this?

**No — invisible to the client by design.**

| | Client sees | Client never sees |
|---|---|---|
| Amount | €2,900 (what company charges, from `facture_lignes`) | €2,500 (what plumber billed, from `factures_achat`) |
| Where it lives | `factures` | `factures_achat` / `contrats_sous_traitance` |

The difference (€2,900 − €2,500 = **€400**) is the company's margin on that subcontractor. The two numbers are kept separate on purpose.

## Open question — payment installments for subcontractors

Client invoices (`factures`) have a full payments ledger (`paiements`) — every partial payment is its own row. `factures_achat` today only has `a_payer` / `payee` — all or nothing.

If subcontractors are ever paid in installments, this needs a `paiements_achat` ledger table, same pattern as `paiements`. Not decided yet.

## Related notes
- [[business-logic-overview]]
- [[qa-project-devis-stock-invoices]]
- [[catalogue-stock-tables-and-cost-storage]]
