# Step 24 — Notes (like Google Keep)

> Needs step 02 (users, permissions), step 03 (media: images).
> Backend first, then frontend. **Backend + frontend built 2026-10-17.** Rule: [notes.md](../notes.md).

## 1. Goal

Every user with `notes` saves private notes (rich text, color, pin, archive, labels, images, 7-day trash). Nobody else reads them — not the tenant admin, not a platform admin.

## 2. Decide first

**Decided 2026-10-17 (owner).** Nothing left open.

| # | Question | Answer |
|---|---|---|
| Q1 | Who gets it? | ✅ Every role `own`, worker too (Field area). Admin removes it per role only |
| Q2 | Private? | ✅ Yes — only the owner, the admin cannot read |
| Q3 | Link to a project / client? | ✅ No — a note is independent |
| Q4 | Images? | ✅ Yes, `media` rows, count in plan storage |
| Q5 | Delete? | ✅ Trash, 7 days |
| Q6 | Plans? | ✅ Every plan, no limit |

## 3. Tables

DDL: [Schema Proposal.md](../../Schema%20Proposal.md) § 9 "Notes". `notes`, `note_labels`, `note_label_links` + enum values `permission_module.notes`, `media_entity_type.note`.

## 4. Where the code lives

**Backend**

```
src/auth/helpers/permission.helper.ts         + notes: 'own' for the 7 roles
src/media/helpers/media.helper.ts             + note MIME types, PRIVATE_MEDIA_ENTITY_TYPES
src/media/repositories/media.repository.ts    generic reads skip private entity types
src/media/dto/*.dto.ts                        entity_type cannot be 'note' on /api/media
src/media/media.service.ts                    + deleteForEntity (one image of an entity)
src/notes/notes.controller.ts                 /api/notes...
src/notes/note-labels.controller.ts           /api/note-labels...
src/notes/notes.service.ts
src/notes/guards/no-impersonation.guard.ts    403 while a platform admin impersonates
src/notes/handlers/*.handler.ts               one per operation
src/notes/helpers/note.helper.ts              toNoteEntity, extractText, filters
src/notes/repositories/note.repository.ts     notes + labels + links (one file)
src/notes/dto/*.dto.ts
src/notes/decorators/notes.swagger.ts
src/crons/notes-trash.cron.ts                 daily purge of the 7-day trash
```

## 5. Routes

All `@TenantAuth()` + `@Module('notes')` + no impersonation. Every query is filtered by the caller's `user_id`, whatever the scope.

| Method | Path | Does |
|---|---|---|
| GET | `/api/notes?view=notes\|archive\|trash&label_id=&search=&page=&limit=` | list, pinned first then `updated_at` desc |
| POST | `/api/notes` | create |
| GET | `/api/notes/:id` | one note + labels + images |
| PATCH | `/api/notes/:id` | title, content, color, is_pinned, is_archived, label_ids |
| DELETE | `/api/notes/:id` | move to trash |
| PATCH | `/api/notes/:id/restore` | out of the trash |
| DELETE | `/api/notes/:id/permanent` | delete for good now (only from the trash) |
| DELETE | `/api/notes/trash` | empty the trash |
| POST | `/api/notes/:id/images` | multipart `file` |
| DELETE | `/api/notes/:id/images/:mediaId` | remove one image |
| GET | `/api/note-labels` | the caller's labels |
| POST | `/api/note-labels` | create (`409` on a used name) |
| PATCH | `/api/note-labels/:id` | rename |
| DELETE | `/api/note-labels/:id` | delete (links go, notes stay) |

## 6. Tasks

- [x] Note + schema + build file
- [x] Migration `20261017140000_notes` + Prisma schema + default matrix
- [x] Media: `note` type, hidden from the generic routes, `deleteForEntity`
- [x] `notes` module (notes + labels + images) + tests
- [x] Trash purge cron + test (also in the dev tools: job `notes-trash`)
- [x] Live check on port 5300
- [x] Frontend: `/notes` (tenant app) + `/field/notes` (worker), board in `ChanitOs_client/my-app/components/shared/notes/`, Tiptap editor

## 7. Acceptance

- Every role gets `200` on `GET /api/notes`; a role with the override `can_view = false` gets `403`.
- User A never sees, edits or deletes user B's note (`404`), the tenant admin included.
- Impersonation token → `403`.
- `GET /api/media` never returns a `note` file; `POST /api/media` with `entity_type = note` → `400`.
- Trash: a trashed note is not in Notes/Archive, is read-only (`PATCH` → `400`), restores, and the cron deletes it (and its images) after 7 days.
- `content_text` is built by the server; search finds a word inside the body.
