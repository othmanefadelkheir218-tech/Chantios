# ChantierOS — Media & Files

> Status: v1 (working draft). One table for all files, connected to any entity.

## Core idea

One `media` table handles **all files** in the system — invoice documents, site photos, message attachments, report photos, anything. Files are stored on **ImageKit**. The database only holds the metadata and the URL.

---

## The `media` table

| Field | Meaning |
|---|---|
| `id` | integer |
| `tenant_id` | Which company (required) |
| `uploaded_by` | FK → `users.id` — who uploaded it |
| `file_name` | Display name — renameable by staff |
| `file_id` | ImageKit's own file id — the SDK deletes/updates a file by this id, not by URL |
| `file_url` | ImageKit URL — never changes after upload |
| `file_type` | MIME type (`image/jpeg`, `application/pdf`...) |
| `file_size` | Size in bytes |
| `entity_type` | `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message` |
| `entity_id` | The ID of the linked record |
| `is_locked` | `true` = the frozen copy of a **sent** quote or invoice. Delete refuses it, soft or hard |
| `deleted_at` | Soft delete (trash). `NULL` = not deleted |
| `created_at` | Upload date |
| `updated_at` | Last rename date |

---

## Polymorphic link

`entity_type` + `entity_id` together point to any record in any table.

Examples:

| entity_type | entity_id | What it means |
|---|---|---|
| `purchase_invoice` | INV-001 | PDF of a purchase invoice |
| `report` | RPT-007 | Site photo from a daily report |
| `project` | PRJ-003 | A document attached to a project |
| `message` | MSG-042 | An image sent in a chat message |

---

## Rules

### Upload
- Max file size: **10 MB** — rejected before upload if over
- File is pushed to ImageKit → URL saved in `file_url`
- One row created in `media`

### Rename
- Updates `file_name` only
- `file_url` never changes — the actual file on ImageKit stays the same

### Delete — soft and hard, decided 2026-10-06

Two kinds, both bulk (`{ ids: number[] }`), both **refused for a row where `is_locked = true`** — locked rows skip the batch, the rest proceed:

- **Soft delete (default, `DELETE /api/media`)** — sets `deleted_at = now()`. File stays on ImageKit untouched. The row becomes invisible everywhere except the billing sum (see below) and a dedicated "trash" listing.
- **Hard delete (`DELETE /api/media/permanent`)** — removes the file from ImageKit, then the row, immediately, no going back.
- **Restore (`PATCH /api/media/restore`)** — clears `deleted_at`. Refused for a row ImageKit no longer actually has (already hard-deleted).
- **Auto-purge job** — daily, hard-deletes (ImageKit + row) any `media` row with `deleted_at` older than **30 days**. Same job/shape as the existing `refresh_tokens`/`one_time_codes` cleanup cron.
- **A soft-deleted row still counts in `SUM(file_size)` for `storage_gb` billing** until it is actually purged — trash is not free storage, otherwise a tenant could "free space" without freeing anything.
- **Every other read (`findByEntity`, single-image lookup, replace-media, view) excludes `deleted_at IS NOT NULL` rows** — a trashed file does not show up on a report, project, invoice, etc. Only the trash listing and the billing sum look past it.
- `replace-media.handler` (avatar/logo) is unaffected: it still **hard-deletes** the old file directly, no trash — there's no undo value in an old avatar, and it keeps that handler simple.

### Cascade cleanup — decided 2026-10-06

`media` has no FK by design, so a deleted parent row could in theory leave orphan rows pointing at a dead `entity_id`. **Decision: no nightly sweep job.** Instead, cleanup happens synchronously, inside the delete path that removes the parent:

- Every `entity_type` except `project` never gets a real hard delete: `user` and `tenant` only soft-delete (`is_active` / `deleted_at`), `invoice` only soft-cancels (`status = 'cancelled'`, number kept), `message` only archives, and `quote` / `report` / `purchase_invoice` have no delete route at all. None of these can orphan `media`.
- `project` is the one exception. It gets a real `DELETE /api/projects/:id`, allowed **only while `status = 'prospect'`** — never accepted, no quote or invoice committed to it yet. That handler must call `MediaService.deleteAllForEntity('project', projectId)` in the same operation, **before** the project row itself is removed: every `media` row for that project is deleted from ImageKit, then from the database.
- This makes the deleting code responsible for its own cleanup, so an orphan is never created in the first place — there is nothing left for a sweep job to find.

`MediaService.deleteAllForEntity(entityType, entityId)` (step 03) is the one entry point any module calls for this — through the media **service**, never its repository, same as every other cross-module rule. Today it has exactly one caller: step 04's project delete.

### Allowed types (per context)

| Context | Allowed types |
|---|---|
| `purchase_invoice` document | PDF only |
| Site report photos | Images only (jpeg, png, webp) |
| Chat attachments | Images + PDF |
| Sent quote / invoice (`quote`, `invoice`) | PDF only — the frozen copy of what the client received |
| Project documents | PDF + Images |

---

## Operations summary

| Operation | What changes |
|---|---|
| Upload | New row in `media` + file pushed to ImageKit |
| Rename | `file_name` updated in `media` — nothing else |
| Soft delete | `deleted_at` set, bulk (`ids[]`). File untouched on ImageKit, hidden from every normal read, still billed |
| Restore | `deleted_at` cleared, bulk (`ids[]`) |
| Hard delete | Row removed from `media` + file deleted from ImageKit, bulk (`ids[]`), immediate, no trash |
| Auto-purge (daily job) | Hard-deletes anything trashed more than 30 days |
| Cascade delete (`deleteAllForEntity`) | Every row for one `entity_type` + `entity_id` hard-removed from ImageKit + `media`, called by the deleting module (e.g. a `prospect` project being hard-deleted) |
| View | Read `file_url` from `media` → redirect to ImageKit |

---

## Related notes
- [[chat-conversations]]
- [[subcontracting]]
- [[business-logic-overview]]
