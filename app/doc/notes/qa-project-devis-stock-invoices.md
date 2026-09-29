# ChantierOS — Q&A: Project/Devis status link, Stock logic, Purchase invoices

> Follow-up notes after the first business-logic overview. See [[business-logic-overview]] for the full flow.

## 1) Does Devis status automatically change Project status?

**Yes, but there is a small gap in the docs — worth a decision.**

The scenario doc (`ChantieOs senarios and explaination.md`) says: when the client accepts the quote, the quote status becomes `accepté`, and the project **jumps straight** from `prospect` to `en_cours`.

But the schema (`SchemaPropos.md`) defines an **extra project status** called `accepte`, sitting between `devis_envoye` and `en_cours`. That status only makes sense if there is a moment where the quote is accepted **but work hasn't started yet** (e.g. waiting for scheduling, waiting for a deposit payment).

So there are two possible designs — you need to pick one:

| Option | Devis `accepte` → Project becomes... | When does project become `en_cours`? |
|---|---|---|
| A (simple, matches the scenario doc) | `en_cours` directly | Same moment as quote acceptance |
| B (matches the schema's extra status) | `accepte` first | Later, when the first task actually starts, or a manager clicks "start work" |

My take: **Option B is safer for a real business** — a client can accept a quote today but the team only starts on site in 2 weeks. Calling it `en_cours` immediately would be misleading on the dashboard. But this is a business decision, not a technical one — tell me which one you want and I'll write it down as the official rule.

Also worth deciding: what happens to the project when the devis is `refuse`? Nothing is defined yet — probably it just stays `prospect` (company can send a new/revised quote), or the company manually cancels the project.

## 2) `materiaux` table — is it where we define material info?

**Yes, exactly.** One row per material, e.g. "tiles 60x60". Each row holds:
- its unit (m², piece, box...),
- its purchase price,
- its **current total quantity in stock**,
- an **alert threshold** ("warn me when I have less than X left").

Think of it as the company's product sheet for every material it uses.

## 3) `stock_mouvements` — is it the history?

**Yes.** It's the **history log** (a ledger) of every single stock movement:
- a purchase (stock goes up),
- a use on a site (stock goes down, and that use is billed to one project),
- a manual correction (e.g. after counting the warehouse and finding a mistake).

We never "just edit" the number in `materiaux`. Every change leaves a trace: who, when, how much, why. The current total in `materiaux` is really just the sum of all these history rows.

## 4) `prestation_materiaux` — simple explanation

Think of it as a **recipe**.

A `prestation` is a service you sell, e.g. "Tiling, per m²". A `materiau` is an ingredient, e.g. "tiles". `prestation_materiaux` is the recipe card that says: *"1 m² of tiling needs 1.2 tiles and 0.5 kg of glue."*

Why it's useful: when staff adds "20 m² of tiling" to a quote or a site report, the app can **automatically calculate** — 20 × 1.2 = 24 tiles needed — instead of someone typing that number by hand. Today (per the bug list) this link doesn't exist yet, so catalogue and stock are disconnected.

## 5) "Two projects consume the same material at the same time" — is there a reservation?

**Good instinct, but no — the current schema does not reserve stock for a project.**

What you're describing (reserve quantity when the project/quote is created, and ask for more stock if not enough) is a real and common pattern, but it is **not in `SchemaPropos.md` today**. Right now:

- Stock is one shared pool for the whole company.
- Nothing is set aside for a project in advance.
- Material is only subtracted from the pool at the moment it's actually recorded as used (`stock_mouvements`, type `consommation`).

So the scenario is: Project A logs "used 30 tiles" on Monday, Project B logs "used 30 tiles" on Tuesday. If there were only 40 tiles total, Project B will find the stock low (or empty) at that moment — there is no upfront reservation that would have warned the team earlier, when both quotes were created.

Your idea (reserve stock as soon as a quote/project confirms it will need materials, and trigger a purchase request if the shared pool can't cover it) is a **good improvement**, but it would need a new table (something like `stock_reservations`) that isn't designed yet. Want me to sketch that as a proposal?

## 6) `facture_achat` (Type B) — your questions

### a) Why does it need `projet_id`?

Because the whole margin calculation (budget vs. real cost, per project) needs every outgoing cost attached to a project. If a cost has no `projet_id`, it can never be counted against any project's margin.

You raised a real tension here, and it's worth flagging: **general stock restocking** (buying tiles to refill the shared warehouse, not for one job) doesn't naturally belong to a single project. In the current schema, that kind of purchase is tracked through `stock_mouvements` (type `achat`, `projet_id` = NULL) — **not** through `facture_achat`. So:
- Buy materials to refill shared stock → `stock_mouvements` (no project needed).
- Hire a freelancer/subcontractor for one specific job, or buy something used only on one site → `facture_achat` (project required).

This split isn't 100% written down anywhere as an explicit rule yet — I'm inferring it from how the tables are built. Worth confirming as an official rule so developers don't get confused.

### b) Type B: do we *receive* this invoice, or do we *create* it?

**We receive it.** This is the key difference between the two invoice types:

- `facture` (Type A, client invoice) = **we create it** ourselves, inside the app, and send it to the client.
- `facture_achat` (Type B, purchase invoice) = **someone else creates it** (the subcontractor or the supplier) and sends it to us. What we do in the app is just **enter its data** (amount, their invoice number, due date) so we can track what we owe and mark it paid later.

### c) Contract vs. invoice — not the same thing

- `contrats_sous_traitance` = the **agreement** with a subcontractor for one project: scope of work, total price, start/end dates. This is created once, when you hire them for that job.
- `facture_achat` = the **actual bill(s)** they send you for that work. One contract can produce more than one bill (e.g. a progress payment now, the rest at the end).

So your freelance example is correct: the contract is tied to one project because you hired that person for that specific job. The bill(s) they send you (`facture_achat`) link back to that contract (optional field `contrat_sous_traitance_id`) and always to that same project (required field `projet_id`).

## 7) `prestation_materiaux` — even simpler, with a real example

Forget the table name for a second. Two different things exist in the app:

- **A `prestation`** = something you **sell** to the client. It's on the price list. Example: *"Tiling — per m²"*, sold at €45/m².
- **A `materiau`** = something you **buy and stock**. Example: *"Tiles"*, bought at €8 each.

Right now, in the app, these two lists don't talk to each other. When staff sells "20 m² of tiling" on a quote, the app has no idea that this will actually consume 24 tiles from the warehouse.

`prestation_materiaux` is just a small table that answers one question: **"When I sell 1 unit of this service, what does it eat from stock, and how much?"**

Example row: *"Tiling (1m²) → consumes 1.2 tiles."*

So when staff later says "20 m² of tiling was done on this site," the app can look up that row and compute: 20 × 1.2 = **24 tiles used**, then automatically write that into `stock_mouvements` — instead of someone manually typing "24 tiles" and maybe getting it wrong or forgetting.

**In one sentence: it's the missing bridge between "what we sell" and "what we must take out of the warehouse for it."**

## 8) `facture_achat.projet_id` — does it help generate the client invoice?

**No — this is an important thing to separate. The two invoices never feed each other automatically.**

They are two completely independent documents:

| | `facture` (client invoice) | `facture_achat` (purchase invoice) |
|---|---|---|
| Who creates it | The company, inside the app | The supplier/subcontractor (we just enter it) |
| Who pays | The client pays the company | The company pays the supplier |
| Based on | The devis (agreed price) | Whatever the supplier actually billed |
| Purpose of `projet_id` | So the client sees the right project | So the **cost** counts against the right project's margin |

**Concrete example, same as before:** Mr. Dubois agreed to pay a **fixed price of €8,000** for his bathroom (that's what's written on the `facture`/devis). The company then hires a plumber and gets billed €2,500 (`facture_achat`, `projet_id` = Dubois' project).

That €2,500 is **never shown or added to Mr. Dubois' invoice**. He still pays exactly €8,000, no matter what the plumber charged the company. The only reason `facture_achat` needs `projet_id` is so the app can compute, privately, for the company's own eyes only:

```
Margin = 8,000 (client paid, from facture)
        − 2,500 (plumber, from facture_achat)
        − materials cost
        − labor cost
```

So `projet_id` on `facture_achat` is 100% about **internal cost tracking / margin**, not about building the client's bill. If your business ever needs "rebill subcontractor cost to the client with a markup" (cost-plus billing), that would be a new, separate feature — it doesn't exist in the current docs.

## 9) `categorie` — should it be its own table?

**Right now, no — it's a plain text column, not a separate table.** In the schema, `prestations.categorie` is just `TEXT` (e.g. "Peinture", "Carrelage", "Plomberie"). There's no `categories` table behind it.

That's a real design question worth raising though. Two options:

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A — free text (current)** | Staff types "Peinture" each time | Simple, fast to build | Typos possible ("Peintures" vs "Peinture"), harder to rename a category everywhere later |
| **B — separate `categories` table** | `prestations.categorie_id` → FK to a `categories` table | No typos, easy to rename/reorder, easy to filter/report by category | One more table to manage, one more thing to set up before adding a service |

For a catalogue that's mostly fixed (Peinture, Carrelage, Plomberie, Électricité...) and doesn't change often, **Option B is usually the better long-term choice** — same reasoning as `client_type` or `facture_statut` being locked-down values instead of free text. This is a good one to flag for the schema's "v2" pass. Want me to note it as a proposed change?

## 10) Can one `prestation` consume more than one `materiau`? (example: Peinture)

**Yes — that's exactly the point of `prestation_materiaux` being a separate table.** One `prestation_id` can have **several rows**, each pointing to a different material.

Example — "Peinture, per m²" might realistically need paint AND tape AND a bit of filler:

| prestation_id | materiau_id | quantite_par_unite |
|---|---|---|
| Peinture (per m²) | Peinture (paint, liters) | 0.15 |
| Peinture (per m²) | Ruban de masquage (tape) | 0.05 |
| Peinture (per m²) | Enduit (filler) | 0.02 |

Three rows, same `prestation_id`, three different materials. Nothing is "merged" into one row — each material used by a service gets its own row with its own quantity.

**So the cost of one service = sum of all its material rows:**

```
Cost of "Peinture" for 20 m² sold:
  Paint:  20 × 0.15 × price_of_paint
+ Tape:   20 × 0.05 × price_of_tape
+ Filler: 20 × 0.02 × price_of_filler
= total material cost for that line
```

This is also what would let the app auto-deduct **all three** materials from stock at once when 20 m² of painting is logged as done — not just one.

## 11) Full worked example — 3 tables + final cost math

**Step 1 — `materiaux` (what we stock, with purchase price):**

| id | designation | unite | prix_achat |
|---|---|---|---|
| M1 | Peinture (paint) | L | €6.00 |
| M2 | Ruban de masquage (tape) | rouleau | €3.00 |
| M3 | Enduit (filler) | kg | €4.00 |

**Step 2 — `prestations` (what we sell, with selling price):**

| id | designation | unite | prix_ht |
|---|---|---|---|
| P1 | Peinture (per m²) | m² | €12.00 |

**Step 3 — `prestation_materiaux` (the recipe: how much of each material per 1 m² sold):**

| prestation_id | materiau_id | quantite_par_unite |
|---|---|---|
| P1 | M1 (paint) | 0.15 |
| P1 | M2 (tape) | 0.05 |
| P1 | M3 (filler) | 0.02 |

### Now the client buys 20 m² of painting

**A) Revenue (what the client pays — this goes on the devis/facture):**
```
20 m² × €12.00 = €240.00
```

**B) Material cost (what it actually costs the company — this feeds the margin, never shown to the client):**

| Material | Quantity used (20 × recipe qty) | Unit price | Cost |
|---|---|---|---|
| Paint | 20 × 0.15 = 3 L | €6.00 | €18.00 |
| Tape | 20 × 0.05 = 1 rouleau | €3.00 | €3.00 |
| Filler | 20 × 0.02 = 0.4 kg | €4.00 | €1.60 |
| **Total material cost** | | | **€22.60** |

**C) Margin on materials for this line:**
```
€240.00 (revenue) − €22.60 (material cost) = €217.40
```
(This €217.40 is before subtracting labor hours and any subcontractor cost — those get added on top when computing the project's full margin, as covered in section 6.)

### What actually happens in the system, step by step
1. Staff adds "20 m² of Peinture" as a line on the devis → price shown to client = €240 (from `prestations.prix_ht`).
2. Client accepts, work happens, staff (or an auto-trigger) logs "20 m² of Peinture done."
3. The app looks up `prestation_materiaux` for `P1` → finds 3 material rows → computes 3L paint, 1 tape, 0.4kg filler.
4. Three rows get written into `stock_mouvements` (type `consommation`, `projet_id` = this project): −3L paint, −1 tape, −0.4kg filler.
5. Later, the margin view (`projet_marge_live`) sums up all `consommation` rows for this project × each material's `prix_achat` → gets the €22.60 material cost automatically.

## Related notes
- [[business-logic-overview]]
