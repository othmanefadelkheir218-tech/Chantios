# Tests — Tenants

> Routes: `/api/admin/tenants`. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [entity-fields.md](../entity-fields.md) § `tenants`.

| Method | Path | What |
|---|---|---|
| `POST` | `/api/admin/tenants` | Create a company |
| `GET` | `/api/admin/tenants` | List, search, filter by status |
| `GET` | `/api/admin/tenants/:id` | Read one |
| `PATCH` | `/api/admin/tenants/:id` | Update some fields |
| `PATCH` | `/api/admin/tenants/:id/status` | `active` / `suspended` / `banned` |

---

## Create

### TEN-01 — Create with only the required fields

Send `POST /api/admin/tenants`:

```json
{ "name": "TEST Alpha", "email": "test-alpha@test.invalid" }
```

**Expected**
- Status `201`.
- The body has an `id` (integer) and these defaults: `default_vat_rate` `"21"`, `default_payment_days` `30`, `locale` `"fr"`, `currency` `"EUR"`, `timezone` `"Europe/Brussels"`, `end_of_day_reminder_time` `"18:00"`, `status` `"active"`.
- Every other field is `null`.
- Keys are `snake_case`.

Copy the `id`: it is `TENANT_A` below.

### TEN-02 — Create with every field

```json
{
  "name": "TEST Beta",
  "email": "TEST-Beta@Test.Invalid",
  "legal_name": "Beta SRL",
  "vat_number": "BE0111222333",
  "registration_number": "0111.222.333",
  "phone": "+32 2 555 66 77",
  "address_line1": "Rue Test 1",
  "address_line2": "Box 2",
  "postal_code": "1000",
  "city": "Brussels",
  "country": "BE",
  "default_vat_rate": "6",
  "default_payment_days": 45,
  "locale": "en",
  "currency": "EUR",
  "timezone": "Europe/Brussels",
  "end_of_day_reminder_time": "17:30"
}
```

**Expected**
- Status `201`.
- `email` comes back **lower case**: `test-beta@test.invalid`.
- Every value you sent is returned. `end_of_day_reminder_time` is `"17:30"`.

### TEN-03 — Same email twice is refused

Send TEN-01 again. Then send it again with the email in upper case: `TEST-ALPHA@TEST.INVALID`.

**Expected**
- Both: status `409`, message `Email test-alpha@test.invalid is already used`.
- No new row (`GET` list still shows one `TEST Alpha`).

### TEN-04 — Validation

Send each body. **Expected for all: status `400`.**

| Body | Message contains |
|---|---|
| `{ "email": "a@b.test" }` | `name should not be empty` |
| `{ "name": "TEST X" }` | `email must be an email` |
| `{ "name": "TEST X", "email": "not-an-email" }` | `email must be an email` |
| `{ "name": "TEST X", "email": "x@x.test", "phone": "abc" }` | `phone is not valid` |
| `{ "name": "TEST X", "email": "x@x.test", "country": "BEL" }` | `country` length |
| `{ "name": "TEST X", "email": "x@x.test", "locale": "de" }` | `locale must be one of` |
| `{ "name": "TEST X", "email": "x@x.test", "default_vat_rate": "abc" }` | `default_vat_rate is not valid` |
| `{ "name": "TEST X", "email": "x@x.test", "default_payment_days": -1 }` | `default_payment_days must not be less than 0` |
| `{ "name": "TEST X", "email": "x@x.test", "end_of_day_reminder_time": "25:00" }` | `end_of_day_reminder_time must be HH:mm` |
| `{ "name": "TEST X", "email": "x@x.test", "status": "banned" }` | `property status should not exist` |
| `{ "name": "TEST X", "email": "x@x.test", "tenant_id": "x" }` | `property tenant_id should not exist` |

No `TEST X` tenant may exist after this.

---

## Read

### TEN-05 — List

`GET /api/admin/tenants`

**Expected**
- Status `200`, `{ data: [...], total, page: 1, limit: 20, total_pages }`.
- At least the 2 demo tenants and your `TEST` tenants. Newest first.

### TEN-06 — Paging

`GET /api/admin/tenants?limit=1&page=2`

**Expected**
- `data` has 1 row. `page` is `2`, `limit` is `1`.
- It is a different tenant from `page=1`.

`GET /api/admin/tenants?limit=0` and `?limit=101` and `?page=0` → status `400`.

### TEN-07 — Search and filter

| Request | Expected |
|---|---|
| `?search=test alpha` | Only `TEST Alpha` (search is not case sensitive) |
| `?search=brussels` | Tenants whose name, legal name, email or city contains it |
| `?search=zzzz-nothing` | `data: []`, `total: 0` |
| `?status=active` | Only active tenants |
| `?status=suspended` | Empty at first |
| `?status=nope` | `400` |

### TEN-08 — Read one

`GET /api/admin/tenants/TENANT_A`

**Expected** status `200`, the same body as TEN-01.

| Request | Expected |
|---|---|
| `/api/admin/tenants/abc` | `400`, `Validation failed (numeric string is expected)` |
| `/api/admin/tenants/999999999` | `404`, message `Tenant not found` |

---

## Update

### TEN-09 — Update some fields

`PATCH /api/admin/tenants/TENANT_A`

```json
{ "city": "Ghent", "end_of_day_reminder_time": "17:45", "default_vat_rate": "6" }
```

**Expected**
- Status `200`. `city` is `Ghent`, the time is `"17:45"`, the rate is `"6"`.
- Fields you did not send are unchanged.
- `updated_at` is newer than `created_at`.
- An empty body `{}` → `200` and nothing changes.

### TEN-10 — Update the email

| Body | Expected |
|---|---|
| `{ "email": "test-alpha2@test.invalid" }` | `200`, new email |
| `{ "email": "test-beta@test.invalid" }` (used by `TEST Beta`) | `409` |
| `{ "email": "test-alpha2@test.invalid" }` again, on the same tenant | `200` (it is its own email) |
| `{ "status": "banned" }` | `400` — status has its own route |

### TEN-11 — Update an unknown tenant

`PATCH /api/admin/tenants/999999999` with `{ "city": "x" }` → `404`.

---

## Status

### TEN-12 — Suspend and reactivate

`PATCH /api/admin/tenants/TENANT_A/status`

```json
{ "status": "suspended", "reason": "Payment failed three times" }
```

**Expected**
- Status `200`, `status` is `"suspended"`.
- `GET /api/admin/tenants?status=suspended` lists it.
- In [05](05-audit-analytics-feedback.md) (AUD-03) the audit entry shows `old_value.status = active`, `new_value.status = suspended` and the reason.

Then send `{ "status": "active" }` → `200`, active again.

### TEN-13 — Status errors

| Body | Expected |
|---|---|
| `{ "status": "active" }` on an active tenant | `400`, message `Tenant is already active` |
| `{ "status": "frozen" }` | `400` |
| `{}` | `400` |
| `{ "status": "banned" }` on an unknown id | `404` |

### TEN-14 — Banned works too

Set `TENANT_A` to `banned`, check it, set it back to `active`. **Expected** `200` each time.

> Not built yet: a suspended or banned tenant's users are not logged out. That arrives with login (step 02).

---

## Soft delete & restore

Independent of `status` — see [entity-fields.md](../entity-fields.md).

### TEN-15 — Soft delete one

`DELETE /api/admin/tenants/TENANT_A`

**Expected**
- `200`, `deleted_at` is set, `status` unchanged.
- `GET /api/admin/tenants/TENANT_A` → `404`, `Tenant not found`.
- `GET /api/admin/tenants` → the tenant is not in the list.
- Calling `DELETE` again on the same id → `400`, `Tenant is already deleted`.

### TEN-16 — Restore one

`PATCH /api/admin/tenants/TENANT_A/restore`

**Expected**
- `200`, `deleted_at` is `null` again, tenant visible in `GET` again.
- Calling `PATCH .../restore` on a tenant that is **not** deleted → `400`, `Tenant is not deleted`.
- Unknown id on either route → `404`, `Tenant not found`.

### TEN-17 — Bulk soft delete and restore

`DELETE /api/admin/tenants` with `{ "ids": [A, B] }`, then `PATCH /api/admin/tenants/restore` with the same body.

**Expected**
- Response is `{ "count": N }` — the number actually changed, not necessarily `ids.length`.
- Send a mix of one already-deleted id and one not-deleted id → `count` is `1`, not `2`, and the call does **not** error (bulk skips, it does not refuse).
- `{ "ids": [] }` → `400`, `ids must contain at least 1 elements`.

---

## Email verification

Independent of `status` and of `deleted_at` — see [entity-fields.md](../entity-fields.md). Not required at creation: a freshly created tenant has `email_verified_at: null`.

### TEN-18 — Send a verification code

`POST /api/admin/tenants/TENANT_A/send-verification-email`

**Expected**
- `201`, body `{ "sent": true }`. An email was sent to the tenant's own `email` (check your Resend logs/inbox — there is no way to read the code back through the API).
- Unknown id → `404`, `Tenant not found`.
- Calling it again on an already-verified tenant (after TEN-20) → `400`, `Email already verified`.

### TEN-19 — Verify with a wrong code

`PATCH /api/admin/tenants/TENANT_A/verify-email` with `{ "code": "000000" }` (or any code that does not match the one just emailed)

**Expected**
- `400`, `Invalid or expired code`.
- The real code sent in TEN-18 is **not** consumed — it can still be retried (no attempt limit for `email_verification`, unlike `password_reset`/`admin_2fa`).

### TEN-20 — Verify with the right code

`PATCH /api/admin/tenants/TENANT_A/verify-email` with `{ "code": "<the code from the email>" }`

**Expected**
- `200`, `email_verified_at` is now set, `status` and `deleted_at` unchanged.
- Verifying again with the same code → `400`, `Email already verified` (the tenant is verified now, not the code logic).

### TEN-21 — Sending a new code invalidates the old one

Send a code (TEN-18), then send a second one **before** verifying with the first.

**Expected**
- The first code no longer works, even though it has not expired — `PATCH .../verify-email` with it → `400`, `Invalid or expired code`.
- Only the second (latest) code verifies successfully.

### TEN-22 — Body validation on `verify-email`

| Body | Expected |
|---|---|
| `{ "code": "123" }` (too short) | `400`, `code must be longer than or equal to 6 characters` |
| `{ "code": "abcdef" }` (not digits) | `400`, `code must be a number string` |
| `{}` (missing) | `400`, both messages above |

---

## Known limits (not bugs)

- These routes need the admin login cookie (see [00-how-to-test.md](00-how-to-test.md) § 2b). Any admin role may use them.
- Creating a tenant here creates **only** the company row. No subscription and no first user are created. This is an open question in [A_progress-tracker.md](../A_progress-tracker.md).
- There is no "read the code back" route — testing TEN-18/19/20/21 end to end needs a real inbox at the tenant's `email`, or a direct DB insert into `one_time_codes` with a known `code_hash` (sha256 of the code) to simulate it.
