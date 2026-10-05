# Tests — Admin users

> Routes: `/api/admin/admin-users`. ChantierOS staff only — not company employees.
> Read [00-how-to-test.md](00-how-to-test.md) first. Rules: [roles-permissions.md](../roles-permissions.md), [auth-tokens.md](../auth-tokens.md) § password hashing.

| Method | Path | What |
|---|---|---|
| `POST` | `/api/admin/admin-users` | Create |
| `GET` | `/api/admin/admin-users` | List and search |
| `PATCH` | `/api/admin/admin-users/:id` | Change name, role or password |
| `DELETE` | `/api/admin/admin-users/:id` | Deactivate (never deleted) |

There is no `GET /:id` route in this step.

---

## ADM-01 — Create

`POST /api/admin/admin-users`

```json
{
  "email": "test-staff@test.invalid",
  "name": "TEST Staff",
  "password": "a-long-test-password",
  "role": "staff"
}
```

**Expected**
- Status `201`.
- The body has exactly: `id`, `email`, `name`, `role`, `is_active` (`true`), `created_at`, `updated_at`.
- **There is no `password`, `password_hash` or `totp_secret` in the body.** This matters.

Copy the `id`: it is `ADMIN_A`.

Check the password is hashed, not readable:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select email, left(password_hash, 9) as start from admin_users where email = 'test-staff@test.invalid';"
```

**Expected** `start` is `$argon2id`.

## ADM-02 — Email is lower-cased and unique

| Body | Expected |
|---|---|
| Same body with `"email": "TEST-STAFF@TEST.INVALID"` | `409`, `Email test-staff@test.invalid is already used` |
| `"email": "TEST-Other@Test.Invalid"`, role `super_admin` | `201`, email stored as `test-other@test.invalid` |

## ADM-03 — Validation (all `400`)

| Body | Message contains |
|---|---|
| password `"short"` | `password must be longer than or equal to 12 characters` |
| password of exactly 11 characters | same |
| password of exactly 12 characters | **`201`** — accepted (delete it with ADM-08 cleanup) |
| `"role": "admin"` | `role must be one of the following values: super_admin, staff` |
| no `name` | `name should not be empty` |
| `"email": "bad"` | `email must be an email` |
| an extra field `"is_active": false` | `property is_active should not exist` |

## ADM-04 — List and search

`GET /api/admin/admin-users`

**Expected** `200`, a paged list, newest first. Every item has the 7 safe fields only — **no hash in any row**.

| Request | Expected |
|---|---|
| `?search=test staff` | Only `TEST Staff` |
| `?search=TEST-STAFF@` | Only `TEST Staff` (search covers email too) |
| `?limit=1&page=2` | One row, `page` is `2` |

The super-admin from the seed (`admin@chantieros.local`) is in the list too.

## ADM-05 — Update

`PATCH /api/admin/admin-users/ADMIN_A`

| Body | Expected |
|---|---|
| `{ "name": "TEST Staff Renamed" }` | `200`, new name, same role |
| `{ "role": "super_admin" }` | `200`, role `super_admin` |
| `{ "password": "another-long-password" }` | `200`. In the table, `password_hash` has **changed** (compare before and after) |
| `{ "password": "short" }` | `400` |
| `{ "email": "x@x.test" }` | `400` — the email cannot change (`property email should not exist`) |
| `{ "role": "owner" }` | `400` |

Unknown id (`999999999`) → `404`, `Admin user not found`. Bad id `abc` → `400`, `Validation failed (numeric string is expected)`.

## ADM-06 — Deactivate

`DELETE /api/admin/admin-users/ADMIN_A`

**Expected**
- Status `204`, empty body.
- The row is **still there**, with `is_active = false`:

```powershell
& docker exec chantieros_postgres psql -U chantieros -d chantieros -c "select email, is_active from admin_users where email = 'test-staff@test.invalid';"
```

- `GET /api/admin/admin-users?search=test staff` still lists it, with `is_active: false`.
- A second `DELETE` on the same id is also `204` (nothing breaks).
- Unknown id → `404`.

## ADM-07 — The password never leaks into the audit log

After ADM-01 to ADM-05, call `GET /api/admin/audit-logs?entity_type=admin_user`.

**Expected**
- Entries `create`, `update`, `deactivate` exist for your admin.
- In `new_value`, `password` shows `[redacted]`. The clear password `a-long-test-password` appears **nowhere**.

## ADM-08 — Clean up

Use § 5 of [00-how-to-test.md](00-how-to-test.md). It deletes admin users whose email starts with `test-`.

---

## Known limits (not bugs)

- No login yet: these accounts cannot sign in until step 02.
- Deactivating an admin does not log them out yet (no sessions exist before step 02).
- Nothing stops you deactivating the last super-admin. Not decided.
