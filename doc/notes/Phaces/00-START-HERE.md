# ChantierOS — Build Guide (START HERE)

> **This folder is the HOW. It is not the WHY.**
>
> Read this file first, every session, before writing any code.

**The files in this folder are numbered in BUILD ORDER, not by phase number.** Work through them 01 → 16, top to bottom. The original phase number is shown next to each one because the notes and the schema still use it.

---

## 1. The four layers of documentation — never mix them

| Where | Answers | Rule |
|---|---|---|
| `doc/notes/*.md` | **WHY** — business rules and the decisions behind them | Newest truth. If anything disagrees with a note, the note wins |
| `doc/Schema Proposal.md` | **WHAT** — the exact DDL, every table and column | Generated from the notes. Single source for the database |
| `doc/notes/Phaces/*.md` | **HOW** — step-by-step build order | This folder. Tasks, routes, files, acceptance checks |
| `.instruction/*.txt` | **STYLE** — the code architecture | Non-negotiable. Read before writing any file |

**A file in this folder must never restate a business rule.** It links to the note instead. One rule lives in one place — mixing them is what made these docs give a different answer every time they were read.

`doc/notes/technical/*.md` is the older, lighter version: tables and rules per phase. It stays as reference. When the two disagree about **how to build**, this folder wins. When they disagree about a **rule**, neither wins — `doc/notes/*.md` does.

---

## 2. Session start — do this every time

1. Read `doc/notes/WhereIStop/state.md` — where the last session stopped
2. Read this file
3. Read `.instruction/code_structure.txt` — the module architecture
4. Read `.instruction/main_file.txt` — only if touching `src/main.ts`
5. Read the step file you are on
6. Read the notes that step links to

Do not skip step 3. Every module has the same shape; one that does not follow it gets rewritten.

---

## 3. The architecture, in one picture

From `.instruction/code_structure.txt`. This is the only allowed flow:

```
HTTP Request
     ↓
Controller      HTTP only. Guards, decorators, params. No business logic
     ↓
Service         Orchestration only. Picks the handler. Never a "god service"
     ↓
Handler         THE BUSINESS LOGIC. One handler per operation
     ↓
Repository      ALL Prisma queries. The only place Prisma is allowed
     ↓
Database
```

```
src/
└── module-name/
    ├── decorators/            module-name.swagger.ts
    ├── dto/                   create-x.dto.ts, update-x.dto.ts, find-x-query.dto.ts
    ├── entities/              x.entity.ts        (response shape)
    ├── handlers/              create-x.handler.ts, find-x.handler.ts, ...
    ├── helpers/               x.helper.ts
    ├── repositories/          x.repository.ts    ← ONE file, not one per operation
    ├── module-name.service.ts
    ├── module-name.controller.ts
    └── module-name.module.ts
```

Create a directory only when the module needs it. `src/tenants/` is the working example — copy its shape. `src/plans/` shows a transaction and `src/audit/` shows a module other modules call.

### The hard rules

- Prisma appears **only** in a repository. Never in a handler, service or controller.
- One module = one repository file. Not one per operation.
- A module never touches another module's repository. Go through that module's **service**.
- A business rule is implemented **once**. Search before writing.
- Handlers log: operation started, important result, failure with context.

---

## 4. Build order — this is the order of the files in this folder

From [technical/build-order.md](../technical/build-order.md). Phase numbers are labels, not the order.

```
01 platform → 02 auth → 09 media → 03 clients+projects
  → 04 catalogue+stock → 05 quotes+invoices → 06 purchases
  → 07 planning+time → 14 site reports → 08 margin
  → 11 chat → 10 client portal → 12 alerts → 13 stripe
  → 15 documents (PDF) → 16 support+feedback
```

| Step | File | Phase | Blocked by a decision? |
|---|---|---|---|
| 01 | [01-platform.md](01-platform.md) | 01 | no |
| 02 | [02-auth-users.md](02-auth-users.md) | 02 | no |
| 03 | [03-media.md](03-media.md) | 09 | 1 — `media` cascade cleanup |
| 04 | [04-clients-projects.md](04-clients-projects.md) | 03 | 1 — project closing guard |
| 05 | [05-catalogue-stock.md](05-catalogue-stock.md) | 04 | no |
| 06 | [06-quotes-invoices.md](06-quotes-invoices.md) | 05 | 2 — quote transitions, overpayment |
| 07 | [07-purchases.md](07-purchases.md) | 06 | no |
| 08 | [08-planning-time.md](08-planning-time.md) | 07 | 1 — worker hour scope |
| 09 | [09-site-reports.md](09-site-reports.md) | 14 | no |
| 10 | [10-margin.md](10-margin.md) | 08 | 1 — cancelled project snapshot |
| 11 | [11-chat.md](11-chat.md) | 11 | 1 — platform admin cross-tenant read |
| 12 | [12-client-portal.md](12-client-portal.md) | 10 | no |
| 13 | [13-alerts.md](13-alerts.md) | 12 | no |
| 14 | [14-subscriptions.md](14-subscriptions.md) | 13 | no |
| 15 | [15-documents.md](15-documents.md) | 15 | no |
| 16 | [16-support-feedback.md](16-support-feedback.md) | 16 | no |
| — | [17-ai-layer.md](17-ai-layer.md) | 17 | **v2 — do not build** |

### Why three steps move

| Phase | Built at step | Why |
|---|---|---|
| 09 Media | 03, right after auth | profile images, report photos and bill PDFs all need it |
| 14 Site reports | 09, before margin and portal | stock consumption and the portal progress % both come from it |
| 11 Chat | 11, before the portal | generating a portal token auto-creates a `project_client` conversation |

**"Blocked by a decision"** means an item from the open-questions list lands in that step. The step file names it under *Decide first*. **Do not invent an answer** — ask, decide, write it into the note, then build.

---

## 5. How every step file is structured

1. **Goal** — one sentence
2. **Decide first** — open questions blocking this step, or "none"
3. **Tables** — with a link to the DDL
4. **Modules to create** — the folder tree
5. **Routes** — method, path, guard, role, module key
6. **DTOs** — fields and validation
7. **Repository methods** — signatures
8. **Handlers** — one per operation, and the rule each enforces
9. **Tasks** — the checkbox list you work through
10. **Acceptance** — how you know the step is done
11. **Notes to read** — the WHY

---

## 6. API conventions — all steps

| Concern | Rule |
|---|---|
| Global prefix | `/api` |
| Platform admin | `/api/admin/...` |
| Tenant app | `/api/...` — tenant comes from the JWT, **never the URL** |
| Mobile | `/api/mobile/...` |
| Client portal | `/api/portal/:token/...` — no JWT |
| Webhooks | `/api/webhooks/...` — `@Public()`, raw body |
| IDs in paths | `:id` as uuid, validated with `ParseUUIDPipe` |
| List response | `{ data, total, page, limit }` — reuse `toPaginated()` from `src/common/helpers/pagination.helper.ts` |
| List query | `?page=1&limit=20&search=` via `find-x-query.dto.ts`, which extends `PaginationQueryDto` (`src/common/dto/`) |
| JSON keys | **snake_case** in and out. DTO fields are snake_case; each controller carries `@UseInterceptors(SnakeCaseInterceptor)`; a handler turns DTO keys into Prisma keys with `toCamelKeys()` |
| Audit | A handler that knows the old value writes `audit_logs` itself through `AuditService.write()`. Elsewhere, mark the route `@AuditLog(action, entityType)` |
| Who acts | `@Actor()` gives `{ adminUserId, ip }` for `audit_logs`. It is filled by `AdminAuthGuard` at step 02 |
| Dates | ISO 8601. `_date` columns are date-only strings |
| Money | string in and out, never a JS `number`. `Prisma.Decimal` server-side |
| Errors | Nest's standard `{ statusCode, message, error }`. Do not invent a wrapper |
| Delete | sets `is_active = false` where the column exists. Never a hard delete of business data |
| Swagger | `@ApiTags` per controller, `@ApiProperty` per DTO, docs in `decorators/x.swagger.ts` |

**`tenant_id` is never a route param, a query param or a body field.** It comes from the JWT through `nestjs-cls`. A request that can name its own tenant is a cross-tenant leak.

---

## 7. Definition of done — every step

- [ ] Migration applied, `yarn prisma migrate dev` clean
- [ ] Module matches `.instruction/code_structure.txt` exactly
- [ ] No Prisma call outside a repository
- [ ] Every route in the step's route table exists and is reachable
- [ ] Every route has its guard and role decorator
- [ ] Swagger shows the whole module at `/api/docs`
- [ ] `yarn lint` and `yarn build` pass
- [ ] Handlers log start, result and failure
- [ ] The step's Acceptance section passes by hand
- [ ] `doc/notes/WhereIStop/state.md` updated
- [ ] Any decision made during the step written into its note in `doc/notes/`

---

## 8. End of every session

Update `doc/notes/WhereIStop/state.md`. Keep it short and true. If a task is unfinished, say exactly where you stopped and what broke. That file is how the next conversation continues without re-reading everything.
