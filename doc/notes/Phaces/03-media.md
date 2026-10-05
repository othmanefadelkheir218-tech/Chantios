# Step 03 — Media & Files  *(phase 09)*

> Built here, out of numeric order, because profile images, report photos and bill PDFs all need it.

## Goal

One polymorphic `media` table and one upload flow for every file in the app. Files live on ImageKit; the database holds metadata and the URL.

## Decide first

**1 open question — `media` cascade cleanup.** `media` has no foreign key by design, so deleting a project leaves orphan rows pointing at a dead `entity_id`. Decide: a nightly sweep job, or leave orphans and ignore them. Write the answer into [media-files.md](../media-files.md) and tick it off in [A_progress-tracker.md](../A_progress-tracker.md).

Not urgent for this step to work — nothing is deleted yet. Decide before step 04 creates deletable projects.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 9.

| Table | Purpose |
|---|---|
| `media` | one row per file, polymorphic, no FK |

`entity_type` is a fixed enum: `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message`. `entity_id` is the target row's uuid, with **no** database foreign key — the link is by convention.

`is_locked` is the important column: `true` means the frozen PDF copy of a **sent** quote or invoice. The delete endpoint refuses those rows, so the client's legal copy cannot be deleted like an ordinary photo.

## Modules to create

```
src/media/
├── decorators/media.swagger.ts
├── dto/upload-media.dto.ts, rename-media.dto.ts, find-media-query.dto.ts
├── entities/media.entity.ts
├── handlers/upload-media.handler.ts, find-media.handler.ts,
│            rename-media.handler.ts, delete-media.handler.ts,
│            replace-media.handler.ts, storage-usage.handler.ts
├── helpers/media.helper.ts          (type + size validation per context)
├── repositories/media.repository.ts
├── media.service.ts / media.controller.ts / media.module.ts
```

`src/config/imagekit.config.ts` already exists. The module calls it; it does not re-implement the SDK.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/media` | `AuthGuard` + `media:create` | multipart. Body: `entity_type`, `entity_id` |
| `GET` | `/api/media` | `AuthGuard` + `media:view` | `?entity_type=&entity_id=` |
| `GET` | `/api/media/:id` | `AuthGuard` + `media:view` | metadata, not the bytes |
| `PATCH` | `/api/media/:id` | `AuthGuard` + `media:edit` | rename — `file_name` only |
| `DELETE` | `/api/media/:id` | `AuthGuard` + `media:delete` | refused when `is_locked` |
| `GET` | `/api/media/storage/usage` | `AuthGuard` + `settings:view` | `SUM(file_size)` for this tenant |

`media:view` with `scope = 'own'` (the `worker` default) limits the list to rows where `uploaded_by` is the current user.

## DTOs

### `upload-media.dto.ts`
`entity_type` `@IsEnum`, `entity_id` `@IsUUID`. The file comes through `FileInterceptor`, not the DTO.

### `rename-media.dto.ts`
`file_name` `@IsNotEmpty @MaxLength(255)`. Nothing else is editable.

### `find-media-query.dto.ts`
`entity_type` optional, `entity_id` optional uuid, plus `page` / `limit`.

## Repository methods

```ts
create(data): Promise<Media>
findById(id): Promise<Media | null>
findByEntity(entityType, entityId): Promise<Media[]>
findMany(where, skip, take): Promise<[Media[], number]>
rename(id, fileName): Promise<Media>
delete(id): Promise<void>
sumFileSize(): Promise<bigint>              // the storage_gb billing dimension
findByEntityAndType(entityType, entityId): Promise<Media | null>   // single-image entities
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `upload-media.handler` | size ≤ 10 MB and MIME allowed **for that `entity_type`** (table below). Pushes to ImageKit **first**, writes the row only if the upload succeeded |
| `rename-media.handler` | updates `file_name` only. `file_url` never changes — the ImageKit object is untouched |
| `delete-media.handler` | **refuses when `is_locked = true`.** Otherwise removes from ImageKit first, then the row |
| `replace-media.handler` | single-image entities (`user` avatar, `tenant` logo): delete the old, upload the new, one operation |
| `storage-usage.handler` | `SUM(file_size)` — the number step 14 bills on |

### Allowed types per context

| `entity_type` | Allowed |
|---|---|
| `user` | JPG, PNG |
| `tenant` | JPG, PNG, SVG |
| `project` | PDF, JPG, PNG |
| `report` | JPG, PNG, WEBP |
| `purchase_invoice` | **PDF only** |
| `quote`, `invoice` | **PDF only** — written with `is_locked = true` |
| `message` | PDF, JPG, PNG |

Put this table in `media.helper.ts` as one constant. Every caller reads it; no module re-declares its own list.

## Tasks

- [ ] `media` module, full shape
- [ ] `media.helper.ts` — the context/type/size table as one constant
- [ ] Upload: validate → ImageKit → row. Never a row without a successful upload
- [ ] Rename — database only
- [ ] Delete — `is_locked` check, then ImageKit, then the row
- [ ] Replace, for `user` and `tenant`
- [ ] `storage/usage` endpoint
- [ ] Wire step 02's `POST /api/users/me/avatar` to `replace-media`
- [ ] Wire `tenants` logo → `logo_media_id`
- [ ] Decide the cascade question and write it into the note

## Acceptance

- [ ] Upload a 2 MB JPG to `entity_type = 'report'` → row created, URL reachable
- [ ] Upload an 11 MB file → rejected before ImageKit is called
- [ ] Upload a PDF to `entity_type = 'report'` → rejected (images only)
- [ ] Upload a JPG to `entity_type = 'purchase_invoice'` → rejected (PDF only)
- [ ] Rename → `file_name` changes, `file_url` identical
- [ ] Delete a normal row → gone from ImageKit **and** the database
- [ ] Insert a row with `is_locked = true` and delete it → refused
- [ ] Replace a user avatar twice → only one `user` row remains for that user
- [ ] `storage/usage` matches the sum of uploaded sizes
- [ ] Tenant A cannot list or delete tenant B's media
- [ ] A `worker` sees only their own uploads
- [ ] Update `../WhereIStop/state.md`

## Notes to read

- [media-files.md](../media-files.md) — the table, the rules, `is_locked`
- [technical/phase-09-media.md](../technical/phase-09-media.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 9
