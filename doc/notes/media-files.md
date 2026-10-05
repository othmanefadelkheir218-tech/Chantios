# ChantierOS — Media & Files

> Status: v1 (working draft). One table for all files, connected to any entity.

## Core idea

One `media` table handles **all files** in the system — invoice documents, site photos, message attachments, report photos, anything. Files are stored on **ImageKit**. The database only holds the metadata and the URL.

---

## The `media` table

| Field | Meaning |
|---|---|
| `id` | UUID |
| `tenant_id` | Which company (required) |
| `uploaded_by` | FK → `users.id` — who uploaded it |
| `file_name` | Display name — renameable by staff |
| `file_url` | ImageKit URL — never changes after upload |
| `file_type` | MIME type (`image/jpeg`, `application/pdf`...) |
| `file_size` | Size in bytes |
| `entity_type` | `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message` |
| `entity_id` | The ID of the linked record |
| `is_locked` | `true` = the frozen copy of a **sent** quote or invoice. Delete refuses it |
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

### Delete
- **Refused when `is_locked = true`** — that row is the PDF the client actually received. Without this guard the legal copy of a sent invoice could be deleted like any photo
- Otherwise: file is removed from ImageKit, then the row is deleted from `media`
- Any screen referencing the file should handle a missing file gracefully

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
| Delete | Row removed from `media` + file deleted from ImageKit |
| View | Read `file_url` from `media` → redirect to ImageKit |

---

## Related notes
- [[chat-conversations]]
- [[subcontracting]]
- [[business-logic-overview]]
