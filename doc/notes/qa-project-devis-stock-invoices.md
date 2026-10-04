# ChantierOS — Q&A: Project/Devis status link, Stock logic, Purchase invoices

> Follow-up notes after the first business-logic overview. See \[\[business-logic-overview\]\] for the full flow.

## 1) Devis status → Project status — the rules

When the client **accepts** the devis → project automatically switches to `en_cours`. When the client **refuses** the devis → project stays `prospect` (company can send a new quote).

### Project statuses (4 only)

| Status | Meaning |
| --- | --- |
| `prospect` | Project created, not confirmed yet |
| `en_cours` | Devis accepted — work is active |
| `termine` | Work finished |
| `annule` | Cancelled |

The devis handles its own sent/accepted tracking. The project only needs to know: active or not.

### Devis statuses (4 only)

| Status | Meaning |
| --- | --- |
| `brouillon` | Being built, not sent yet |
| `envoye` | Sent to client |
| `accepte` | Client accepted → triggers project `en_cours` |
| `refuse` | Client rejected → project stays `prospect` |

## 2) Stock reservation — how it works

Stock is a **shared pool** across all projects. When two projects need the same material, the system must know early — not on site day.

### When reservation triggers

When a devis is **accepted** (`en_cours`) → the materials expected for that project are **reserved** in the stock pool immediately.

This gives the company time to buy more stock before the team shows up on site.

### Alert style — soft (not hard block)

Reservation uses a **soft alert**, not a hard block:

- The quote can be accepted even if stock is low
- But an alert fires immediately: "Not enough stock for this project — order more"

A hard block would be too strict — the company may plan to buy materials after signing the contract.

### The reservation table

A new `stock_reservations` table handles this:

| projet_id | materiau_id | quantite_reservee |
| --- | --- | --- |
| Project A | Tiles | 30 |
| Project B | Tiles | 30 |

Available stock = `stock_quantite` − sum of all active reservations.

### When new stock arrives — auto-fill reservations

When the company adds new stock → the system automatically checks all pending reservations and fills them:

| Moment | Stock (tiles) | Project A | Project B |
|---|---|---|---|
| Both projects accepted | 40 | 30 reserved ✅ | 30 → only 10 left → **alert fires** |
| Company buys 30 more | 70 | 30 reserved ✅ | 30 reserved ✅ → **alert clears** |

No manual action needed — the alert clears itself once stock is enough to cover the reservation.

### When a project is cancelled — the important rule

When a project moves to `annule`, there are always **two types of stock** to handle:

| Type | What to do |
| --- | --- |
| Already consumed (written in `stock_mouvements`) | Stays consumed — never reversed |
| Reserved but not yet used | Released back to the shared pool |

At the same moment, the system sends an **alert to the manager**: "Project cancelled — don't forget to invoice the client for completed work."

The company then creates a final invoice covering only: work done + materials already consumed + hours already logged. The client pays for what was actually used — no more, no less.

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

So your freelance example is correct: the contract is tied to one project because you hired that person for that specific job. The bill(s) they send you (`facture_achat`) link back to that contract (`contrat_sous_traitance_id` — required) and to that same project (`projet_id` — required).

## 7) `facture_achat.projet_id` — does it help generate the client invoice?

**No — this is an important thing to separate. The two invoices never feed each other automatically.**

They are two completely independent documents:

|  | `facture` (client invoice) | `facture_achat` (purchase invoice) |
| --- | --- | --- |
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

## Related notes

- \[\[business-logic-overview\]\]