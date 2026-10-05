# ChantierOS — Subcontracting (Subcontracting) in detail

> Status: v1 (working draft). See [[business-logic-overview]] for how this fits the full picture, and [[qa-project-quote-stock-invoices]] for the money-flow side (`purchase_invoice`).

## The 3 tables involved

```
subcontractors (the person/company — reusable)
      │
      ▼
subcontractor_contracts (one engagement — tied to ONE project)
      │
      ▼
purchase_invoices (the bill(s) for that engagement)
```

### 1) `subcontractors` — the directory

One row per subcontractor, created **once**, reused every time you hire them again for a new project.

| Field | Meaning |
|---|---|
| `company_name` | Company or person name |
| `trade` | Their trade (plumber, electrician...) |
| `email` | Contact email |
| `phone` | Phone — format validated |
| `hourly_rate` | Their hourly rate (optional) |

**Simple analogy:** this is the plumber's **business card** in your address book. One card, reused on every project.

### 2) `subcontractor_contracts` — the engagement per project

One row per project they work on. `project_id` and `subcontractor_id` are both required.

| Field | Meaning |
|---|---|
| `subcontractor_id` | Which subcontractor |
| `project_id` | Which project (required) |
| `description` | Scope of work |
| `amount_excl_vat` | Agreed price |
| `start_date` / `end_date` | Timeline |
| `status` | `in_progress` / `completed` / `cancelled` |

**Simple analogy:** a **sticky note per job** — *"Hired him for Dubois' bathroom, agreed €2,500."* One new sticky note every time you use him on a new project. The business card stays the same.

**This contract is purely internal.** It is never shown to the client — it just helps the company track what it agreed to pay, so the margin calculation works correctly.

### 3) `purchase_invoices` — the bill(s)

One contract can produce **several bills** (e.g. one mid-job, one at the end). A bill of `type = 'subcontractor'` requires both `subcontractor_contract_id` and `project_id` — no subcontractor bill without a contract.

The same table also holds material **supplier** bills (`type = 'supplier'`), where the contract is null and the project is optional. Full table in [[purchase-invoices]].

## Example — hiring a plumber for Mr. Dubois' bathroom

1. Plumber never worked with the company before → create **one** `subcontractors` row: *"Plumber Martin, Plumbing, 06 12 34 56 78"* — reusable forever.
2. Hired for **this** project → create one `subcontractor_contracts` row: this project, €2,500, `in_progress`.
3. Work done → contract status → `completed`.
4. Plumber sends his bill → one `purchase_invoices` row: linked to that contract and project, `to_pay`. **The €2,500 counts in the margin from this moment** — a cost you owe is a cost.
5. Company pays him → `paid`. The margin does not change; `status` only tracks whether the money has left the bank.

**Later, same plumber, different project:** reuse the existing `subcontractors` row — just add a new `subcontractor_contracts` row for the new project.

## Does the client ever see this?

**No — invisible to the client by design.**

| | Client sees | Client never sees |
|---|---|---|
| Amount | €2,900 (what company charges, from `invoice_lines`) | €2,500 (what plumber billed, from `purchase_invoices`) |
| Where it lives | `invoices` | `purchase_invoices` / `subcontractor_contracts` |

The difference (€2,900 − €2,500 = **€400**) is the company's margin on that subcontractor. The two numbers are kept separate on purpose.

## Payment instalments for subcontractors

`purchase_invoices.status` is `to_pay` / `paid` — all or nothing. There is no ledger for money out in v1.

A subcontractor paid in stages is handled the way it works on paper: the contract produces **several bills**, one per stage, each paid in full. That covers the real case without a new table.

If a single bill ever needs partial payments, add a `purchase_payments` ledger using the same pattern as `payments`. Not needed for v1.

## Related notes
- [[purchase-invoices]]
- [[business-logic-overview]]
- [[qa-project-quote-stock-invoices]]
- [[catalogue-stock-tables-and-cost-storage]]
