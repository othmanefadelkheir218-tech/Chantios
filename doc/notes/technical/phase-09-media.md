# Phase 09 — Media & Files

> Can be built early — it is a shared utility used by many phases.

## Tables

- `media` — one row per file, polymorphic

## Key relations

```
media.entity_type + media.entity_id → any table (projects, users, purchase_invoices, messages, …)
```

No FK constraints — the link is by convention, not DB foreign key.

## Key rules

### Polymorphic pattern
Every row says which record it belongs to:
- `entity_type` is a fixed enum: `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message`
- `entity_id`: the ID of that record

Query all files for a project:
```sql
SELECT * FROM media WHERE entity_type = 'project' AND entity_id = :id
```

### File size limit
- Max 10 MB per file — hard block at upload
- `file_size` is `BigInt` (bytes). `SUM(file_size)` per tenant is what the `storage_gb` billing dimension reads

### Allowed types per context

| Context | Allowed |
|---|---|
| Project documents | PDF, JPG, PNG |
| Profile images (`user`) | JPG, PNG |
| Tenant logo (`tenant`) | JPG, PNG, SVG |
| Site report photos (`report`) | JPG, PNG, WEBP |
| Purchase invoice document | PDF only |
| Generated quote / invoice PDF | PDF only |
| Messages / chat | PDF, JPG, PNG |

### Operations
- **Upload** → saves to ImageKit → stores URL + metadata in `media`
- **Rename** → updates `file_name` in DB only — ImageKit key is unchanged
- **Delete** → removes from ImageKit first → then deletes DB row
- **Replace** (profile image) → delete old + upload new in one operation

### `media` fields

| Field | Notes |
|---|---|
| `id` | |
| `tenant_id` | For isolation |
| `entity_type` | String: `'user'`, `'project'`, etc. |
| `entity_id` | UUID of the linked record |
| `file_name` | Display name (can be renamed) |
| `file_url` | ImageKit URL |
| `file_type` | MIME type |
| `file_size` | Bytes |
| `uploaded_by` | `user_id` who uploaded |
| `created_at` | |

## What to build

- Upload endpoint (with size + type validation)
- Rename endpoint (DB only)
- Delete endpoint (ImageKit + DB)
- Generic media query (get all files for entity_type + entity_id)
- Storage usage per tenant: `SUM(file_size)` — this is the number the `storage_gb` billing dimension reads
- Used by: profile images + tenant logo (Phase 02), purchase invoice documents (Phase 06), chat attachments (Phase 11), site report photos (Phase 14), generated PDFs (Phase 15)

## Dependencies

- Phase 01 (tenant_id)
- ImageKit SDK

## See also
- [[media-files]]
