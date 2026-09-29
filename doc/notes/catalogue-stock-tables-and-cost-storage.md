# ChantierOS — Catalogue & Stock tables, and where cost numbers actually live

> Status: v1 (working draft). See [[business-logic-overview]] and [[qa-project-devis-stock-invoices]] for the earlier parts of this discussion.

## The 4 tables around "what we sell" vs "what we stock"

### 1. `materiaux` — what we stock
One row per material. Holds its unit, its current quantity in stock, its alert threshold, and its **purchase price** (`prix_achat`).

| id | designation | unite | prix_achat | stock_quantite | stock_minimum |
|---|---|---|---|---|---|
| M1 | Paint | L | €6.00 | 40 | 10 |
| M2 | Tape | rouleau | €3.00 | 15 | 5 |
| M3 | Filler | kg | €4.00 | 20 | 5 |

### 2. `categorie` — currently just a text field, not its own table
Today, `prestations.categorie` is a plain text column (e.g. "Peinture", "Carrelage"), typed by staff. There's **no `categories` table** behind it yet.

This means: no protection against typos ("Peinture" vs "Peintures" would be treated as two different categories), and no easy way to rename a category everywhere at once.

**Proposal for v2** (not built yet): a small `categories` table —

| id | nom |
|---|---|
| C1 | Peinture |
| C2 | Carrelage |
| C3 | Plomberie |

— with `prestations.categorie_id` pointing to it instead of free text. Worth doing since your category list is short and doesn't change often.

### 3. `prestations` — what we sell
One row per sellable service, with its **selling price** (`prix_ht`) and (today) a text `categorie`.

| id | categorie | designation | unite | prix_ht |
|---|---|---|---|---|
| P1 | Peinture | Peinture (per m²) | m² | €12.00 |

### 4. `prestation_materiaux` — the recipe, linking 1 and 3
One row per material that a service consumes, and how much of it per 1 unit sold.

| prestation_id | materiau_id | quantite_par_unite |
|---|---|---|
| P1 | M1 (paint) | 0.15 |
| P1 | M2 (tape) | 0.05 |
| P1 | M3 (filler) | 0.02 |

```
materiaux ──┐
            ├── prestation_materiaux (the recipe)
prestations ┘
```

## Where does the cost calculation actually get saved?

This is the important part — **most of it is NOT saved as a fixed number**. Here's exactly what happens, step by step, when the client's 20 m² of painting gets logged as done.

### Step 1 — the actual usage gets saved permanently
For each material in the recipe, one row is written into `stock_mouvements` (this is the ledger/history table from the earlier note):

| materiau_id | projet_id | type | quantite |
|---|---|---|---|
| M1 (paint) | this project | consommation | −3 |
| M2 (tape) | this project | consommation | −1 |
| M3 (filler) | this project | consommation | −0.4 |

**This is permanent.** It's the historical proof of what was used, when, and on which project.

### Step 2 — the €-cost is NOT saved anywhere — it's calculated live
Notice `stock_mouvements` only stores the **quantity**, not a price. So the table you pasted —

| Material | Qty used | Price | Cost |
|---|---|---|---|
| Paint | 3 L | €6.00 | €18.00 |
| Tape | 1 rouleau | €3.00 | €3.00 |
| Filler | 0.4 kg | €4.00 | €1.60 |
| **Total** | | | **€22.60** |

— is **never stored as its own row in the database**. It's rebuilt fresh, every time someone opens the margin screen, by joining `stock_mouvements.quantite` (Step 1) with `materiaux.prix_achat` (today's price). This join is exactly what the `projet_marge_live` view does.

**⚠️ Worth flagging as an open gap:** because the price is looked up "live" from `materiaux.prix_achat`, if the purchase price of paint changes next month, **past calculations shift too** — the €18.00 from this job would silently become a different number if you looked at it again later. Compare this to `devis_lignes`/`facture_lignes`, which DO freeze `prix_unitaire_ht` at the moment the line was created — `stock_mouvements` doesn't do the same for cost. A fix would be adding a `prix_unitaire` column to `stock_mouvements`, filled in at the moment of consumption, so history stays accurate even if prices change later.

### Step 3 — the project-wide total margin is also live, not saved
Same logic, at a bigger scale: the whole project's margin (materials + subcontractor + labor vs. budget) is recalculated every time from `projet_marge_live` — never stored while the project is active (`en_cours`).

### Step 4 — the ONE moment something gets permanently locked
When a project's status becomes `termine`, one row is written, once, into `projet_cloture_snapshot`:

| projet_id | budget_ht | cout_materiaux | cout_sous_traitance | cout_main_oeuvre | cout_total | marge_ht |
|---|---|---|---|---|---|---|
| this project | €8,000 | €22.60 (+ all other lines) | €2,500 | ... | ... | ... |

This is the only place a final cost number gets frozen forever, so a finished project's numbers never move again even if material prices change afterward.

## Summary — where each thing lives

| What | Saved permanently? | Where |
|---|---|---|
| A material was used, how much, on which project | ✅ Yes | `stock_mouvements` |
| The €-price used to cost that usage | ❌ No — always current price | pulled live from `materiaux.prix_achat` |
| The €-cost breakdown per material (your pasted table) | ❌ No | recomputed live (join of the two above) |
| The whole project's margin, while project is active | ❌ No | recomputed live, via `projet_marge_live` |
| The final, locked margin, once project is finished | ✅ Yes, once | `projet_cloture_snapshot` |

## Related notes
- [[business-logic-overview]]
- [[qa-project-devis-stock-invoices]]
