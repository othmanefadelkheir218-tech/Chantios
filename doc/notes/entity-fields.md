# ChantierOS — Core Entity Fields

> Status: v1 (working draft). The field list for the tables the other notes talk about but never spell out. Names follow [[naming-conventions]].

Every table below also has `id` (integer, auto-increment), `created_at` and `updated_at`.

> **Decision (2026-10-05):** ids were UUID in the original design; switched to plain auto-increment integers at the user's request. This trades away the non-enumerability UUIDs gave across tenants in a multi-tenant app — a sequential id lets one tenant guess the row count / existence of another tenant's records. Accepted knowingly; no further mitigation built for it.

Every **business** table has `tenant_id NOT NULL`. The platform tables have none, because they are shared by everyone or belong to no company: `tenants`, `admin_users`, `plans`, `plan_features`, `stripe_events`, `roles`, `refresh_tokens`, `one_time_codes`. `categories` and `cost_types` have a **nullable** `tenant_id` — `NULL` means a shared default row.

---

## `tenants` — one row per company

| Field | Meaning |
|---|---|
| `name` | Company name |
| `legal_name` | Registered name, if different |
| `vat_number` | Company VAT number — printed on invoices |
| `registration_number` | Company register number |
| `email` | Main contact email |
| `phone` | Main phone |
| `address_line1` | Street |
| `address_line2` | Optional |
| `postal_code` | — |
| `city` | — |
| `country` | ISO 2-letter code |
| `logo_media_id` | FK → `media.id` — printed on quotes and invoices |
| `default_vat_rate` | VAT pre-fill for new document lines — `21.00` |
| `default_payment_days` | How many days a client gets to pay — `30`. Fills `invoices.due_date` |
| `locale` | `fr` / `en` / `ar` |
| `currency` | ISO code — `EUR` |
| `timezone` | e.g. `Europe/Brussels` |
| `end_of_day_reminder_time` | When the hours reminder fires — default `18:00` |
| `status` | `active` / `suspended` / `banned` |
| `deleted_at` | **Nullable.** Soft delete — set when a tenant is deleted, cleared on restore. `NULL` = not deleted. Independent of `status`: a deleted tenant keeps whatever status it had |
| `email_verified_at` | **Nullable.** Not required at creation — `NULL` = not verified. Set when the tenant confirms a code sent to `email`. See `one_time_codes` in [auth-tokens.md](auth-tokens.md) |

`default_vat_rate` is what makes the VAT rate owner-configurable. Each quote and invoice copies it at creation as its own `default_vat_rate`, so changing it later never shifts an existing document. The rate that actually counts sits on each **line** — see § VAT below.

**Decision (2026-10-05):** soft delete added at the user's request. `deleted_at` is a separate column from `status` — deleting a tenant is not the same action as banning it, and a banned tenant can still be un-banned without touching `deleted_at`. A deleted tenant (`deleted_at IS NOT NULL`) is excluded from normal list/find queries. `DELETE /api/admin/tenants/:id` and bulk `DELETE /api/admin/tenants` (body `{ ids }`) set it; `PATCH /api/admin/tenants/:id/restore` and bulk `PATCH /api/admin/tenants/restore` (body `{ ids }`) clear it. See [Phaces/01-platform.md](Phaces/01-platform.md) for the routes.

**Decision (2026-10-05):** tenant email verification added at the user's request, independent of the (unbuilt) `users.email_verified_at` from step 02 — this one is for the tenant's own contact `email`, reachable before any `users` row exists. Flow: `POST /api/admin/tenants/:id/send-verification-email` generates a 6-digit code (`one_time_codes`, type `email_verification`, `tenant_id` set, 24h lifetime, no attempt limit — same rules as the step 02 table), emails it via the new `src/email/` module (Resend), and `PATCH /api/admin/tenants/:id/verify-email` (body `{ code }`) consumes it and sets `email_verified_at`. Generating a new code consumes any still-active one for that tenant first, so only the latest code works. Nothing in the app currently *requires* a verified email — this only records the fact.

---

## `clients` — who pays

| Field | Meaning |
|---|---|
| `type` | `individual` / `professional` / `property_manager` |
| `name` | Person name, or company name for the other two types |
| `contact_name` | The person to talk to at a company — nullable |
| `email` | Required — the portal link, quotes and invoices are emailed here |
| `phone` | Required — format validated |
| `phone_secondary` | Optional |
| `vat_number` | Required for `professional`, otherwise nullable |
| `address_line1` | Street — appears on the invoice |
| `address_line2` | Optional |
| `postal_code` | — |
| `city` | — |
| `country` | ISO 2-letter code |
| `note` | Internal free text — never shown in the portal |
| `is_active` | `false` = archived, never deleted |

`email` is required because the whole client-facing flow is email: quote sent, invoice sent, late reminder, portal link. A client without an email cannot be served.

It is `UNIQUE (tenant_id, email)` — unique **per company**, not app-wide.

The point is **one card per person**. A client has many projects over the years, all hanging off that one `clients` row. If staff could create a second card with the same email, that person's history would split in two and nobody would see the whole relationship. The constraint forces a duplicate to be caught at creation.

It is scoped per tenant, not app-wide, because two different companies may serve the same person — and a client never logs in, so there is nothing to disambiguate.

---

## `projects` — one job

| Field | Meaning |
|---|---|
| `client_id` | FK → `clients.id` (required) |
| `name` | e.g. "Dubois — bathroom renovation" |
| `description` | What the job is |
| `status` | `prospect` / `in_progress` / `completed` / `cancelled` |
| `address_line1` | Site address — often not the client's address |
| `address_line2` | Optional |
| `postal_code` | — |
| `city` | — |
| `start_date` | Planned start — nullable while `prospect` |
| `end_date` | Planned end — DB check: not before `start_date` |
| `actual_end_date` | Set when status becomes `completed` |
| `manager_id` | FK → `users.id` — who runs this job |
| `created_by` | FK → `users.id` |

### What `projects` deliberately does NOT store

| Not a column | Where it comes from |
|---|---|
| Budget | `SUM(quotes.amount_excl_vat)` where `status = 'accepted'` — in `project_margin_live` |
| Progress % | `progress_pct` of the newest row in `reports` |
| Real cost | `project_margin_live` |
| Margin | `project_margin_live`, then frozen into `project_closure_snapshots` |

Same rule as stock: no running value is stored while the project is active.

---

## `quotes` — the agreed price

| Field | Meaning |
|---|---|
| `client_id` | FK → `clients.id` (required) |
| `project_id` | FK → `projects.id` (required) |
| `number` | `QUO-2026-0001` — see [[document-numbering]] |
| `status` | `draft` / `sent` / `accepted` / `refused` |
| `issue_date` | Date on the document |
| `valid_until` | Offer expiry date |
| `default_vat_rate` | Copied from `tenants.default_vat_rate` — pre-fill for new lines only |
| `amount_excl_vat` | Total of the lines, no VAT — **stored** |
| `vat_amount` | VAT, summed per rate group — **stored** |
| `amount_incl_vat` | `amount_excl_vat + vat_amount` — **stored** |
| `note` | Terms, conditions, free text printed on the PDF |
| `sent_at` | When it was emailed — nullable |
| `accepted_at` | When the client accepted — nullable |
| `refused_at` | When the client refused — nullable |
| `created_by` | FK → `users.id` |

`accepted_at` is what makes budget history free: the list of accepted quotes with their dates and amounts **is** the history of the budget. No separate history table is needed.

### Why the three total columns are stored

The lines are the truth while the quote is `draft` — the service recalculates the three columns on every line change. Once the quote is `sent`, the lines are locked and the totals are frozen with them. A document that was sent must never change its total.

`invoices` carries the same three columns, under the same rule. The budget in `project_margin_live` reads `quotes.amount_excl_vat` directly.

### `quote_lines`

| Field | Meaning |
|---|---|
| `quote_id` | FK → `quotes.id` |
| `service_id` | FK → `services.id` — **nullable** |
| `description` | Line text — pre-filled from the service, editable |
| `unit` | m², h, piece… |
| `quantity` | — |
| `unit_price_excl_vat` | — |
| `vat_rate` | **The rate for this line** — 6 or 21. Pre-filled, editable |
| `total_excl_vat` | DB-computed: `quantity × unit_price_excl_vat` |
| `position` | Display order |

`service_id` is optional on purpose. A line picked from the catalogue reserves stock through the recipe; a free-text line reserves nothing. Staff must be able to write a free line.

---

## VAT — the rate is on the line, not on the document

Belgian renovation work is often **6%** while supplies on the same job are **21%**. One `vat_rate` column on the document cannot hold two numbers, so the rate sits on each line. `invoice_lines` carries the same column under the same rule.

The tenant still controls the number — `tenants.default_vat_rate` pre-fills it, and a service can carry its own `services.default_vat_rate` so a labor service pre-fills 6% by itself. Staff only corrects the exception.

The document keeps its three **stored** totals, computed per rate group then summed:

```
for each distinct vat_rate on the lines:
    group_excl_vat = SUM(total_excl_vat) of the lines at that rate
    group_vat      = round(group_excl_vat × vat_rate / 100, 2)

amount_excl_vat = SUM(group_excl_vat)
vat_amount      = SUM(group_vat)
amount_incl_vat = amount_excl_vat + vat_amount
```

Rounding happens **once per rate group**. The per-rate breakdown that a Belgian invoice must print is read back from the lines, which are frozen on `sent` anyway — so no extra table is needed.

---

## `users` — see [[roles-permissions]]

Already documented there. The fields that matter for other modules: `role_id`, `hourly_rate`, `mobile_pin_hash`, `is_active`.

---

## Required-field rules worth building as DB checks

| Rule | Where |
|---|---|
| `end_date` not before `start_date` | `projects`, `tasks`, `subcontractor_contracts` |
| `progress_pct` between 0 and 100 | `reports` |
| `hours` between 0 and 24 | `time_entries` |
| `quantity` not zero | `quote_lines`, `invoice_lines` |
| `vat_number` required when `clients.type = 'professional'` | `clients` |
| A quote cannot be `accepted` with zero lines | `quotes` |
| `email` is unique across the whole app | `users` |
| An invoice cannot be `sent` with no client | `invoices` |

The last two are the bugs from the testing doc — a quote with no client showing `NaN`. Enforce them in the DB, not only in the UI.

---

## Related notes
- [[naming-conventions]]
- [[roles-permissions]]
- [[site-reports]]
- [[margin-profitability]]
- [[document-numbering]]
