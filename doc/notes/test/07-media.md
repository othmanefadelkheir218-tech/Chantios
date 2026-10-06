# Tests — Media & Files

> Routes: `/api/media`, plus `POST /api/users/me/avatar` and `POST /api/media/tenant-logo`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [media-files.md](../media-files.md), the step file [Phaces/03-media.md](../Phaces/03-media.md).

## Before you start

- **Guards:** `AuthGuard` + `TenantGuard` + `SubscriptionGuard` + `PermissionGuard` on every `/api/media/...` route (`@Module('media')`, except `storage/usage` and `tenant-logo` which are `@Module('settings')`). `POST /api/users/me/avatar` only needs `AuthGuard` + `TenantGuard` (it is always the caller's own avatar).
- **Log in first.** `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`, then `-b jar.txt` on every call below.
- Keep two small test files around: `test.jpg` (<1MB), `test.pdf`, and one file ≥11MB (`dd if=/dev/zero of=big.jpg bs=1M count=11` on macOS/Linux, or any large file).
- `media:view`'s `scope` is `own` for `worker`, `all` for every other role (`doc/notes/roles-permissions.md`).

---

## 1. Upload

### MED-01 — Upload a 2MB JPG to `entity_type = report`

```
curl -b jar.txt -F "entity_type=report" -F "entity_id=1" -F "file=@test.jpg" http://localhost:5391/api/media
```

**Expected:** `201`. Body has `id`, `file_url` (reachable in a browser), `file_type: image/jpeg`, `file_size`, `is_locked: false`, `deleted_at: null`. One `audit_logs` row, `action = upload`, `entity_type = media`.

### MED-02 — Upload an 11MB file is rejected before ImageKit is called

```
curl -b jar.txt -F "entity_type=report" -F "entity_id=1" -F "file=@big.jpg" http://localhost:5391/api/media
```

**Expected:** `400`, "File too large". Check the ImageKit media library — nothing new was uploaded.

### MED-03 — A PDF to `entity_type = report` is rejected (images only)

```
curl -b jar.txt -F "entity_type=report" -F "entity_id=1" -F "file=@test.pdf" http://localhost:5391/api/media
```

**Expected:** `400`, names the allowed types for `report`.

### MED-04 — A JPG to `entity_type = purchase_invoice` is rejected (PDF only)

```
curl -b jar.txt -F "entity_type=purchase_invoice" -F "entity_id=1" -F "file=@test.jpg" http://localhost:5391/api/media
```

**Expected:** `400`.

---

## 2. Read

### MED-05 — List and get one

`GET /api/media?entity_type=report&entity_id=1`, then `GET /api/media/<id>` from MED-01.

**Expected:** both `200`. The list is paginated (`data, total, page, limit, total_pages`).

### MED-06 — An unknown id is a 404

`GET /api/media/999999` → `404 Media not found`.

### MED-07 — A worker only sees their own uploads (`scope = own`)

1. Log in as `worker@dupont.test` (a second cookie jar), upload one file (MED-01-style).
2. `GET /api/media` as that worker → only their own rows.
3. `GET /api/media` as `admin@dupont.test` → every row for the tenant, including the worker's.

---

## 3. Rename

### MED-08 — Rename changes `file_name` only

`PATCH /api/media/<id>`, body `{ "file_name": "front-photo.jpg" }`.

**Expected:** `200`, `file_name` changed, `file_url` identical to before. One `audit_logs` row, `action = rename`.

---

## 4. Soft delete, restore, hard delete

Upload two files for this section; note their ids. Mark one `is_locked = true` directly (`yarn prisma:studio`, or `UPDATE media SET is_locked = true WHERE id = <id>`) to test the skip rule.

### MED-09 — Soft delete, one of the two locked

`DELETE /api/media`, body `{ "ids": [<unlocked_id>, <locked_id>] }`.

**Expected:** `200`. Body's `deleted` has only the unlocked row; `skipped` has the locked id. `select deleted_at from media where id = <unlocked_id>` is now set; the locked row's `deleted_at` is still `null`. The ImageKit file for the unlocked row still exists (untouched).

### MED-10 — A soft-deleted row disappears from normal reads but still bills

1. `GET /api/media?entity_type=report&entity_id=1` → the trashed id is absent.
2. `GET /api/media/storage/usage` → `bytes` still includes the trashed row's `file_size`.

### MED-11 — Restore

`PATCH /api/media/restore`, body `{ "ids": [<unlocked_id>] }`.

**Expected:** `200`. `GET /api/media/<unlocked_id>` now works again; `deleted_at` is `null`.

### MED-12 — Hard delete a normal row

Upload one more throwaway file, note its id and ImageKit `file_id` (Prisma Studio). `DELETE /api/media/permanent`, body `{ "ids": [<id>] }`.

**Expected:** `200`. The row is gone from `media` (`select * from media where id = <id>` → no rows) and the file is gone from the ImageKit media library.

### MED-13 — Hard delete an `is_locked` id is skipped

`DELETE /api/media/permanent`, body `{ "ids": [<locked_id>] }`.

**Expected:** `200`, `deleted: []`, `skipped: [<locked_id>]`. The row and its ImageKit file both still exist.

### MED-14 — Trash older than 30 days is purged; recent trash is not

1. Soft-delete two files (MED-09-style), then backdate one: `UPDATE media SET deleted_at = now() - interval '31 days' WHERE id = <id_old>;` — leave the other's `deleted_at` as "now".
2. `yarn job:media-purge`.

**Expected:** prints `{ purged: 1, skipped: 0 }` (or more, if other trash existed). `id_old` is gone from `media` and from ImageKit. The row trashed "now" still exists.

---

## 5. Replace (avatar, tenant logo)

### MED-15 — Replace a user avatar twice

```
curl -b jar.txt -F "file=@test.jpg" http://localhost:5391/api/users/me/avatar
curl -b jar.txt -F "file=@test.jpg" http://localhost:5391/api/users/me/avatar
```

**Expected:** both `201`. `select count(*) from media where entity_type = 'user' and entity_id = <user_id>;` is **1** — the first row was hard-deleted (not trashed) when the second was created. The first upload's ImageKit file is gone from the media library.

### MED-16 — Replace the tenant logo updates `logo_media_id`

`curl -b jar.txt -F "file=@test.jpg" http://localhost:5391/api/media/tenant-logo` (admin only — `settings` module is `admin`-only in the default matrix).

**Expected:** `201`. `select logo_media_id from tenants where id = <tenant_id>;` now points at the new `media` row.

### MED-17 — A non-admin cannot replace the tenant logo

Same call as MED-16, logged in as `manager@dupont.test`.

**Expected:** `403` (`settings` is `none` for every role but `admin`).

---

## 6. Cascade cleanup (`deleteAllForEntity`)

No route yet — step 04 (`projects`) is the only caller, not built. To exercise `MediaService.deleteAllForEntity` directly until then, use a short Nest REPL/script, or wait for step 04's acceptance run, which must show: a project with 3 `media` rows (one `is_locked`) → `deleteAllForEntity('project', id)` hard-deletes the 2 unlocked rows (ImageKit + database); the locked one is skipped.

---

## 7. Isolation

### MED-18 — Tenant A cannot list or delete tenant B's media

1. Upload a file as `admin@dupont.test` (tenant 1), note its id.
2. As `admin@verhelst.test` (tenant 2): `GET /api/media/<id>` → `404`. `DELETE /api/media` with `{ "ids": [<id>] }` → `200` but `deleted: []` (the row is invisible to this tenant, so nothing matches).

Covered automatically for every tenant-scoped table, `media` included, by `test/tenant-isolation.e2e-spec.ts` (`yarn test:e2e`).

---

## Clean up after testing

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from audit_logs where entity_type = 'media';"
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "delete from media where file_name in ('test.jpg','test.pdf','front-photo.jpg','big.jpg');"
```

Also remove any test files you uploaded from the ImageKit media library by hand (the dev ImageKit account, not production).
