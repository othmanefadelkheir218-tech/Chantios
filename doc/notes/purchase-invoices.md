# ChantierOS — Purchase Invoices (money out)

> Status: v1 (working draft). One table for every bill the company receives. See [[subcontracting]] for the contract side and [[margin-profitability]] for the cost side.

## Two kinds of bill, one table

A bill the company **receives**. Someone else wrote it; the app only records it so the company can track what it owes and count the cost.

| `type` | Who billed us | Example |
|---|---|---|
| `subcontractor` | A subcontractor, under a contract | The plumber bills €2,500 for Dubois' bathroom |
| `supplier` | A material supplier | The builders' merchant bills €900 for tiles |

One table keeps one screen, one CRUD and one upload flow.

---

## The `purchase_invoices` table

| Field | Meaning |
|---|---|
| `tenant_id` | Which company (required) |
| `type` | `subcontractor` / `supplier` (required) — **who** sent us the paper |
| `cost_type_id` | FK → `cost_types.id` (required) — **what kind** of cost it is |
| `subcontractor_contract_id` | FK → `subcontractor_contracts.id` — **nullable** |
| `supplier_id` | FK → `suppliers.id` — **nullable** |
| `project_id` | FK → `projects.id` — **nullable** |
| `number` | Our internal number, `PUR-2026-0007` — see [[document-numbering]] |
| `external_number` | Their invoice number, as printed on their paper |
| `amount_excl_vat` | Amount without VAT |
| `vat_rate` | Their VAT rate |
| `issue_date` | Date on their invoice |
| `due_date` | When we must pay |
| `status` | `to_pay` / `paid` |
| `payment_reference` | Transfer reference, cheque number, "cash" — free text |
| `paid_at` | When we paid it — nullable |
| `created_by` | Who entered it |

The PDF they sent is attached through `media` (`entity_type = 'purchase_invoice'`, PDF only).

---

## The two required rules

### 1. Exactly one source

```
type = 'subcontractor' → subcontractor_contract_id required, supplier_id must be NULL
type = 'supplier'      → supplier_id required, subcontractor_contract_id must be NULL
```

A DB check constraint enforces this. No bill can exist without a source.

### 2. Two columns, two different questions

`type` says **who** sent the paper. `cost_type_id` says **what kind of cost** it is. The margin needs the second one, not the first.

| Case | `type` | `cost_type` | `project_id` | Counts in margin? |
|---|---|---|---|---|
| Plumber for Dubois' bathroom | `subcontractor` | `subcontractor` | Required | Yes |
| Tiles, bought for any reason | `supplier` | `material` | **always NULL** | No — counted when the tiles leave the stock |

A subcontractor bill **always** has a project, because the contract has one.

### Why a material bill never carries a project

Material cost has exactly one source: a `consumption` row in `stock_movements`. Every material passes through the stock, even a delivery that goes straight to the site — one `purchase` row the day it arrives, one `consumption` row the day it is used.

If a material bill also carried a project, the same tiles would be counted twice: once from the paper, once from the ledger. So a bill with `cost_type = material` has `project_id = NULL`, enforced by a check constraint. The paper only answers "who do we owe, and by when".

### Adding a new kind of cost

`cost_types` starts with three rows: `material`, `subcontractor`, `labor`. A tenant admin can add their own — `insurance`, `machine rental`, anything.

The margin screen groups bills by `cost_type_id`, so a new kind appears by itself. No new column, no migration, no developer.

---

## The `suppliers` table

Same shape as `subcontractors` — a reusable address book entry.

| Field | Meaning |
|---|---|
| `tenant_id` | Which company |
| `name` | Company name |
| `email` | Contact email |
| `phone` | Phone — format validated |
| `address` | Optional |
| `vat_number` | Optional |
| `is_active` | Archived, never deleted |

---

## Stock purchases — the double entry

Buying materials touches **two** places, and they answer two different questions:

| Table | Question it answers |
|---|---|
| `stock_movements` (`type = 'purchase'`) | How many units do we now have? |
| `purchase_invoices` (`type = 'supplier'`) | How much do we owe, to whom, by when? |

Record both. A stock movement with no bill is fine (a correction). A bill with no stock movement is fine (a service, transport). When both exist they are linked by `purchase_invoice_id` on the stock movement — nullable.

---

## Never shown to the client

Purchase invoices, suppliers and subcontractor contracts are internal. The client portal never shows them, never shows their amounts, and never shows these names. See [[client-portal]].

---

## Instalments

`status` is `to_pay` / `paid` — all or nothing. There is no payment ledger for money out in v1. If a subcontractor or supplier ever needs to be paid in instalments, add a `purchase_payments` ledger using the same pattern as [[client-invoices]] `payments`.

---

## Related notes
- [[subcontracting]]
- [[document-numbering]]
- [[margin-profitability]]
- [[catalogue-stock-tables-and-cost-storage]]
- [[media-files]]
