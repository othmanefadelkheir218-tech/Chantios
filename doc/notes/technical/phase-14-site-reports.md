# Phase 14 — Site Reports

> Build this **right after Phase 09 (media), before Phase 08 and Phase 10**. Stock consumption and the portal progress % both come from here.

## Tables

- `reports` — one row per project per day

## Key relations

```
projects ──── reports ──── users (created_by)
                     └──── media (entity_type = 'report', the photos)
                     └──── stock_movements (the material usage declared here)
```

## Key rules

### One report per project per day
- `UNIQUE (tenant_id, project_id, report_date)`
- Re-posting the same day edits the existing report, it does not create a second one

### Fields

| Field | Notes |
|---|---|
| `project_id` | Required |
| `created_by` | FK → `users.id` |
| `report_date` | Day only |
| `progress_pct` | 0–100, DB check |
| `weather` | Optional short text |
| `note` | What was done today |

### Who can post

| Role | Post a report |
|---|---|
| `admin`, `manager` | Yes |
| `site_supervisor`, `team_leader` | Yes — this is their main screen |
| `worker` | No — the worker logs hours only |
| `sales`, `accountant` | No |

### Progress % is read, never stored on the project
`projects` has no progress column. The portal and the dashboard read the newest report:

```sql
SELECT progress_pct FROM reports
WHERE project_id = :p
ORDER BY report_date DESC
LIMIT 1;
```

### Material usage — the only action that moves stock
Consumption is **never automatic**. The flow:

```
1. Open today's report
2. "Declare material used"
3. Pick the service done (Painting, 20 m²)
4. Recipe (service_materials) PRE-FILLS quantities
5. Supervisor EDITS to the real numbers
6. Save → one `consumption` row per material in stock_movements
```

- `unit_price` is frozen from `materials.purchase_price` at save time
- Each `consumption` row carries `report_id` — this report. That is the trace back to who declared it and when
- The project's matching `stock_reservations` rows drop their `remaining_quantity` by the same amount; at zero they become `consumed`
- A wrong quantity is corrected by a manager with an `adjustment` row — never by editing the original

### Photos
- Attached through `media` (`entity_type = 'report'`), images only (jpeg, png, webp)
- Visible in the client portal alongside the progress %

## What to build

- `reports` CRUD (one per project per day)
- Progress % reader (latest report per project)
- "Declare material used" action: recipe pre-fill → editable → writes `consumption` rows + decrements reservations
- Photo upload through `media`
- Cron: missing-report alert (project `in_progress`, no report for 3 days)
- Cron: progress-stalled alert (`progress_pct` unchanged for 7 days)

## Dependencies

- Phase 03 (projects)
- Phase 04 (materials, recipe, `stock_movements`, `stock_reservations`)
- Phase 09 (media for photos)

## See also
- [[site-reports]]
- [[catalogue-stock-tables-and-cost-storage]]
- [[client-portal]]
- [[alerts]]
