# ChantierOS — Notes (like Google Keep)

## What it is

A page where a user saves their own notes. The design and the UI copy Google Keep: a "Take a note…" bar on top, notes as cards in a grid below. A note has a rich text body (text editor).

Planned in the UI (from the owner's ask "like Google Keep"): colors, pin, archive, labels, search, checklist notes, images.

## Who can use it — the `notes` permission

A new `module` key: **`notes`** (see [roles-permissions.md](roles-permissions.md)).

- **Every role has it by default, `worker` included** (the worker uses it in the Field area, on the phone).
- The level is **`own`**: a user creates, edits and deletes only their own notes.
- The tenant admin can take the access away from a role with a normal `role_permissions` override. **Per role only, not per user** (decided 2026-10-17).

| Role | Default |
|---|---|
| every role (the 7) | own |

## Notes are private (decided 2026-10-17)

- A note belongs to the user who wrote it. **Only that user sees it.**
- The tenant admin **cannot read, edit or delete** another user's notes. The admin can only remove the access, by role.
- No platform admin route reads notes. **While a platform admin impersonates a user, the notes routes answer `403`** — impersonation is for support, not for reading private notes.
- Labels belong to the user too, the same way.
- **Note images on the Files page (`/media`).** The owner sees their own note images there; the **tenant admin sees every note image**, as a file only (view and download) — never the note itself: no title, no text, no labels, no link to the note (`entity_id` is hidden, the file only says "Note"). Every `/api/notes` route stays closed to the admin. No one else sees them. While a platform admin impersonates, note images are hidden there too.
- Note images can only be added or deleted through the note (`/api/notes/:id/images`), never from the Files page.
- `audit_logs` never stores a note's title or content — only the action and the note id.

Why: people write private things in notes, even passwords. If someone else can read them, users stop trusting the feature.

## Rules (decided 2026-10-17)

- **Independent.** A note is not linked to a project, a client or anything else.
- **Images.** A note can have images. They are `media` rows, so they count in the company's plan storage like every other file ([media-files.md](media-files.md)).
- **Trash, 7 days.** Deleting a note moves it to the trash. The user can restore it for 7 days. After 7 days it is deleted for good, with its images.
- **Plans.** Every plan, no limit.

## How a note works

- **Views:** Notes (not archived, not in trash) · Archive · Trash. A label filters the Notes view.
- **Order:** pinned first, then the most recently edited. No drag-and-drop for now.
- **Body:** the editor document is saved as JSON. The server builds a plain-text copy for search — the client never sends it.
- **Checklists** are part of the editor document (task list), not a separate table.
- **Colors:** a fixed list of keys (`default`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `dark_blue`, `purple`, `pink`, `brown`, `gray`). The frontend maps each key to a color.
- **Archive:** an archived note is not pinned. Pinning an archived note brings it back to Notes.
- **Trash:** a trashed note is read-only; restore it to edit it. The user can also delete it for good at once, or empty the whole trash. A daily job deletes for good every note trashed more than 7 days ago, with its images.
- **Images:** JPEG, PNG or WebP, 10 MB max each (the media rule). Added to a note that already exists.

## Related notes
- [[roles-permissions]]
- [[media-files]]
