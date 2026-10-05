# Phase 06 — Purchases (Subcontractors & Suppliers)

> Depends on Phase 03 (projects) and Phase 09 (media — bill PDFs).

## Tables

- `subcontractors` — the subcontractor directory (reusable across projects)
- `suppliers` — the material supplier directory (reusable)
- `subcontractor_contracts` — one engagement per project
- `purchase_invoices` — **every** bill the company receives, both kinds

## Key relations

```
subcontractors ──── subcontractor_contracts ──── projects
                                           └──── purchase_invoices
suppliers ─────────────────────────────────┘
```

## One table, two kinds of bill

`purchase_invoices.type` = `subcontractor` / `supplier`.

| Column | Rule |
|---|---|
| `subcontractor_contract_id` | **Nullable**. Required when `type = 'subcontractor'`, must be NULL otherwise |
| `supplier_id` | **Nullable**. Required when `type = 'supplier'`, must be NULL otherwise |
| `cost_type_id` | **Required**. FK → `cost_types` — what kind of cost this is |
| `project_id` | **Nullable**. Required for a subcontractor bill; must be NULL when `cost_type = 'material'` |

`type` says **who** sent the paper. `cost_type_id` says **what kind of cost** it is. The margin reads the second one.

A DB check constraint enforces "exactly one source". Full design in [[purchase-invoices]].

### Why `project_id` is nullable

| Case | `type` | `cost_type` | `project_id` | Counts in a margin? |
|---|---|---|---|---|
| Plumber for Dubois' bathroom | `subcontractor` | `subcontractor` | Required | Yes |
| Tiles, bought for any reason | `supplier` | `material` | Always NULL | No — counted when consumed |

**A material bill never carries a project.** Material cost has one source only: the `consumption` rows in `stock_movements`. Every material passes through the stock, even a delivery straight to the site. If the bill also carried a project, the same tiles would be counted twice. A check constraint enforces it.

A tenant admin can add new cost types (`insurance`, `machine rental`). The margin groups bills by `cost_type_id`, so a new kind appears with no new column and no migration.

### Stock purchases write two rows

| Table | Question it answers |
|---|---|
| `stock_movements` (`purchase`) | How many units do we now have? |
| `purchase_invoices` (`supplier`) | How much do we owe, to whom, by when? |

Both are recorded. When both exist they are linked by `purchase_invoice_id` on the stock movement — nullable.

## Key rules

- `subcontractors` and `suppliers` = one row per person/company, created once, reused forever. Archived with `is_active = false`, never deleted
- `subcontractor_contracts.project_id` = required — no contract without a project
- One contract → many bills (progress payment + final payment)
- A subcontractor paid in stages gets **one bill per stage**, each paid in full — there is no payment ledger for money out in v1
- Client **never sees** subcontractor or supplier info — internal only

### `purchase_invoices` fields
- The received PDF is attached through `media` (`entity_type = 'purchase_invoice'`, PDF only) — there is no `document_url` column
- `payment_reference` — cash, transfer, cheque — free text
- `status` = `to_pay` / `paid`

### Purchase invoice vs client invoice
| | `invoices` | `purchase_invoices` |
|---|---|---|
| Created by | Company (inside app) | Subcontractor (we just enter it) |
| Who pays | Client pays company | Company pays subcontractor |
| Shown to client | Yes (portal) | Never |

## What to build

- `subcontractors` CRUD
- `suppliers` CRUD
- `subcontractor_contracts` CRUD (linked to project)
- `purchase_invoices` CRUD + document upload (via `media`), both types in one screen
- Check constraint: exactly one of contract / supplier set
- Check constraint: `cost_type = 'material'` → `project_id IS NULL`
- Mark as paid action
- Purchase bill due-date alert (cron)

## Dependencies

- Phase 03 (projects)
- Phase 09 (media — for document upload)
- Phase 05 (`document_counters` for the `PUR-` number)

## See also
- [[purchase-invoices]]
- [[subcontracting]]
- [[document-numbering]]
- [[margin-profitability]]
