# ChantierOS — Site Reports

> Status: v1 (working draft). The daily record of what happened on site. See [[business-logic-overview]] for the full flow.

## What is a site report?

One row per day, per project. The site supervisor or team leader posts from the site: how far the work got, photos, a short note, and the materials actually used that day.

It is the single screen that feeds three other parts of the app:

| Feeds | How |
|---|---|
| Client portal | `progress_pct` of the latest report is what the client sees |
| Stock | Material usage declared here writes the `consumption` rows |
| Photos | Images attach to the report through `media` (`entity_type = 'report'`) |

---

## The `reports` table

| Field | Meaning |
|---|---|
| `tenant_id` | Which company (required) |
| `project_id` | Which project (required) |
| `created_by` | FK → `users.id` — who posted it |
| `report_date` | Which day (date only) |
| `progress_pct` | Work completed, 0–100 — DB check |
| `weather` | Optional short text |
| `note` | What was done today — free text |
| `created_at` | — |

One report per project per day: `UNIQUE (tenant_id, project_id, report_date)`.

### Who can post

| Role | Can post a report |
|---|---|
| `admin`, `manager` | Yes |
| `site_supervisor`, `team_leader` | Yes — this is their main screen |
| `worker` | No — the worker logs hours only |
| `sales`, `accountant` | No |

---

## Progress % — how the portal reads it

`projects` does **not** store a progress column. The portal reads the latest report:

```sql
SELECT progress_pct FROM reports
WHERE project_id = :p
ORDER BY report_date DESC
LIMIT 1;
```

Same rule as stock and margin: no running value is stored, it is always read from the newest row.

---

## Material usage — the one action that moves stock

Material consumption is **never automatic**. The recipe is theory; real usage on site is always different.

### The flow

```
1. Supervisor opens today's report on the project
2. Clicks "Declare material used"
3. Picks the service that was done (e.g. Painting, 20 m²)
4. The recipe (service_materials) PRE-FILLS the quantities
5. Supervisor EDITS them to the real numbers
6. Save → one `consumption` row per material in stock_movements
```

Step 4 gives speed. Step 5 gives truth.

### What the save writes

For 20 m² of Painting, recipe pre-fills Paint `0.15 × 20 = 3 L`. The supervisor actually used 3.5 L and corrects it:

| material_id | project_id | type | quantity | unit_price |
|---|---|---|---|---|
| M1 (Paint) | this project | `consumption` | −3.5 | €6.00 |
| M2 (Tape) | this project | `consumption` | −1 | €3.00 |

`unit_price` is frozen from `materials.purchase_price` at that moment. See [[catalogue-stock-tables-and-cost-storage]].

### Reservations drop too

When consumption is saved, the project's matching `stock_reservations` rows are reduced by the same quantity. A reservation that reaches zero becomes `status = 'consumed'`.

---

## Who does what on site

| Role | Hours | Materials | Progress % |
|---|---|---|---|
| `worker` | Logs own hours | — | — |
| `team_leader` | Logs own + team hours (their task assignees) | Declares usage | Posts report |
| `site_supervisor` | Full | Declares usage | Posts report |
| `manager` / `admin` | Full | Full + `adjustment` corrections | Full |

The worker never touches stock. A wrong quantity is corrected by a manager with an `adjustment` row, never by editing the original.

---

## Alerts

| Alert | Trigger | To |
|---|---|---|
| Missing report | Project `in_progress` and no report for 3 days | Manager + admin |
| Progress stalled | `progress_pct` unchanged for 7 days | Manager + admin |

---

## Related notes
- [[catalogue-stock-tables-and-cost-storage]]
- [[planning-time-entries]]
- [[client-portal]]
- [[media-files]]
- [[roles-permissions]]
