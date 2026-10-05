# ChantierOS — Catalogue & Stock tables, and where cost numbers actually live

> Status: v1 (working draft). See \[\[business-logic-overview\]\] and \[\[qa-project-quote-stock-invoices\]\] for the earlier parts of this discussion.

## The 4 tables around "what we sell" vs "what we stock"

### 1. `materials` — what we stock

One row per material. Holds its unit, its alert threshold, and its current **purchase price** (`purchase_price`).

| id | description | unit | purchase_price | minimum_stock |
| --- | --- | --- | --- | --- |
| M1 | Paint | L | €6.00 | 10 |
| M2 | Tape | roll | €3.00 | 5 |
| M3 | Filler | kg | €4.00 | 5 |

**There is no quantity column on `materials`.** The quantity in stock is never stored — it is always summed from the `stock_movements` ledger. See *Stock quantity — one source of truth* below.

### 2. `categories` — its own table (v1, decided)

**Decision:** `categories` **is a real table in v1. No free text.**

`tenant_id` is **nullable**. A row with `tenant_id = NULL` is a shared default, seeded once at deploy — this is what makes a deploy-time seed possible, since a seed has no company to belong to. A tenant adding its own category writes a row carrying its own `tenant_id`. A tenant sees the defaults plus its own.

A category groups services together (e.g. Painting, Tiling, Plumbing). Staff picks from a list — no typing by hand.

| id | name |
| --- | --- |
| C1 | Painting |
| C2 | Tiling |
| C3 | Plumbing |

`services.category_id` points to this table (foreign key). This means:

- No typos ("Painting" vs "Paintings" can't happen)
- Easy to rename a category everywhere at once
- Reports and filters work cleanly by category

### 3. `services` — what we sell

One row per sellable service, with its **selling price** (`price_excl_vat`) and a `category_id` (foreign key to the `categories` table — no free text).

| id | category_id | description | unit | price_excl_vat |
| --- | --- | --- | --- | --- |
| P1 | C1 (Painting) | Painting (per m²) | m² | €12.00 |

### 4. `service_materials` — the recipe, linking 1 and 3

One row per material that a service consumes, and how much of it per 1 unit sold.

| service_id | material_id | quantity_per_unit |
| --- | --- | --- |
| P1 | M1 (paint) | 0.15 |
| P1 | M2 (tape) | 0.05 |
| P1 | M3 (filler) | 0.02 |

```
materials ──┐
            ├── service_materials (the recipe)
services ┘
```

## `stock_movements` — the full field list

This is the one home for these fields. Nothing else stores a stock quantity.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | uuid | — |
| `tenant_id` | uuid | Required |
| `material_id` | uuid | Required — FK → `materials.id` |
| `project_id` | uuid | **Nullable.** Required on `consumption`, always `NULL` on `purchase` — stock is a shared pool, a purchase belongs to no project |
| `report_id` | uuid | **Nullable** — FK → `reports.id`, the site report that declared this consumption. Traceability: who said it, and when |
| `purchase_invoice_id` | uuid | **Nullable** — FK → `purchase_invoices.id`, the supplier bill for a `purchase` row. Either can exist without the other |
| `type` | enum | `purchase` · `consumption` · `adjustment` |
| `quantity` | `Decimal(12,3)` | **Signed**: `+` purchase, `−` consumption, either sign for `adjustment`. Never zero |
| `unit_price` | `Decimal(12,2)` | **Frozen** from `materials.purchase_price` at that moment |
| `movement_date` | date | The day it happened |
| `note` | text | Why — mostly used on an `adjustment` |
| `created_by` | uuid | FK → `users.id` |
| `created_at` | timestamp | — |

Two DB checks hold the rules:

```
type = 'consumption' → project_id IS NOT NULL AND quantity < 0
type = 'purchase'    → project_id IS NULL     AND quantity > 0
```

### `stock_reservations` — two quantity columns, on purpose

| Field | Type | Meaning |
| --- | --- | --- |
| `tenant_id` / `project_id` / `material_id` | uuid | Required |
| `reserved_quantity` | `Decimal(12,3)` | What the accepted quotes asked for — the original |
| `remaining_quantity` | `Decimal(12,3)` | What is still being held |
| `status` | enum | `active` · `released` · `consumed` |

`UNIQUE (project_id, material_id)`. Consuming material lowers **`remaining_quantity` only**, so the original figure is never lost. A second accepted quote on the same project **adds to the existing row**, it never creates a duplicate.

## Stock quantity — one source of truth

**Decision:** `stock_movements` is the only place a quantity lives. Nothing else stores a running total.

`materials` has no quantity column. Two SQL views answer every stock question:

### `material_stock_live`

| Column | How it is computed |
| --- | --- |
| `material_id` | — |
| `on_hand` | `SUM(stock_movements.quantity)` for that material |
| `reserved` | `SUM(stock_reservations.remaining_quantity)` where `status = 'active'` |
| `available` | `on_hand − reserved` |

### Why a view and not a cached column

| | View (chosen) | Cached column |
| --- | --- | --- |
| Can drift from the ledger | Never | Yes, on any missed update |
| Needs triggers to stay correct | No | Yes |
| Concurrent writes | Safe — append-only ledger | Needs row locks |

This is the same pattern already used by `project_margin_live` and `invoice_balance`: the ledger is permanent, the total is computed. If reads ever get slow, a cached column can be added later as a pure performance layer — but the ledger stays the truth.

### What this means when coding

- Movements are **append-only**. A mistake is corrected with a new `adjustment` row, never by editing or deleting a row.
- Every movement row carries `quantity` **signed**: positive for `purchase`, negative for `consumption`, either sign for `adjustment`.
- Low-stock alert reads `material_stock_live.on_hand ≤ materials.minimum_stock`.
- Reservation alert reads `material_stock_live.available < 0`.

## Who writes a consumption row, and when

Consumption is **never automatic**. The recipe is theory; real usage on site is always different.

It is declared from the daily site report, by a `site_supervisor` or `team_leader`:

```
1. Open today's report on the project
2. "Declare material used"
3. Pick the service that was done (Painting, 20 m²)
4. The recipe PRE-FILLS the quantities
5. Edit them to the real numbers
6. Save → one `consumption` row per material
```

Pre-fill gives speed, editing gives truth. The `worker` role never touches stock. A mistake is corrected by a manager with an `adjustment` row, never by editing the original. Full flow in [[site-reports]].

## How an accepted quote becomes reservations

On quote acceptance, the quote lines are pushed through the recipe:

```
for each quote_line WITH a service_id:
    for each row in service_materials for that service:
        reserve[material] += quote_line.quantity × quantity_per_unit

→ one stock_reservations row per material, status = 'active'
```

Worked example — the quote has one line, Painting 20 m²:

| material | quantity_per_unit | × 20 m² | reserved |
| --- | --- | --- | --- |
| M1 Paint | 0.15 | 3.0 | 3 L |
| M2 Tape | 0.05 | 1.0 | 1 roll |
| M3 Filler | 0.02 | 0.4 | 0.4 kg |

**`quote_lines.service_id` is optional.** A line picked from the catalogue reserves stock. A free-text line reserves nothing — staff must be able to write a free line, so this is by design, not a gap.

### Reservation lifecycle

| Event | What happens |
| --- | --- |
| Quote accepted | Row upserted on `(project_id, material_id)`, both quantities raised, `status = 'active'` |
| Material consumed | `remaining_quantity` drops by the same quantity — `reserved_quantity` never moves |
| `remaining_quantity` reaches zero | `status = 'consumed'` |
| Project cancelled | `status = 'released'`, `remaining_quantity = 0` |

Only `active` rows count in `material_stock_live.reserved`.

## Where does the cost calculation actually get saved?

This is the important part — **most of it is NOT saved as a fixed number**. Here's exactly what happens, step by step, when the client's 20 m² of painting gets logged as done.

### Step 1 — the actual usage gets saved permanently

For each material in the recipe, one row is written into `stock_movements`. It now includes `unit_price` — the price at the moment of consumption (decided: v1):

| material_id | project_id | type | quantity | unit_price |
| --- | --- | --- | --- | --- |
| M1 (paint) | this project | consumption | −3 | €6.00 |
| M2 (tape) | this project | consumption | −1 | €3.00 |
| M3 (filler) | this project | consumption | −0.4 | €4.00 |

**This is permanent.** It's the historical proof of what was used, when, at what price, and on which project.

### Step 2 — the €-cost is calculated live from locked prices

The cost breakdown is rebuilt fresh each time someone opens the margin screen — but now using the **frozen `unit_price`** saved in Step 1, not today's price from `materials.purchase_price`:

| Material | Qty used | Price (frozen) | Cost |
| --- | --- | --- | --- |
| Paint | 3 L | €6.00 | €18.00 |
| Tape | 1 roll | €3.00 | €3.00 |
| Filler | 0.4 kg | €4.00 | €1.60 |
| **Total** |  |  | **€22.60** |

This means: if the purchase price of paint changes next month, **past calculations never shift**. History stays accurate forever.

### Step 3 — the project-wide total margin is also live, not saved

Same logic, at a bigger scale: the whole project's margin is recalculated every time from `project_margin_live` — never stored while the project is active (`in_progress`).

The full margin formula is:

```
Margin = Budget (client pays)
       − Cost of Materials    (stock_movements: qty × frozen unit_price)
       − Cost of Employees    (time_entries: hours × frozen hourly_rate)
       − Every bill on this project, grouped by cost_type
         (purchase_invoices.amount_excl_vat, excluding cost_type = material)
```

Materials are counted **only** from the ledger, never from a supplier bill — see [[purchase-invoices]].

**Employee hourly rate (`hourly_rate`):** set by the tenant on each employee, can be changed anytime. When hours are logged, the rate is frozen directly on the `time_entries` row — so past calculations never shift if the salary changes later. → See `[[planning-time-entries]]` for full details.

### Step 4 — the ONE moment something gets permanently locked

While a project is active (`in_progress`), its costs and margin are calculated live from the project's actual cost data.

When the project status changes to `completed`, the system calculates the final numbers and permanently saves a **closure snapshot**.

The snapshot keeps the final project-level financial values:

| project_id | budget_excl_vat | total_cost | margin_excl_vat |
| --- | --- | --- | --- |
| this project | €8,000 | €3,800 | €4,200 |

The detailed costs are **not** stored as fixed columns like `material_cost`, `subcontractor_cost`, `labor_cost` — because new cost types may be added in the future. Instead, the snapshot has related cost rows:

#### `project_closure_snapshot_costs`

| snapshot_id | cost_type_id | amount |
| --- | --- | --- |
| S1 | material | €800 |
| S1 | subcontractor | €2,000 |
| S1 | labor | €1,000 |

The `cost_type_id` references a controlled `cost_types` table:

#### `cost_types`

| id | tenant_id | name | active |
| --- | --- | --- | --- |
| 1 | NULL | material | true |
| 2 | NULL | subcontractor | true |
| 3 | NULL | labor | true |

Three seeded defaults, same pattern as `categories`: `tenant_id = NULL` means shared. A tenant admin can add their own rows — `insurance`, `machine rental` — and deactivate what they do not use. Normal staff can only pick from the list, never create.

A new cost kind needs no migration. The margin groups bills by `cost_type_id`, so a new row shows up on the screen by itself.

Once a project is closed, the snapshot is historical data and never changes, even if material prices or project data change later. It represents the **final financial state of the project at the exact moment it was completed**.

## Summary — where each thing lives

| What | Saved permanently? | Where |
| --- | --- | --- |
| A material was used, how much, on which project | ✅ Yes | `stock_movements` |
| The quantity currently in stock | ❌ No | recomputed live, via `material_stock_live` |
| The €-price at the moment of consumption | ✅ Yes (frozen) | `stock_movements.unit_price` |
| The €-cost breakdown per material | ❌ No | recomputed live (qty × frozen price) |
| The whole project's margin, while project is active | ❌ No | recomputed live, via `project_margin_live` |
| The final, locked margin, once project is finished | ✅ Yes, once | `project_closure_snapshots` + `project_closure_snapshot_costs` |

## Related notes

- \[\[business-logic-overview\]\]
- \[\[qa-project-quote-stock-invoices\]\]
- \[\[site-reports\]\]
- \[\[purchase-invoices\]\]