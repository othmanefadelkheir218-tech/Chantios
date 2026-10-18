# Step 23 — Contacts (employee directory)

> Needs step 02 (users), step 03 (media: avatars), step 04 (projects), step 08 (task assignees).
> Backend **and** frontend. **Built 2026-10-17.** Rule: [contacts.md](../contacts.md).

## 1. Goal

A user with `contacts` opens `/contacts`, sees every employee of the company as a card (20 per page, search), and clicks a card to see the details and the open projects. The hourly rate is never sent.

## 2. Decide first

**Decided 2026-10-17 (owner).** Nothing left open.

| # | Question | Answer |
|---|---|---|
| Q1 | Employees only, or clients and suppliers too? | ✅ Employees only |
| Q2 | Inactive users? | ✅ Shown, with an "Inactive" badge |
| Q3 | Hourly rate? | ✅ Never sent, to anyone |
| Q4 | Who gets it by default? Plan limit? | ✅ `admin` + `manager` (view), every plan |
| Q5 | Projects for a user without `projects` view? | ✅ Shown, name + status only (option A) |
| Q6 | Which projects? | ✅ Open only (`prospect`, `in_progress`) |
| Q7 | Page size, views | ✅ 20, cards only |

## 3. Tables

No table. One migration: `ALTER TYPE permission_module ADD VALUE 'contacts'`.

## 4. Where the code lives

**Backend**

```
src/auth/helpers/permission.helper.ts                + contacts in the default matrix
src/users/repositories/user.repository.ts            + findDirectory, findDirectoryEntry (safe select, no hourly_rate)
src/users/users.service.ts                           + the two passthroughs
src/projects/repositories/project.repository.ts      + findOpenForUser (manager or task assignee)
src/projects/projects.service.ts                     + findOpenForUser
src/contacts/contacts.controller.ts                  GET /contacts, GET /contacts/:id
src/contacts/contacts.service.ts
src/contacts/handlers/list-contacts.handler.ts       cards + avatars
src/contacts/handlers/find-contact.handler.ts        one employee + avatar + open projects
src/contacts/helpers/contact.helper.ts               toContactEntity (allow-list)
src/contacts/dto/find-contacts-query.dto.ts          page, limit, search
src/contacts/decorators/contacts.swagger.ts
```

`src/contacts/` has **no repository**: users, photos and projects come from their own services.

**Frontend** (`ChanitOs_client/my-app`)

```
types/contact.ts
lib/api/endpoints/contacts.api.ts
hooks/use-contacts.ts
app/[locale]/(tenant)/contacts/page.tsx + ContactsClient.tsx + [id]/ + _components/
```

## 5. Routes

| Method | Path | Guard | Module |
|---|---|---|---|
| GET | `/api/contacts?page=&limit=&search=` | `@TenantAuth()` | `contacts` (view) |
| GET | `/api/contacts/:id` | `@TenantAuth()` | `contacts` (view) |

## 6. Tasks

- [x] Note + permission matrix + schema enum
- [x] Migration `20261017130000_permission_module_contacts` + default matrix
- [x] Users + projects methods
- [x] `contacts` module + tests (`contacts.handlers.spec.ts`)
- [x] Frontend page + details + menu entry + texts + role label

## 7. Acceptance

- `admin` and `manager` get `200`; `worker` gets `403`.
- No answer ever has `hourly_rate`.
- Inactive users are in the list with `is_active: false`.
- `GET /api/contacts/:id` of another company's user → `404`.
- Projects: only `prospect` / `in_progress`, where the user is manager or task assignee.
