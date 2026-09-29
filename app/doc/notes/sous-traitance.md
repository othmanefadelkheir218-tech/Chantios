# ChantierOS — Sous-traitance (Subcontracting) in detail

> Status: v1 (working draft). See [[business-logic-overview]] for how this fits the full picture, and [[qa-project-devis-stock-invoices]] sections 6/8 for the money-flow side (`facture_achat`) already covered.

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
One row per subcontractor, created **once**, reused every time you hire them again for a new project. Holds: name, trade (`metier`), email, phone (now format-checked — fixes bug #9 from the testing doc, which allowed invalid phone numbers), and an optional hourly rate.

Bug #9 also said there was no way to **edit** a subcontractor after creation — that's not a database problem, just a missing edit form in the app.

**Simple analogy:** this is the plumber's **business card** in your address book. It never changes, no matter how many jobs he does for the company.

### 2) `contrats_sous_traitance` — the actual engagement
The audit flagged this as broken before: a subcontractor's cost had no reliable link to a project. Now `projet_id` is **required** — a contract can't exist without knowing exactly which project it belongs to.

Holds: which subcontractor, which project (required), what they're hired to do, the agreed price, start/end dates, and a status:

| Status | Meaning |
|---|---|
| `en_cours` | Currently working on this project |
| `termine` | Their part of the work is done |
| `annule` | Engagement cancelled |

**Simple analogy:** this is a **sticky note per job** — *"Hired him for Dubois' bathroom, agreed €2,500."* One new sticky note every time you use him on a new project. The business card stays the same; you just add a new sticky note.

**Important: this "contract" is purely internal.** It's not a legal document handed to anyone — just a database row that helps the company remember what it agreed to pay, so the cost side of the margin calculation works. It is never shown to the client.

### 3) `factures_achat` — the bill(s)
Already covered earlier ([[qa-project-devis-stock-invoices]]): one contract can produce **several bills** (e.g. one mid-job, one at the end). Each bill links back to the project (required) and optionally to the contract.

## Example — hiring a plumber for Mr. Dubois' bathroom

1. Plumber never worked with the company before → create **one** `sous_traitants` row: *"Plombier Martin, Plomberie, 06 12 34 56 78"* — reusable forever.
2. Hired for **this** project → create one `contrats_sous_traitance` row: this project, €2,500, `en_cours`.
3. Work done → contract status → `termine`.
4. Plumber sends his bill → one `factures_achat` row: same project, linked to that contract, `a_payer`.
5. Company pays him → `payee`. That €2,500 now counts as `cout_sous_traitance` in this project's margin.

**Later, same plumber, different client:** you do **not** create a new `sous_traitants` row — you reuse the one from step 1. You just add a new `contrats_sous_traitance` row for the new project (a new sticky note, same business card).

## Does the client ever see this contract, or that a subcontractor was hired?

**No — by design, it's invisible to the client.** Here's exactly what the client sees vs. what stays internal.

### What's actually on the client's invoice (`facture_lignes`)
Only a description, quantity, unit price, and total — nothing structural links it to `sous_traitants` or `contrats_sous_traitance`:

| Designation | Quantité | Prix unitaire | Total |
|---|---|---|---|
| Plomberie — installation sanitaire | 1 | €2,900 | €2,900 |
| Carrelage — pose | 20 m² | €45 | €900 |

The client just sees "plumbing work," priced at whatever the **company** decided to charge — this price comes from the devis/catalogue, not from what the subcontractor billed.

### The two numbers stay separate, on purpose

| | Client sees this | Client never sees this |
|---|---|---|
| Amount | €2,900 (`facture_lignes`, what company charges) | €2,500 (`factures_achat`, what plumber billed the company) |
| Where it lives | `factures` | `factures_achat` / `contrats_sous_traitance` |

The difference (€2,900 − €2,500 = **€400**) is the company's margin on that line. Keeping the two disconnected is exactly what makes that margin possible.

If the company *wants* to mention "this was done by an external partner," that's just free text typed into the `designation` or the project's communication thread — nothing in the schema tracks or forces that link. It's optional and manual, not automatic.

## ⚠️ Open gap: no payment ledger for subcontractor bills

Client invoices (`factures`) have a real payments ledger (`paiements`) — every partial payment is its own row. `factures_achat` doesn't have the same — only `a_payer`/`payee`, all-or-nothing. If subcontractors are ever paid in installments, there's no way to record that today. Worth deciding if that's needed.

## Related notes
- [[business-logic-overview]]
- [[qa-project-devis-stock-invoices]]
- [[catalogue-stock-tables-and-cost-storage]]
- [[progress-tracker]]
