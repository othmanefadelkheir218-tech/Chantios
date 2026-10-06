# Tests — Catalogue & Stock

> Routes: `/api/categories`, `/api/services`, `/api/materials`, `/api/stock/...`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [catalogue-stock-tables-and-cost-storage.md](../catalogue-stock-tables-and-cost-storage.md), [qa-project-quote-stock-invoices.md](../qa-project-quote-stock-invoices.md), the step file [Phaces/05-Catalogue & Stock.md](../Phaces/05-Catalogue%20%26%20Stock.md).

## Before you start

- **Guards:** most routes carry `@TenantAuth()` + `@Module('catalogue')` or `@Module('stock')`. A few are `@Roles('admin')` (`POST/PATCH/DELETE /api/categories`) or `@Roles('admin','manager')` (`POST /api/stock/adjustment`) instead — see the route table in the step file.
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt`. You also need `worker@dupont.test` (same password, for the 403 check) and `admin@verhelst.test` (another tenant, for isolation). **The access-token cookie is short-lived (15 min)** — re-login if you start getting `401 Not authenticated` mid-session.
- **No new migration this step** — `categories`, `services`, `materials`, `service_materials`, `stock_movements`, `stock_reservations` and the `material_stock_live` view all already existed from step 01.
- **`stock_movements` is append-only.** There is no `PATCH`/`DELETE` route for a movement, ever — a mistake is a new `adjustment` row, not an edit.
- **No HTTP route exists for consumption or reservation creation.** `record-consumption` (step 09, site reports) and `create-reservations` (step 06, quote acceptance) are built and unit-tested, but only reachable through `StockService` by a module that doesn't exist yet. Everything below that needs them was verified with a direct service-level script against the real database in this session, not curl — note it where relevant.
- Every record you create in these tests should start with `TEST`.

---

## 1. Categories — shared defaults

### CAT-01 — `GET /api/categories` returns the 10 seeded defaults plus the tenant's own

**Expected:** `200`, a flat array (not paginated), `tenant_id: null` rows mixed with any of your own.

### CAT-02 — A tenant cannot edit or delete a `NULL`-tenant (shared default) category

```
curl -b jar.txt -X PATCH http://localhost:5391/api/categories/<a shared default id> -H "Content-Type: application/json" -d '{"name":"TEST Hacked"}'
```

**Expected:** `404` "Category not found" — not a `403`. The tenant-scoped repository method simply never matches a `NULL`-tenant row, so it looks exactly like the row doesn't exist.

### CAT-03 — A tenant's own category is editable

Create one (`POST /api/categories`, admin only), then `PATCH` it.

**Expected:** `201` then `200`.

---

## 2. Services & the recipe

### SVC-01 — Create a service, set a 3-row recipe, `PUT` replaces all of it in one transaction

```
curl -b jar.txt -X PUT http://localhost:5391/api/services/<id>/recipe -H "Content-Type: application/json" \
  -d '{"items":[{"material_id":<m1>,"quantity_per_unit":"0.5"},{"material_id":<m2>,"quantity_per_unit":"0.1"},{"material_id":<m3>,"quantity_per_unit":"1"}]}'
```

**Expected:** `200`, `GET .../recipe` returns exactly those 3 rows. `PUT` again with a different, smaller set → the old rows are gone, only the new ones remain (confirmed live: 3 rows → replaced with 1 → `GET` shows exactly 1).

---

## 3. Materials & the ledger

### MAT-01 — `materials` has no quantity column

`GET /api/materials/<id>` → no `quantity` key, ever. `on_hand`/`reserved`/`available` come from the joined view instead.

### STK-01 — Record a purchase of 100 → `on_hand = 100`, `project_id` is always `NULL`

```
curl -b jar.txt -X POST http://localhost:5391/api/stock/purchase -H "Content-Type: application/json" -d '{"material_id":<id>,"quantity":"100"}'
```

**Expected:** `201`, `project_id: null`, `unit_price` equal to the material's current `purchase_price` (frozen at that moment). `GET /api/materials/<id>` right after → `on_hand: "100"`.

### STK-02 — A purchase with a `project_id` field is rejected outright

```
curl -b jar.txt -X POST http://localhost:5391/api/stock/purchase -H "Content-Type: application/json" -d '{"material_id":<id>,"quantity":"10","project_id":1}'
```

**Expected:** `400`, "property project_id should not exist" — whitelist validation, the field doesn't exist on the DTO at all.

### STK-03 — A purchase with a negative quantity is rejected

**Expected:** `400`, "quantity must be positive".

### STK-04 — `low-stock` lists materials at or under their minimum

A material never purchased (`on_hand: 0`) with any `minimum_stock > 0` already shows up. Push another material below its minimum with an adjustment (STK-07) and confirm it joins the list.

### STK-05 — Changing `purchase_price` never shifts a past movement's `unit_price`

`PATCH /api/materials/<id>` a new `purchase_price`, then `GET /api/stock/movements?material_id=<id>` → every existing row still shows the old `unit_price` (confirmed live: changed `6` → `999`, all 3 prior movements stayed at `6`).

### STK-06 — Adjustment requires a `note`

```
curl -b jar.txt -X POST http://localhost:5391/api/stock/adjustment -H "Content-Type: application/json" -d '{"material_id":<id>,"quantity":"5"}'
```

**Expected:** `400`, "note should not be empty".

### STK-07 — Adjustment, either sign, admin/manager only

`POST /api/stock/adjustment` `{"material_id":<id>,"quantity":"-95","note":"TEST big write-off"}` → `201`, `on_hand` drops accordingly. As `worker` → `403`.

---

## 4. Reservations — verified via a direct service-level script, not HTTP (no route exists yet)

Run against the real dev database this session (tenant created and torn down, no residue). Service `quantity` is the quote-line amount, walked through the recipe (`quantity × quantity_per_unit` per material), not a raw material quantity.

| Step | Result |
|---|---|
| Purchase 100 of a material | `on_hand = 100` |
| Reserve via 60 units of a service with `quantity_per_unit = 0.5` | **1** reservation row, `reserved_quantity = 30`, `available = 70` |
| Reserve again via 20 more units of the same service, same project | **still 1 row** (not 2) — `reserved_quantity = 40` (upsert, not insert) |
| Consume 25 | `remaining_quantity = 15`, `reserved_quantity` still `40` (untouched), `on_hand = 75` |
| Consume the last 15 | `remaining_quantity = 0`, `status = consumed` |
| Reserve far past `on_hand` (1000 more service-units) | **allowed** — `available` goes negative (`-440`), no hard block, status flips back to `active` |
| Cancel the project | the reservation → `status = released`, `remaining_quantity = 0`. Both consumption movements **untouched** (2 rows, still there) |
| Change `purchase_price` after the fact | all 3 movements for that material keep their original `unit_price` |
| Adjustment `-5` with a note | `on_hand` drops by exactly 5 |

All 10 rows matched expectations exactly on the real database — this is the core ledger/reservation logic the whole step exists for, and it holds.

---

## 5. Tenant isolation & roles

### ISO-CS-01 — Tenant A cannot see tenant B's materials, services, or movements

As `admin@verhelst.test`: `GET /api/materials/<a dupont material id>` → `404`. `GET /api/services/<a dupont service id>` → `404`. `GET /api/stock/movements` → only ever Verhelst's own rows (`total: 0` if Verhelst never purchased anything).

### ROLE-CS-01 — A `worker` gets `403` on any catalogue/stock route

`GET /api/materials`, `POST /api/stock/purchase` as `worker@dupont.test` → both `403`, "No can... access to stock".

---

## Clean up after testing

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from stock_reservations where material_id in (select id from materials where description like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from stock_movements where material_id in (select id from materials where description like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from service_materials where service_id in (select id from services where description like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from services where description like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from materials where description like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from categories where name like 'TEST%';"
```
