# Phase 06 — Clients & Projects

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [entity-fields.md](../entity-fields.md), [technical/phase-03-clients-projects.md](../technical/phase-03-clients-projects.md).
> Old reference: [../test/08-clients-projects.md](../test/08-clients-projects.md).

## Goal

Client cards, projects and the status matrix — enforced on the server, whoever asks.

## Before you start

- **The real client is `gryehirir@gmail.com`.** Every quote, invoice and portal link later goes to this client, so only this inbox gets client emails.
- Other test clients use `gryehirir+<tag>@gmail.com` — a real inbox, never a fake domain (a bounced email hurts the sender domain).
- `TEST Small` allows 3 clients. This phase creates **more than 3 active clients on purpose** — nothing may block it (phase 18 bills the overage).

---

## 1. Clients

| ID | Do | Expected | Result |
|---|---|---|---|
| CLI-01 | Create `TEST Client Main`, type `individual`, `gryehirir@gmail.com`, phone `+32 470 00 00 01`, address in Brussels | `201`, `is_active true` | PASS |
| CLI-02 | `professional` with no `vat_number` | `400 vat_number is required for a professional client` | PASS |
| CLI-03 | `professional` `TEST Client Pro`, `gryehirir+pro@gmail.com`, `vat_number BE0123456789` | `201` | PASS |
| CLI-04 | Same email as CLI-01 again in A | `409 A client with this email already exists` | PASS |
| CLI-05 | Same email in **B** | `201` — allowed, emails are unique per company | PASS |
| CLI-06 | Bad phone; missing email; `country BEL`; `type` `company`; `tenant_id` in body | `400` each | PASS |
| CLI-07 | Create `TEST Client Three` and `TEST Client Four` (`gryehirir+three@`, `+four@`) | `201` both — A now has **4** active clients on a 3-client plan, **no error** | PASS |
| CLI-08 | `GET /api/clients?search=gryehirir` / by name / by phone | filtered, paginated | PASS |
| CLI-09 | `PATCH` the Pro client's phone | `200` | PASS |
| CLI-10 | `DELETE` `TEST Client Four` | `200 is_active: false`; `GET` still `200` — archived, not gone | PASS |
| CLI-11 | `POST /api/projects` for the archived client | `400 Cannot create a project for an archived client` | PASS |

## 2. Projects and the status matrix

```
prospect    → in_progress, cancelled
in_progress → completed, cancelled
completed   → in_progress   (admin only — voids the snapshot, phase 12)
cancelled   → nothing
```

| ID | Do | Expected | Result |
|---|---|---|---|
| PRJ-01 | Create `TEST Project Main` for the Main client, Brussels, `start_date 2026-11-02`, `end_date 2026-12-18` | `201`, `prospect`; history: one row `from_status null → prospect` | **FAIL** — `start_date 2026-11-02` → `500`; with a full ISO date → `201` (project 4 created that way) |
| PRJ-02 | `end_date` before `start_date` | `400` | PASS |
| PRJ-03 | `prospect → completed` | `400 Cannot move a project from prospect to completed` | PASS |
| PRJ-04 | Create `TEST Project Flow`; `prospect → in_progress` | `200`, history 2 rows, newest first | PASS |
| PRJ-05 | `in_progress → completed` with **no** invoice or payment | `200`, `actual_end_date` = today. No payment check — decided | PASS |
| PRJ-06 | Manager: `completed → in_progress` | `403 Only an admin can reopen a completed project` | PASS |
| PRJ-07 | Owner: same | `200` | PASS |
| PRJ-08 | Create `TEST Project Cancel`, cancel it with a reason, then `→ in_progress` as owner | `200`, then `400` — final for everyone | PASS |
| PRJ-09 | `PATCH /api/projects/:id { "status": "completed", "name": "x" }` | `400 property status should not exist` | PASS |
| PRJ-10 | Create `TEST Project Delete` (prospect), upload 2 files to it (`entity_type=project`), `DELETE /api/projects/:id` | `200 { deleted: true }`; project `404`; both media rows gone from the DB | PASS |
| PRJ-11 | **[CHECK IMAGEKIT]** | folder `tenant-<A>/project/<id>/` is empty | SKIP (ImageKit not yet confirmed by owner) |
| PRJ-12 | `DELETE` on an `in_progress`, a `completed` and a `cancelled` project | `400 Only a project with status prospect can be deleted`, nothing changed | PASS |
| PRJ-13 | `GET /api/projects/:id` | no `budget` and no `progress_pct` key | PASS |
| PRJ-14 | `GET /api/clients/:id/projects`, `GET /api/projects?status=&client_id=&search=` | filtered | PASS |

`TEST Project Main` stays `prospect`: phase 08 accepts a quote on it, which moves it to `in_progress`.

## 3. Roles

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-CP-01 | Sales: `POST /api/clients` → `201`; `GET /api/projects` → `200`; `POST /api/projects` → `403` | as stated | PASS |
| ROL-CP-02 | Team leader: `GET /api/clients` | `403` | PASS |

## 4. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-CP-01 | B owner: `GET` A's client and A's project by id | `404` both | PASS |
| ISO-CP-02 | B owner: `POST /api/projects` with A's `client_id` | `404` / `400` — never created | PASS |

## Result — 2026-10-08

**27 PASS, 1 FAIL (PRJ-01), 1 SKIP (PRJ-11).**

### Problem found

- **PRJ-01 — date-only `start_date` / `end_date` give `500`.** `POST /api/projects` with `"start_date": "2026-11-02"` → `500 Internal server error`; same body with `"2026-11-02T00:00:00.000Z"` → `201`. `PATCH /api/projects/1 {"start_date":"2026-11-02"}` → `500` too. `PRJ-02` (end before start, date-only) still gives `400` because the handler checks the order before the database. Likely cause: `@IsDateString()` accepts a date-only string, but the value reaches Prisma as a plain string (Prisma wants a `Date` or a full ISO date-time). Same class of bug as step 09's `IsDateOnly` fix, not applied to projects. **To do:** convert to `Date` in the handler, or use `@IsDateOnly()`. Not fixed (run rule).
- This is **not** the cause of the intermittent upload `500` in phase 05 (that one had no dates).

### Data left

Clients (A): 1 `TEST Client Main` (`gryehirir@gmail.com`), 2 `TEST Client Pro`, 4 `TEST Client Three`, 5 `TEST Client Four` (archived), 6 `TEST Sales Client`. Client 3 = `TEST B Client` (company B). Projects (A): 1 `TEST Project Flow` (**completed**), 4 `TEST Project Main` (prospect, ISO dates), 5 `TEST Project Cancel` (cancelled). Deleted: 2, 3 (stray `TEST Iso …`), 6 (`TEST Project Delete`, with its 2 files).
