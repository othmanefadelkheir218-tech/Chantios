# Phase 04 — Catalogue & Stock

> Depends on Phase 02 (users manage stock). Phase 03 (projects needed for consumption).

## Tables

- `categories` — nullable `tenant_id`; `NULL` rows are shared defaults seeded on deploy. No free text
- `services` — services the company sells
- `materials` — materials the company stocks
- `service_materials` — recipe: what a service consumes from stock
- `stock_movements` — ledger of every stock change (append-only)
- `stock_reservations` — materials reserved per project when quote accepted

## Key relations

```
categories ──── services ──── service_materials ──── materials
                                                      └──── stock_movements
projects ──── stock_movements
        └─── stock_reservations ──── materials
```

## Key rules

### Stock is a ledger — one source of truth
- `materials` has **no quantity column** — nothing stores a running total
- Every change = one row in `stock_movements` (type: `purchase` / `consumption` / `adjustment`)
- `quantity` is signed: `+` for purchase, `-` for consumption, either sign for adjustment
- Ledger is **append-only** — a mistake is fixed with a new `adjustment` row, never by editing or deleting
- Quantity in stock is read from the `material_stock_live` view: `on_hand`, `reserved`, `available`

### `unit_price` frozen on consumption
- When material is consumed → `unit_price` copied from `materials.purchase_price` at that moment
- If purchase price changes later → past consumption rows never shift

### Consumption is declared, never automatic
- The recipe is theory; real usage on site is always different
- Consumption rows are written from the **daily site report** by a `site_supervisor` or `team_leader` → see [[site-reports]]
- The recipe **pre-fills** the quantities; the supervisor edits them to the real numbers before saving
- The `worker` role never touches stock
- A wrong quantity is fixed by a manager with an `adjustment` row, never by editing the original

### Reservation quantities — how they are computed
On quote acceptance, push the quote lines through the recipe:

```
for each quote_line WITH a service_id:
    for each row in service_materials for that service:
        reserve[material] += quote_line.quantity × quantity_per_unit

→ one stock_reservations row per material, status = 'active'
```

`quote_lines.service_id` is **optional**. A catalogue line reserves stock; a free-text line reserves nothing — by design, staff must be able to write a free line.

### Reservations (soft alert)
- Quote accepted → materials reserved in `stock_reservations`
- Available stock = `material_stock_live.available` (`on_hand` − active reservations)
- `stock_reservations.status` = `active` / `released` / `consumed` — only `active` rows count
- If not enough → alert fires (soft, not a hard block)
- New stock added → system rechecks all reservations → alert clears if covered
- `UNIQUE (project_id, material_id)` — a second accepted quote **upserts** the same row, it never creates a duplicate
- Two quantity columns: `reserved_quantity` (the original ask) and `remaining_quantity` (still held). Consumption drops **only** `remaining_quantity`, so the original is never lost
- `remaining_quantity` reaches zero → `status = 'consumed'`
- Project cancelled → `status = 'released'`, `remaining_quantity = 0`

### `minimum_stock` alert
- When `material_stock_live.on_hand` ≤ `materials.minimum_stock` → alert fires to tenant admin

## Views (raw SQL in migration)

- `material_stock_live` — `on_hand`, `reserved`, `available` per material

## What to build

- `categories` CRUD (admin only)
- `services` CRUD
- `materials` CRUD
- `service_materials` CRUD (the recipe builder)
- Stock movement recorder (purchase, consumption, adjustment)
- `material_stock_live` view (raw SQL in migration)
- Stock reservation creator (triggered when quote accepted — walks the recipe)
- Reservation decrementer (triggered when consumption is declared)
- Reservation release handler (triggered on project cancel)
- Low stock alert trigger
- Reservation coverage checker (runs when new stock is added)
- Seed file: default categories with `tenant_id = NULL`
- Category reader must use `WHERE tenant_id IS NULL OR tenant_id = :current` — the generic tenant filter would hide the shared defaults

## Dependencies

- Phase 01 + 02 + 03

## See also
- [[catalogue-stock-tables-and-cost-storage]]
- [[site-reports]]
- [[purchase-invoices]]
- [[alerts]]
