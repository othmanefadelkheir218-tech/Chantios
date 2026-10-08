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
| CLI-01 | Create `TEST Client Main`, type `individual`, `gryehirir@gmail.com`, phone `+32 470 00 00 01`, address in Brussels | `201`, `is_active true` | todo |
| CLI-02 | `professional` with no `vat_number` | `400 vat_number is required for a professional client` | todo |
| CLI-03 | `professional` `TEST Client Pro`, `gryehirir+pro@gmail.com`, `vat_number BE0123456789` | `201` | todo |
| CLI-04 | Same email as CLI-01 again in A | `409 A client with this email already exists` | todo |
| CLI-05 | Same email in **B** | `201` — allowed, emails are unique per company | todo |
| CLI-06 | Bad phone; missing email; `country BEL`; `type` `company`; `tenant_id` in body | `400` each | todo |
| CLI-07 | Create `TEST Client Three` and `TEST Client Four` (`gryehirir+three@`, `+four@`) | `201` both — A now has **4** active clients on a 3-client plan, **no error** | todo |
| CLI-08 | `GET /api/clients?search=gryehirir` / by name / by phone | filtered, paginated | todo |
| CLI-09 | `PATCH` the Pro client's phone | `200` | todo |
| CLI-10 | `DELETE` `TEST Client Four` | `200 is_active: false`; `GET` still `200` — archived, not gone | todo |
| CLI-11 | `POST /api/projects` for the archived client | `400 Cannot create a project for an archived client` | todo |

## 2. Projects and the status matrix

```
prospect    → in_progress, cancelled
in_progress → completed, cancelled
completed   → in_progress   (admin only — voids the snapshot, phase 12)
cancelled   → nothing
```

| ID | Do | Expected | Result |
|---|---|---|---|
| PRJ-01 | Create `TEST Project Main` for the Main client, Brussels, `start_date 2026-11-02`, `end_date 2026-12-18` | `201`, `prospect`; history: one row `from_status null → prospect` | todo |
| PRJ-02 | `end_date` before `start_date` | `400` | todo |
| PRJ-03 | `prospect → completed` | `400 Cannot move a project from prospect to completed` | todo |
| PRJ-04 | Create `TEST Project Flow`; `prospect → in_progress` | `200`, history 2 rows, newest first | todo |
| PRJ-05 | `in_progress → completed` with **no** invoice or payment | `200`, `actual_end_date` = today. No payment check — decided | todo |
| PRJ-06 | Manager: `completed → in_progress` | `403 Only an admin can reopen a completed project` | todo |
| PRJ-07 | Owner: same | `200` | todo |
| PRJ-08 | Create `TEST Project Cancel`, cancel it with a reason, then `→ in_progress` as owner | `200`, then `400` — final for everyone | todo |
| PRJ-09 | `PATCH /api/projects/:id { "status": "completed", "name": "x" }` | `400 property status should not exist` | todo |
| PRJ-10 | Create `TEST Project Delete` (prospect), upload 2 files to it (`entity_type=project`), `DELETE /api/projects/:id` | `200 { deleted: true }`; project `404`; both media rows gone from the DB | todo |
| PRJ-11 | **[CHECK IMAGEKIT]** | folder `tenant-<A>/project/<id>/` is empty | todo |
| PRJ-12 | `DELETE` on an `in_progress`, a `completed` and a `cancelled` project | `400 Only a project with status prospect can be deleted`, nothing changed | todo |
| PRJ-13 | `GET /api/projects/:id` | no `budget` and no `progress_pct` key | todo |
| PRJ-14 | `GET /api/clients/:id/projects`, `GET /api/projects?status=&client_id=&search=` | filtered | todo |

`TEST Project Main` stays `prospect`: phase 08 accepts a quote on it, which moves it to `in_progress`.

## 3. Roles

| ID | Do | Expected | Result |
|---|---|---|---|
| ROL-CP-01 | Sales: `POST /api/clients` → `201`; `GET /api/projects` → `200`; `POST /api/projects` → `403` | as stated | todo |
| ROL-CP-02 | Team leader: `GET /api/clients` | `403` | todo |

## 4. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-CP-01 | B owner: `GET` A's client and A's project by id | `404` both | todo |
| ISO-CP-02 | B owner: `POST /api/projects` with A's `client_id` | `404` / `400` — never created | todo |
