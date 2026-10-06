# Step 03 — Media & Files  *(phase 09)*

> Built here, out of numeric order, because profile images, report photos and bill PDFs all need it.

## Goal

One polymorphic `media` table and one upload flow for every file in the app. Files live on ImageKit; the database holds metadata and the URL.

## Decide first

**Decided 2026-10-06 — `media` cascade cleanup.** No nightly sweep job. Every entity type except `project` never gets a real hard delete (soft-delete, soft-cancel, archive-only, or no delete route at all), so none of them can orphan `media`. `project` is the one exception: step 04 gives it a real `DELETE /api/projects/:id`, allowed only while `status = 'prospect'`, and that handler must call `MediaService.deleteAllForEntity('project', projectId)` **before** removing the row. Full writeup in [media-files.md](../media-files.md); ticked off in [A_progress-tracker.md](../A_progress-tracker.md).

This step must build `deleteAllForEntity` (service + repository) so step 04 has it to call.

**Decided 2026-10-06 — soft delete + hard delete, bulk.** `media` gets a new `deleted_at` column. Default delete is soft (trash, 30 days, still billed), a separate route hard-deletes immediately, both take `{ ids: number[] }`. Full design in [media-files.md](../media-files.md) § "Delete — soft and hard".

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 9.

| Table | Purpose |
|---|---|
| `media` | one row per file, polymorphic, no FK |

`entity_type` is a fixed enum: `user` · `tenant` · `project` · `report` · `purchase_invoice` · `quote` · `invoice` · `message`. `entity_id` is the target row's integer, with **no** database foreign key — the link is by convention.

`is_locked` is the important column: `true` means the frozen PDF copy of a **sent** quote or invoice. The delete endpoint refuses those rows, soft or hard, so the client's legal copy cannot be deleted like an ordinary photo.

`deleted_at` is the trash marker: `NULL` = live, a timestamp = soft-deleted. Every normal read excludes it; only the trash listing and the storage-usage sum look past it.

`file_id` (new, found while implementing): the ImageKit SDK deletes/updates a file by its own `fileId`, not by URL — `file_url` alone cannot be used to remove a file later. Store `fileId` from the upload response.

## Modules to create

```
src/media/
├── decorators/media.swagger.ts
├── dto/upload-media.dto.ts, rename-media.dto.ts, find-media-query.dto.ts,
│       bulk-media-ids.dto.ts
├── entities/media.entity.ts
├── handlers/upload-media.handler.ts, find-media.handler.ts,
│            rename-media.handler.ts, soft-delete-media.handler.ts,
│            hard-delete-media.handler.ts, restore-media.handler.ts,
│            replace-media.handler.ts, storage-usage.handler.ts,
│            delete-media-by-entity.handler.ts
├── helpers/media.helper.ts          (type + size validation per context)
├── jobs/purge-expired-media.job.ts  (daily, 30-day trash retention)
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
| `DELETE` | `/api/media` | `AuthGuard` + `media:delete` | **soft delete**, bulk. Body `{ ids: number[] }`. Locked ids skipped, not refused |
| `DELETE` | `/api/media/permanent` | `AuthGuard` + `media:delete` | **hard delete**, bulk. Body `{ ids: number[] }`. Same locked-id guard |
| `PATCH` | `/api/media/restore` | `AuthGuard` + `media:edit` | clears `deleted_at`. Bulk. Body `{ ids: number[] }` |
| `GET` | `/api/media/storage/usage` | `AuthGuard` + `settings:view` | `SUM(file_size)` for this tenant, **includes trashed rows** |

`media:view` with `scope = 'own'` (the `worker` default) limits the list to rows where `uploaded_by` is the current user.

## DTOs

### `upload-media.dto.ts`
`entity_type` `@IsEnum`, `entity_id` `@IsInt`. The file comes through `FileInterceptor`, not the DTO.

### `rename-media.dto.ts`
`file_name` `@IsNotEmpty @MaxLength(255)`. Nothing else is editable.

### `find-media-query.dto.ts`
`entity_type` optional, `entity_id` optional integer, plus `page` / `limit`.

### `bulk-media-ids.dto.ts`
`ids` `@IsArray() @ArrayNotEmpty() @IsInt({ each: true })`. Shared by soft delete, hard delete and restore.

## Repository methods

```ts
create(data): Promise<Media>
findById(id): Promise<Media | null>
findByEntity(entityType, entityId): Promise<Media[]>
findMany(where, skip, take): Promise<[Media[], number]>
rename(id, fileName): Promise<Media>
softDelete(ids): Promise<Media[]>           // sets deleted_at, returns the rows actually affected (locked ids excluded)
restore(ids): Promise<Media[]>              // clears deleted_at
hardDelete(ids): Promise<Media[]>           // rows removed, for the caller to clean up ImageKit
findExpiredTrash(olderThanDays): Promise<Media[]>   // the daily purge job's input
deleteByEntity(entityType, entityId): Promise<Media[]>   // rows removed, for the caller to clean up ImageKit
sumFileSize(): Promise<bigint>              // the storage_gb billing dimension — includes trashed rows
findByEntityAndType(entityType, entityId): Promise<Media | null>   // single-image entities, excludes trashed
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `upload-media.handler` | size ≤ 10 MB and MIME allowed **for that `entity_type`** (table below). Pushes to ImageKit **first**, writes the row only if the upload succeeded |
| `rename-media.handler` | updates `file_name` only. `file_url` never changes — the ImageKit object is untouched |
| `soft-delete-media.handler` | bulk. Skips (does not refuse) any id with `is_locked = true`. Sets `deleted_at`, ImageKit untouched |
| `hard-delete-media.handler` | bulk. Same locked-id skip. ImageKit removed first, then the row, immediately |
| `restore-media.handler` | bulk. Clears `deleted_at`. No-op on an already-live row |
| `replace-media.handler` | single-image entities (`user` avatar, `tenant` logo): **hard**-deletes the old (no trash, no undo value for an old avatar), uploads the new, one operation |
| `storage-usage.handler` | `SUM(file_size)` **including trashed rows** — the number step 14 bills on |
| `delete-media-by-entity.handler` | ImageKit first, then every `media` row for that `entity_type` + `entity_id`, **hard** (the parent itself is gone, nothing to restore to). Exposed as `MediaService.deleteAllForEntity()` — the cascade cleanup entry point, called by step 04's `prospect`-only project delete. Same `is_locked` guard |
| `purge-expired-media.job` | daily. Hard-deletes (ImageKit + row) anything with `deleted_at` older than **30 days** |

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

- [x] `media` module, full shape
- [x] `media.helper.ts` — the context/type/size table as one constant
- [x] Upload: validate → ImageKit → row. Never a row without a successful upload
- [x] Rename — database only
- [x] `deleted_at` column — added to `prisma/schema.prisma`, additive migration (no reset). `file_id` also added (needed for ImageKit delete-by-id, found mid-build, not in the original spec)
- [x] Soft delete — bulk, `is_locked` ids skipped, ImageKit untouched
- [x] Hard delete — bulk, `is_locked` ids skipped, ImageKit first then the row
- [x] Restore — bulk, clears `deleted_at`
- [x] `purge-expired-media.job` — daily, hard-deletes trash older than 30 days
- [x] Every normal read (`findByEntity`, `findByEntityAndType`, list, single) excludes `deleted_at IS NOT NULL`
- [x] `storage-usage.handler` sums **including** trashed rows
- [x] Replace, for `user` and `tenant` — hard delete, no trash
- [x] `storage/usage` endpoint
- [x] Wire step 02's `POST /api/users/me/avatar` to `replace-media`
- [x] Wire `tenants` logo → `logo_media_id` (via `POST /api/media/tenant-logo`, a new `TenantsService.setLogoMediaId()`)
- [x] Decide the cascade question and write it into the note — done, see *Decide first* above
- [x] Decide soft vs. hard delete and write it into the note — done, see *Decide first* above
- [x] `deleteAllForEntity` — `MediaService` method + `delete-media-by-entity.handler`, built and unit-tested, for step 04's project delete to call (no caller yet)

## Acceptance

Run live 2026-10-06 against a real running app (`PORT=5391 node dist/main`) with real ImageKit, real Postgres, real logins (`admin@dupont.test`, `worker@dupont.test`, `admin@verhelst.test` — see `doc/notes/test/00-how-to-test.md` § 4 for demo credentials). Test data cleaned up afterward (`delete from media where tenant_id in (1,2)`).

- [x] Upload a 2 MB JPG to `entity_type = 'report'` → row created, URL reachable (curled the ImageKit URL directly, `200`)
- [x] Upload an 11 MB file → rejected before ImageKit is called (`400 File too large: max 10 MB`)
- [x] Upload a PDF to `entity_type = 'report'` → rejected (images only) (`400`, names the allowed list)
- [x] Upload a JPG to `entity_type = 'purchase_invoice'` → rejected (PDF only) (`400`, names the allowed list)
- [x] Rename → `file_name` changes, `file_url` identical
- [x] Soft delete 2 ids (one of them `is_locked`, set by hand in the DB — no module writes a locked row yet) → the unlocked one gets `deleted_at`, ImageKit untouched; the locked one skipped, still live
- [x] A soft-deleted row disappears from `findByEntity`/list but still counts in `storage/usage`
- [x] Restore a soft-deleted id → visible again, `deleted_at` cleared
- [x] Hard delete a normal row → gone from the database (`404` after) and from ImageKit — confirmed via `imagekit.assets.list` (the real API, not the CDN URL, which stays `200` for a while on a stale cache — ImageKit's own SDK docs: "deleting a file does not purge the cache")
- [x] Hard delete an `is_locked` id → skipped, row untouched, still live
- [x] A row trashed 31 days ago (backdated by hand) → gone after `yarn job:media-purge` runs; one trashed yesterday → untouched
- [x] Replace a user avatar twice (`POST /api/users/me/avatar`) → only one `user` row remains for that user, old one hard-deleted (never in trash)
- [ ] `deleteAllForEntity('project', id)` — **not live-tested**: no HTTP path exists yet (step 04, not built, is its only intended caller). Covered by unit tests only (16 handler tests, mocked repository/ImageKit)
- [x] `storage/usage` matches the sum of uploaded sizes, trashed rows included (cross-checked against a direct `SUM(file_size)` in the DB)
- [x] Tenant A cannot list or delete tenant B's media (`admin@verhelst.test` got `404` reading Dupont's row, a bulk-delete on it no-opped silently, Dupont's row was untouched)
- [x] A `worker` sees only their own uploads (`worker@dupont.test` listed 1 row — their own; `admin@dupont.test` listed all 3 in the tenant)
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [media-files.md](../media-files.md) — the table, the rules, `is_locked`
- [technical/phase-09-media.md](../technical/phase-09-media.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 9
