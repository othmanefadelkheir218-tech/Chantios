# ChantierOS — Q&A: Project/Quote status link, Stock logic, Purchase invoices

> Follow-up notes after the first business-logic overview. See \[\[business-logic-overview\]\] for the full flow.

## 1) Quote status → Project status — the rules

When the client **accepts** the quote → project automatically switches to `in_progress`. When the client **refuses** the quote → project stays `prospect` (company can send a new quote).

### Project statuses (4 only)

| Status | Meaning |
| --- | --- |
| `prospect` | Project created, not confirmed yet |
| `in_progress` | Quote accepted — work is active |
| `completed` | Work finished |
| `cancelled` | Cancelled |

The quote handles its own sent/accepted tracking. The project only needs to know: active or not.

### Quote statuses (4 only)

| Status | Meaning |
| --- | --- |
| `draft` | Being built, not sent yet |
| `sent` | Sent to client |
| `accepted` | Client accepted → triggers project `in_progress` |
| `refused` | Client rejected → project stays `prospect` |

## 2) Stock reservation — how it works

Stock is a **shared pool** across all projects. When two projects need the same material, the system must know early — not on site day.

### When reservation triggers

When a quote is **accepted** (`in_progress`) → the materials expected for that project are **reserved** in the stock pool immediately.

This gives the company time to buy more stock before the team shows up on site.

### Alert style — soft (not hard block)

Reservation uses a **soft alert**, not a hard block:

- The quote can be accepted even if stock is low
- But an alert fires immediately: "Not enough stock for this project — order more"

A hard block would be too strict — the company may plan to buy materials after signing the contract.

### The reservation table

A new `stock_reservations` table handles this:

| project_id | material_id | reserved_quantity |
| --- | --- | --- |
| Project A | Tiles | 30 |
| Project B | Tiles | 30 |

Available stock is read from the `material_stock_live` view: `available = on_hand − reserved`. No table stores a quantity — see [[catalogue-stock-tables-and-cost-storage]].

### When new stock arrives — auto-fill reservations

When the company adds new stock → the system automatically checks all pending reservations and fills them:

| Moment | Stock (tiles) | Project A | Project B |
|---|---|---|---|
| Both projects accepted | 40 | 30 reserved ✅ | 30 → only 10 left → **alert fires** |
| Company buys 30 more | 70 | 30 reserved ✅ | 30 reserved ✅ → **alert clears** |

No manual action needed — the alert clears itself once stock is enough to cover the reservation.

### When a project is cancelled — the important rule

When a project moves to `cancelled`, there are always **two types of stock** to handle:

| Type | What to do |
| --- | --- |
| Already consumed (written in `stock_movements`) | Stays consumed — never reversed |
| Reserved but not yet used | Released back to the shared pool |

At the same moment, the system sends an **alert to the manager**: "Project cancelled — don't forget to invoice the client for completed work."

The company then creates a final invoice covering only: work done + materials already consumed + hours already logged. The client pays for what was actually used — no more, no less.

## 3) `purchase_invoice` (Type B) — your questions

### a) When does it need `project_id`?

`project_id` is **nullable**, and it is set by the kind of cost, not by who sent the paper:

| Bill | `cost_type` | `project_id` |
|---|---|---|
| Plumber on one job | `subcontractor` | Required |
| Any material purchase | `material` | Always NULL |

A subcontractor bill always has a project, because its contract has one. Its amount counts in that project's margin.

A material bill never has a project. Buying tiles writes **two** rows: a `purchase` row in `stock_movements` (how many units we now have) and a `purchase_invoices` row (how much we owe, to whom, by when). The cost enters the margin later, when the tiles are consumed on site. If the bill also carried a project, the same tiles would be counted twice.

Full rules in [[purchase-invoices]].

### b) Type B: do we *receive* this invoice, or do we *create* it?

**We receive it.** This is the key difference between the two invoice types:

- `invoice` (Type A, client invoice) = **we create it** ourselves, inside the app, and send it to the client.
- `purchase_invoice` (Type B, purchase invoice) = **someone else creates it** (the subcontractor or the supplier) and sends it to us. What we do in the app is just **enter its data** (amount, their invoice number, due date) so we can track what we owe and mark it paid later.

### c) Contract vs. invoice — not the same thing

- `subcontractor_contracts` = the **agreement** with a subcontractor for one project: scope of work, total price, start/end dates. This is created once, when you hire them for that job.
- `purchase_invoice` = the **actual bill(s)** they send you for that work. One contract can produce more than one bill (e.g. a progress payment now, the rest at the end).

So your freelance example is correct: the contract is tied to one project because you hired that person for that specific job. The bill(s) they send you (`purchase_invoice`) link back to that contract (`subcontractor_contract_id`) and to that same project (`project_id`), both required for a subcontractor bill.

## 4) `purchase_invoice.project_id` — does it help generate the client invoice?

**No — this is an important thing to separate. The two invoices never feed each other automatically.**

They are two completely independent documents:

|  | `invoice` (client invoice) | `purchase_invoice` (purchase invoice) |
| --- | --- | --- |
| Who creates it | The company, inside the app | The supplier/subcontractor (we just enter it) |
| Who pays | The client pays the company | The company pays the supplier |
| Based on | The quote (agreed price) | Whatever the supplier actually billed |
| Purpose of `project_id` | So the client sees the right project | So the **cost** counts against the right project's margin |

**Concrete example, same as before:** Mr. Dubois agreed to pay a **fixed price of €8,000** for his bathroom (that's what's written on the `invoice`/quote). The company then hires a plumber and gets billed €2,500 (`purchase_invoice`, `project_id` = Dubois' project).

That €2,500 is **never shown or added to Mr. Dubois' invoice**. He still pays exactly €8,000, no matter what the plumber charged the company. The only reason `purchase_invoice` needs `project_id` is so the app can compute, privately, for the company's own eyes only:

```
Margin = 8,000 (client paid, from invoice)
        − 2,500 (plumber, from purchase_invoice)
        − materials cost
        − labor cost
```

So `project_id` on `purchase_invoice` is 100% about **internal cost tracking / margin**, not about building the client's bill. If your business ever needs "rebill subcontractor cost to the client with a markup" (cost-plus billing), that would be a new, separate feature — it doesn't exist in the current docs.

## Related notes

- \[\[business-logic-overview\]\]