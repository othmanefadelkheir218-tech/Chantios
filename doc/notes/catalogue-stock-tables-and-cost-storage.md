# ChantierOS — Catalogue & Stock tables, and where cost numbers actually live

> Status: v1 (working draft). See \[\[business-logic-overview\]\] and \[\[qa-project-devis-stock-invoices\]\] for the earlier parts of this discussion.

## The 4 tables around "what we sell" vs "what we stock"

### 1. `materiaux` — what we stock

One row per material. Holds its unit, its current quantity in stock, its alert threshold, and its **purchase price** (`prix_achat`).

| id | designation | unite | prix_achat | stock_quantite | stock_minimum |
| --- | --- | --- | --- | --- | --- |
| M1 | Paint | L | €6.00 | 40 | 10 |
| M2 | Tape | rouleau | €3.00 | 15 | 5 |
| M3 | Filler | kg | €4.00 | 20 | 5 |

### 2. `categories` — its own table (v1, decided)

**Decision:** `categories` **is a real table in v1. No free text.**

A category groups services together (e.g. Peinture, Carrelage, Plomberie). Staff picks from a list — no typing by hand.

| id | nom |
| --- | --- |
| C1 | Peinture |
| C2 | Carrelage |
| C3 | Plomberie |

`prestations.categorie_id` points to this table (foreign key). This means:

- No typos ("Peinture" vs "Peintures" can't happen)
- Easy to rename a category everywhere at once
- Reports and filters work cleanly by category

### 3. `prestations` — what we sell

One row per sellable service, with its **selling price** (`prix_ht`) and a `categorie_id` (foreign key to the `categories` table — no free text).

| id | categorie_id | designation | unite | prix_ht |
| --- | --- | --- | --- | --- |
| P1 | C1 (Peinture) | Peinture (per m²) | m² | €12.00 |

### 4. `prestation_materiaux` — the recipe, linking 1 and 3

One row per material that a service consumes, and how much of it per 1 unit sold.

| prestation_id | materiau_id | quantite_par_unite |
| --- | --- | --- |
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

For each material in the recipe, one row is written into `stock_mouvements`. It now includes `prix_unitaire` — the price at the moment of consumption (decided: v1):

| materiau_id | projet_id | type | quantite | prix_unitaire |
| --- | --- | --- | --- | --- |
| M1 (paint) | this project | consommation | −3 | €6.00 |
| M2 (tape) | this project | consommation | −1 | €3.00 |
| M3 (filler) | this project | consommation | −0.4 | €4.00 |

**This is permanent.** It's the historical proof of what was used, when, at what price, and on which project.

### Step 2 — the €-cost is calculated live from locked prices

The cost breakdown is rebuilt fresh each time someone opens the margin screen — but now using the **frozen `prix_unitaire`** saved in Step 1, not today's price from `materiaux.prix_achat`:

| Material | Qty used | Price (frozen) | Cost |
| --- | --- | --- | --- |
| Paint | 3 L | €6.00 | €18.00 |
| Tape | 1 rouleau | €3.00 | €3.00 |
| Filler | 0.4 kg | €4.00 | €1.60 |
| **Total** |  |  | **€22.60** |

This means: if the purchase price of paint changes next month, **past calculations never shift**. History stays accurate forever.

### Step 3 — the project-wide total margin is also live, not saved

Same logic, at a bigger scale: the whole project's margin is recalculated every time from `projet_marge_live` — never stored while the project is active (`en_cours`).

The full margin formula is:

```
Margin = Budget (client pays)
       − Cost of Materials       (stock_mouvements: qty × frozen prix_unitaire)
       − Cost of Subcontractors  (facture_achat.montant_ht linked to projet_id)
       − Cost of Employees       (pointages: heures × frozen taux_horaire)
```

**Employee hourly rate (`taux_horaire`):** set by the tenant on each employee, can be changed anytime. When hours are logged, the rate is frozen directly on the `pointages` row — so past calculations never shift if the salary changes later. → See `[[planning-pointages]]` for full details.

### Step 4 — the ONE moment something gets permanently locked

While a project is active (`en_cours`), its costs and margin are calculated live from the project's actual cost data.

When the project status changes to `termine`, the system calculates the final numbers and permanently saves a **closure snapshot**.

The snapshot keeps the final project-level financial values:

| projet_id | budget_ht | cout_total | marge_ht |
| --- | --- | --- | --- |
| this project | €8,000 | €3,800 | €4,200 |

The detailed costs are **not** stored as fixed columns like `cout_materiaux`, `cout_sous_traitance`, `cout_main_oeuvre` — because new cost types may be added in the future. Instead, the snapshot has related cost rows:

#### `projet_cloture_snapshot_couts`

| snapshot_id | cost_type_id | montant |
| --- | --- | --- |
| S1 | Material | €800 |
| S1 | Freelancer | €2,000 |
| S1 | Employees | €1,000 |
| S1 | Transport | €0 |

The `cost_type_id` references a controlled `cost_types` table:

#### `cost_types`

| id | name | active |
| --- | --- | --- |
| 1 | Material | true |
| 2 | Freelancer | true |
| 3 | Employees | true |
| 4 | Transport | true |
| 5 | Equipment | true |

Cost types are controlled values. Normal staff can only select an existing cost type — they cannot create new ones. Only the main Admin can add or manage cost types.

This also allows new cost types to be added later without changing the database structure — just a new row in `cost_types`.

Once a project is closed, the snapshot is historical data and never changes, even if material prices or project data change later. It represents the **final financial state of the project at the exact moment it was completed**.

## Summary — where each thing lives

| What | Saved permanently? | Where |
| --- | --- | --- |
| A material was used, how much, on which project | ✅ Yes | `stock_mouvements` |
| The €-price at the moment of consumption | ✅ Yes (frozen) | `stock_mouvements.prix_unitaire` |
| The €-cost breakdown per material | ❌ No | recomputed live (qty × frozen price) |
| The whole project's margin, while project is active | ❌ No | recomputed live, via `projet_marge_live` |
| The final, locked margin, once project is finished | ✅ Yes, once | `projet_cloture_snapshot` + `projet_cloture_snapshot_couts` |

## Related notes

- \[\[business-logic-overview\]\]
- \[\[qa-project-devis-stock-invoices\]\]