# Phase 05 — Media & Files

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [media-files.md](../media-files.md).
> Old reference: [../test/07-media.md](../test/07-media.md).

## Goal

One upload flow for every file: type and size rules per entity, soft delete (trash), restore, hard delete, the 30-day purge, the locked-file guard, avatar and logo replace, storage usage.

## Before you start

- Files in the scratchpad: `test.jpg` (< 1 MB), `test.png`, `test.webp`, `test.pdf`, `test.docx`, `big.jpg` (11 MB).
- Every upload lands in ImageKit under `/Chantios/tenant-<id>/<entity_type>/<entity_id>/`. Each **[CHECK IMAGEKIT]** message names that folder and the file name.
- Company A owner unless said otherwise.

---

## 1. Upload rules

| ID | Do | Expected | Result |
|---|---|---|---|
| MED-01 | Upload `test.jpg`, `entity_type=report`, `entity_id=1` | `201`, `file_url`, `file_type image/jpeg`, `file_size`, `is_locked false`, `deleted_at null`; one `audit_logs` `upload` row | todo |
| MED-02 | **[CHECK IMAGEKIT]** | the file is in `tenant-<A>/report/1/`; its URL opens | todo |
| MED-03 | Upload `big.jpg` (11 MB) | `400 File too large: max 10 MB`, **nothing** new in ImageKit | todo |
| MED-04 | The type table — one request each: | | todo |
| | `report`: PDF → `400`; WEBP → `201` | | |
| | `purchase_invoice`: JPG → `400`; PDF → `201` | | |
| | `user`: SVG / PDF → `400` | | |
| | `message`: DOCX → `400` | | |
| | `project`: PDF, JPG, PNG → `201` | | |
| MED-05 | Upload with `entity_type=planet` | `400` | todo |

## 2. Read and rename

| ID | Do | Expected | Result |
|---|---|---|---|
| MED-06 | `GET /api/media?entity_type=report&entity_id=1`, then `GET /api/media/:id` | `200`, paginated; metadata only, not the bytes | todo |
| MED-07 | `GET /api/media/999999` | `404 Media not found` | todo |
| MED-08 | `PATCH /api/media/:id { "file_name": "front-photo.jpg" }` | `200`, `file_name` changed, `file_url` identical, one `rename` audit row | todo |
| MED-09 | `PATCH` with `file_url` or an empty name | `400` | todo |
| MED-10 | Worker uploads one file, then `GET /api/media` as worker and as owner | worker sees only their own; owner sees all, worker's included | todo |

## 3. Trash, restore, hard delete, purge

Upload 3 throwaway files (`T1`, `T2`, `T3`). Set `is_locked = true` on `T3` in the DB (no module writes a locked row until phase 16).

| ID | Do | Expected | Result |
|---|---|---|---|
| MED-11 | `DELETE /api/media { ids: [T1, T3] }` | `200`, `deleted` = T1, `skipped` = T3; T1 has `deleted_at`, T3 untouched | todo |
| MED-12 | **[CHECK IMAGEKIT]** | T1 is **still** in ImageKit (a soft delete never touches it) | todo |
| MED-13 | List and `GET` T1 | gone from the list, `GET` → `404`; `GET /api/media/storage/usage` still **includes** T1's size | todo |
| MED-14 | `PATCH /api/media/restore { ids: [T1] }` | visible again, `deleted_at null`; restoring a live row is a no-op | todo |
| MED-15 | `DELETE /api/media/permanent { ids: [T2] }` | `200`, row gone from the DB | todo |
| MED-16 | **[CHECK IMAGEKIT]** | T2 is **gone** from the media library (its CDN URL may stay cached a while — that is ImageKit, not a bug) | todo |
| MED-17 | `DELETE /api/media/permanent { ids: [T3] }` | `deleted: []`, `skipped: [T3]`; row and file kept | todo |
| MED-18 | Soft-delete T1 again, backdate `deleted_at` by 31 days; soft-delete a 4th file `T4` now; `yarn job:media-purge` | prints `{ purged: 1, ... }`; T1 gone from DB, T4 still there | todo |
| MED-19 | **[CHECK IMAGEKIT]** | T1 gone, T4 still there | todo |
| MED-20 | `ids: []` on any bulk route | `400` | todo |

## 4. Avatar and logo

| ID | Do | Expected | Result |
|---|---|---|---|
| MED-21 | `POST /api/users/me/avatar` with `test.jpg`, twice | both `201`; exactly **one** `user` media row for the owner — the first was hard-deleted, never trashed | todo |
| MED-22 | **[CHECK IMAGEKIT]** | folder `tenant-<A>/user/<owner id>/` holds one file | todo |
| MED-23 | `POST /api/media/tenant-logo` with `test.png` | `201`, `tenants.logo_media_id` points at it | todo |
| MED-24 | Manager calls `tenant-logo` | `403` | todo |

## 5. Storage usage

| ID | Do | Expected | Result |
|---|---|---|---|
| MED-25 | `GET /api/media/storage/usage` | equals `select sum(file_size) from media where tenant_id = A` — trashed rows included | todo |
| MED-26 | Manager calls it | `403` (`settings` is admin only) | todo |

## 6. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-MED-01 | B owner: `GET /api/media/<A file>` | `404` | todo |
| ISO-MED-02 | B owner: `DELETE /api/media { ids: [<A file>] }` and `/permanent` | `200`, `deleted: []`, A's file untouched | todo |

`deleteAllForEntity` (the cascade used by the prospect-project delete) is tested in phase 06, PRJ-10.
