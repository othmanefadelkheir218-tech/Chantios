# Tests — Clients & Projects

> Routes: `/api/clients`, `/api/clients/:id/projects`, `/api/projects`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [entity-fields.md](../entity-fields.md), [technical/phase-03-clients-projects.md](../technical/phase-03-clients-projects.md), the step file [Phaces/04-clients-projects.md](../Phaces/04-clients-projects.md).

## Before you start

- **Guards:** `@TenantAuth()` + `@Module('clients')` or `@Module('projects')` on every route (GET→view, POST→create, PATCH→edit, DELETE→delete, resolved against `doc/notes/roles-permissions.md`'s matrix). `sales` has `clients: full` / `projects: view`.
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt` on every call below. For the role-restriction and isolation scenarios you also need `manager@dupont.test`, `sales@dupont.test` (same password), and `admin@verhelst.test` (another tenant) — all seeded by `yarn seed:tenants`.
- The **closing guard is decided**: `in_progress → completed` is never blocked by unpaid invoices/bills (doc/notes/technical/phase-03-clients-projects.md § "The closing guard"). Do not expect a payment check anywhere below.
- `DELETE /api/projects/:id` is a **real hard delete**, `prospect`-status only, and cascades to that project's `media` rows (ImageKit + database) via `MediaService.deleteAllForEntity`. Every other status refuses it.
- Every record you create in these tests should start with `TEST`, same convention as `00-how-to-test.md` § 5.

---

## 1. Clients

### CLI-01 — A `professional` client with no `vat_number` is rejected

```
curl -b jar.txt -X POST http://localhost:5391/api/clients -H "Content-Type: application/json" \
  -d '{"type":"professional","name":"TEST Pro NoVat","email":"test-pro-novat@test.invalid","phone":"+32 470 00 00 01","country":"BE"}'
```

**Expected:** `400`, "vat_number is required for a professional client".

### CLI-02 — Same email, same tenant, is rejected; a different tenant is allowed

Create a client with `email: test-dup@test.invalid` as `admin@dupont.test`, then the same email again.

**Expected:** first `201`, second `409` "A client with this email already exists". The same email as `admin@verhelst.test` (a different tenant) → `201`, allowed.

### CLI-03 — Archive, not delete

```
curl -b jar.txt -X DELETE http://localhost:5391/api/clients/<id>
```

**Expected:** `200`, `is_active: false`. `GET /api/clients/<id>` right after still returns `200` with the same row (not gone) — only `is_active` changed.

### CLI-04 — A project cannot be created for an archived client

`POST /api/projects` with `client_id` of the client archived in CLI-03.

**Expected:** `400`, "Cannot create a project for an archived client".

### CLI-05 — `sales` can create a client, but only view projects

As `sales@dupont.test`: `POST /api/clients` → `201`. `GET /api/projects` → `200`. `POST /api/projects` → `403` "No canCreate access to projects".

---

## 2. Projects — creation and the status matrix

### PRJ-01 — Create a project → `prospect`, one history row

```
curl -b jar.txt -X POST http://localhost:5391/api/projects -H "Content-Type: application/json" \
  -d '{"client_id":<active client id>,"name":"TEST Project A"}'
```

**Expected:** `201`, `status: "prospect"`. `GET /api/projects/<id>/history` → exactly one row, `from_status: null`, `to_status: "prospect"`.

### PRJ-02 — `end_date` before `start_date` is rejected

```
curl -b jar.txt -X POST http://localhost:5391/api/projects -H "Content-Type: application/json" \
  -d '{"client_id":<id>,"name":"TEST Bad Dates","start_date":"2026-06-01","end_date":"2026-01-01"}'
```

**Expected:** `400`. Caught by the handler before the DB, backed by the `chk_project_dates` CHECK constraint if that layer is ever bypassed.

### PRJ-03 — `prospect → completed` is refused (not in the matrix)

`PATCH /api/projects/<id>/status` `{"status":"completed"}` on a fresh `prospect` project.

**Expected:** `400`, "Cannot move a project from prospect to completed".

### PRJ-04 — `prospect → in_progress` is allowed, history written

**Expected:** `200`, `status: "in_progress"`. History now has 2 rows, newest first, `from_status: "prospect"`.

### PRJ-05 — `in_progress → completed` is allowed with **zero** invoices/payments

**Expected:** `200`, `status: "completed"`, `actual_end_date` set to today. No payment check anywhere — this is the decided closing-guard behavior, not a bug.

### PRJ-06 — `cancelled` is final

Cancel a (different) `prospect` project (`{"status":"cancelled"}`), then try `{"status":"in_progress"}` on it.

**Expected:** cancel → `200`. The next move → `400`, "Cannot move a project from cancelled to in_progress" — refused for everyone, including admin.

### PRJ-07 — `completed → in_progress` (reopen) is admin-only

On the project from PRJ-05: `PATCH .../status {"status":"in_progress"}` as `manager@dupont.test` → `403` "Only an admin can reopen a completed project". Same call as `admin@dupont.test` → `200`.

### PRJ-08 — The generic `PATCH /api/projects/:id` cannot change `status`

```
curl -b jar.txt -X PATCH http://localhost:5391/api/projects/<id> -H "Content-Type: application/json" \
  -d '{"status":"completed","name":"TEST Renamed"}'
```

**Expected:** `400`, "property status should not exist" — whitelist validation refuses the whole request outright (stricter than merely ignoring the field).

### PRJ-09 — `projects` has no `budget` or `progress_pct` column

`GET /api/projects/<id>` → neither key is present in the response, ever.

---

## 3. Delete — `prospect`-only, cascades to media

### PRJ-10 — Delete a `prospect` project with uploaded files

Create a `prospect` project, upload 2 files to it (`entity_type=project`, that `entity_id`), then:

```
curl -b jar.txt -X DELETE http://localhost:5391/api/projects/<id>
```

**Expected:** `200`, `{ "id": <id>, "deleted": true }`. `GET /api/projects/<id>` right after → `404`. `GET /api/media?entity_type=project&entity_id=<id>` → empty list. Both rows are gone from the database, not just hidden (check `select * from media where entity_id = <id>` directly if in doubt) — and from ImageKit.

### PRJ-11 — Delete refused on any non-`prospect` status

`DELETE /api/projects/<id>` on an `in_progress` (or `completed`/`cancelled`) project.

**Expected:** `400`, "Only a project with status prospect can be deleted". The project and any of its media are untouched.

---

## 4. Tenant isolation

### ISO-CP-01 — Tenant A cannot read or list tenant B's clients/projects

As `admin@verhelst.test`, `GET /api/clients/<a dupont client id>` → `404`. `GET /api/projects/<a dupont project id>` → `404`. `GET /api/clients` and `GET /api/projects` as Verhelst only ever return Verhelst's own `tenant_id`.

---

## Clean up after testing

Same spirit as `00-how-to-test.md` § 5 — delete anything named `TEST%`:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from media where entity_type = 'project' and entity_id in (select id from projects where name like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from project_status_history where project_id in (select id from projects where name like 'TEST%');"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from projects where name like 'TEST%';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from clients where name like 'TEST%';"
```
