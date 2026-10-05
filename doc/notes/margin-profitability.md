# ChantierOS — Margin & Profitability

> Status: v1 (working draft). See [[catalogue-stock-tables-and-cost-storage]] for how each cost is stored, and [[alerts]] for the alert thresholds.

## What is the margin?

The money the company **keeps** after paying for everything on a project.

```
Margin = Budget − Cost of Materials − Cost of Employees − Every other bill on the project
```

If margin is positive → company made money.
If margin is negative → company lost money.

---

## Where does the budget come from?

**The budget is not a column.** It is the sum of every accepted quote on the project:

```sql
budget_excl_vat = SUM(quotes.amount_excl_vat)
                  WHERE project_id = :p AND status = 'accepted'
```

It lives in the `project_margin_live` view, never in `projects`. Staff never types it.

### Why a sum and not a stored column

Extra work mid-project means a **second** quote, not an edit of the first:

| Quote | Amount | Accepted |
|---|---|---|
| QUO-2026-0001 | €10,000 | 2026-10-02 |
| QUO-2026-0014 | €1,500 | 2026-11-08 |
| **Budget** | **€11,500** | |

The budget becomes €11,500 with no update code and no risk of a stale number.

### Budget history is free

There is **no `project_budget_history` table.** The list of accepted quotes *is* the history — each one carries its amount and its `accepted_at`:

```sql
SELECT number, amount_excl_vat, accepted_at
FROM quotes
WHERE project_id = :p AND status = 'accepted'
ORDER BY accepted_at;
```

A derived history can never drift from the real numbers. A history table would only be needed if a budget could change **without** a quote — which is not allowed.

---

## The full formula

```
margin_excl_vat = budget_excl_vat − material_cost − labor_cost − bill_cost
margin_pct      = (margin_excl_vat / budget_excl_vat) × 100
```

| Term | Source |
|---|---|
| `budget_excl_vat` | `SUM(quotes.amount_excl_vat)` where `status = 'accepted'` |
| `material_cost` | `stock_movements`: qty × frozen `unit_price`, `type = 'consumption'` |
| `labor_cost` | `time_entries`: hours × frozen `hourly_rate` |
| `bill_cost` | `purchase_invoices.amount_excl_vat` on this project, **grouped by `cost_type_id`**, excluding `cost_type = material`. Counted whatever its `status` — a cost you owe is a cost, paying it later changes nothing |

### Three sources, never four

Each cost enters the margin through exactly one door:

| Cost | Door |
|---|---|
| Materials | The stock ledger, when they are consumed |
| Hours | `time_entries` |
| Anything the company was billed for — subcontractor, and any cost type the tenant adds | `purchase_invoices`, by cost type |

A material bill never counts here, because the tiles are already counted when they leave the stock. That is why a bill with `cost_type = material` has no `project_id` — see [[purchase-invoices]].

All calculated **live** from `project_margin_live` view while project is active. Frozen once into `project_closure_snapshots` when project becomes `completed`.

---

## Alert thresholds

| Level | When | Action |
|---|---|---|
| ⚠️ Warning | Real cost reaches **80%** of budget | Notification + email to admin and manager |
| 🔴 Critical | Real cost reaches **95%** of budget | Notification + email to admin and manager |

### Each level fires once — the dedup rule

Margin is recomputed after every time entry, every consumption and every purchase invoice. Without a guard, a project sitting at 81% would email on **every** save.

A small table remembers what was already sent:

#### `project_margin_alerts`

| Field | Meaning |
|---|---|
| `project_id` | Which project |
| `level` | `warning` / `critical` |
| `fired_at` | When it was sent |

Primary key `(project_id, level)`. Before sending, check the row exists; if it does, send nothing.

| Situation | Result |
|---|---|
| Project crosses 80% the first time | Warning sent, row written |
| Project saves again at 83% | Nothing sent — row already exists |
| Project later crosses 95% | Critical sent, second row written |
| An accepted extra quote raises the budget and cost drops back under 80% | Both rows deleted — the levels can fire again |

The last line matters: an extra accepted quote raises the budget, so a project can genuinely become healthy again.

---

## Full scenario — Mr. Dubois bathroom renovation

### Setup

- **Quote accepted**: €10,000 excl VAT → the budget in `project_margin_live` becomes €10,000. `projects` stores no budget column
- **Subcontractor hired**: plumber, agreed €2,500 (`subcontractor_contracts`)
- **2 employees**: Karim (€20/h), Youssef (€15/h)

---

### Materials used (`stock_movements`)

| Material | Qty | Frozen price | Cost |
|---|---|---|---|
| Tiles | 40 m² | €8.00 | €320 |
| Paint | 10 L | €6.00 | €60 |
| Filler | 5 kg | €4.00 | €20 |
| **Total materials** | | | **€400** |

---

### Subcontractor bill (`purchase_invoices`)

| Supplier | amount_excl_vat |
|---|---|
| Plumber Martin (via contract) | €2,500 |

---

### Employee hours (`time_entries`)

| Employee | Hours | Frozen rate | Cost |
|---|---|---|---|
| Karim | 20h | €20 | €400 |
| Youssef | 12h | €15 | €180 |
| **Total labor** | | | **€580** |

---

### Margin calculation

```
Budget               = €10,000
− Materials          =    €400
− Subcontractor      =  €2,500
− Employees          =    €580
─────────────────────────────
Margin (margin_excl_vat)    =  €6,520
Margin %             =  65.2%  ✅ healthy
```

---

### What if the project runs over?

Client asks for extra work (new bathroom tiles in hallway). New quote: +€1,500 → accepted.

Budget updates: **€10,000 → €11,500**

Meanwhile, extra materials and 15 more hours of work are logged:

```
Extra materials      =    €200
Extra labor (15h)    =    €300  (Karim, €20/h)
─────────────────────────────
New real cost        =  €3,980  (€400+€2,500+€580+€200+€300)
New margin           =  €7,520  (€11,500 − €3,980)
New margin %         =  65.4%  ✅ still healthy
```

---

### What if the plumber bills more than agreed?

Contract was €2,500. Plumber sends a second bill for extra work: €1,800.

```
New subcontractor cost = €2,500 + €1,800 = €4,300

Real cost = €400 + €4,300 + €580 = €5,280
Margin    = €10,000 − €5,280 = €4,720
Margin %  = 47.2%  ✅ still ok
```

Now Karim works 30 more hours and Youssef works 20 more hours:

```
Extra labor = (30 × €20) + (20 × €15) = €600 + €300 = €900

Real cost = €5,280 + €900 = €6,180
Margin    = €10,000 − €6,180 = €3,820
Margin %  = 38.2%  still ok but decreasing
```

Karim works 20 more hours:

```
Extra = 20 × €20 = €400

Real cost = €6,580
Margin %  = (€10,000 − €6,580) / €10,000 = 34.2%
```

One more week of work — real cost hits €8,050:

```
Margin % = (€10,000 − €8,050) / €10,000 = 19.5%

→ Real cost = 80.5% of budget
→ ⚠️ WARNING alert fires to admin and manager
```

Real cost reaches €9,520:

```
Margin % = 4.8%

→ Real cost = 95.2% of budget
→ 🔴 CRITICAL alert fires
```

---

## What the manager sees on `/margins` page

One row per active project:

| Project | Budget | Real cost | Margin | Margin % | Status |
|---|---|---|---|---|---|
| Dubois bathroom | €10,000 | €8,050 | €1,950 | 19.5% | ⚠️ Warning |
| Materne facade | €25,000 | €8,000 | €17,000 | 68% | ✅ Healthy |
| Lecomte kitchen | €6,000 | €5,720 | €280 | 4.7% | 🔴 Critical |

---

## Related notes
- [[catalogue-stock-tables-and-cost-storage]]
- [[planning-time-entries]]
- [[subcontracting]]
- [[alerts]]
- [[business-logic-overview]]
