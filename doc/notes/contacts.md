# ChantierOS — Contacts (employee directory)

## What it is

A read-only page that lists **every employee of the company** as cards. A click on a card opens the employee's details. People use it to find a colleague's email or phone, see their role and their projects.

It is **not** the Team page. Team (`/team`, permission `team`) is the admin page: invite, edit, role, PIN, hourly rate. Contacts only reads, and **never shows the hourly rate** — to anyone.

It is **not** the chat contact list either (`GET /api/conversations/contacts`, [chat-conversations.md](chat-conversations.md) § Contacts): that one gives only name, role and photo of active users, for every chat user.

**Employees only.** No clients, no suppliers. Clients have their own page and their own permission (`clients`); mixing them here would show client data to people without that right.

## Who can open it — the `contacts` permission

A new `module` key: **`contacts`** (see [roles-permissions.md](roles-permissions.md)).

- Only **view** means something: the page is read-only, there is nothing to create, edit or delete.
- The tenant admin can give it to another role with a normal `role_permissions` override.

| Role | Default |
|---|---|
| `admin` | view |
| `manager` | view |
| every other role | — |

- **Every plan** has it. No plan limit.

## Who is in the list

- Every user of the caller's company, the caller included.
- **Inactive users are shown**, with an "Inactive" badge.
- Sort: active first, then by name (A → Z).

## The card

| Field | Rule |
|---|---|
| Photo | The user's avatar (`media`, entity `user`, the newest one). No photo → initials in a coloured circle |
| Name | `users.name` |
| Role | The role name |
| Email | `users.email` — can be empty (a `worker` added without email) |
| Phone | `users.phone` — can be empty |
| Inactive badge | When `users.is_active = false` |

## The details

Everything on the card, plus **assigned projects**: the projects where the employee is **project manager** (`projects.manager_id`) **or** is an assignee on at least one task (`task_assignees`). Only **open** projects (`prospect`, `in_progress`). Each project once, with its name and status.

**Everyone with `contacts` sees this list**, even without the `projects` view right. It shows only name and status — no link to open the project, no money. With the `projects` view right, the name is a link to the project.

## Never sent

`hourly_rate`, `password_hash`, `mobile_pin_hash`, `login_code`, `failed_pin_count`, `must_change_password`. The API leaves them out — hiding them only in the UI is not enough. This is why Contacts has its own routes and does not reuse the Team routes.

## Routes

| Route | What |
|---|---|
| `GET /api/contacts?page=&limit=&search=` | The cards. `limit` default **20**. `search` matches name, email, phone and role (name or label). Normal paged answer |
| `GET /api/contacts/:id` | One employee + assigned projects. Another company's user → 404 |

- Behind the normal tenant guards + `@Module('contacts')`.
- New module `src/contacts/` with **no repository and no table**. Users come from `UsersService`, photos from `MediaService`, projects from `ProjectsService`. Nothing is written again.

## The page

- Cards only (no table view), 20 per page.
- A search bar at the top, pagination on the top right (`1-20 / 57` with `<` `>`).
- Click a card → the details.
- Texts in `fr.json` only.

## Related notes

- [roles-permissions.md](roles-permissions.md)
- [chat-conversations.md](chat-conversations.md)
- [media-files.md](media-files.md)
- [planning-time-entries.md](planning-time-entries.md)
