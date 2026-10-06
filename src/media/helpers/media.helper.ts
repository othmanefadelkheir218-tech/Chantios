import { Media, MediaEntityType, Prisma } from '@prisma/client';

/** Matches the `media.file_size` CHECK constraint (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Allowed MIME types per `entity_type` (doc/notes/media-files.md § "Allowed
 * types (per context)"). One constant — every caller (upload, replace) reads
 * this; no module re-declares its own list.
 */
export const ALLOWED_MIME_TYPES: Record<MediaEntityType, readonly string[]> = {
  user: ['image/jpeg', 'image/png'],
  tenant: ['image/jpeg', 'image/png', 'image/svg+xml'],
  project: ['application/pdf', 'image/jpeg', 'image/png'],
  report: ['image/jpeg', 'image/png', 'image/webp'],
  purchase_invoice: ['application/pdf'],
  quote: ['application/pdf'],
  invoice: ['application/pdf'],
  message: ['application/pdf', 'image/jpeg', 'image/png'],
};

export function isMimeAllowed(
  entityType: MediaEntityType,
  mimeType: string,
): boolean {
  return ALLOWED_MIME_TYPES[entityType].includes(mimeType);
}

/**
 * Every upload's ImageKit `folder` —
 * `/Chantios/tenant-<id>/<entity_type>/<entity_id>`, e.g.
 * `/Chantios/tenant-1/project/10`. The `Chantios` root keeps this app's
 * files together and separate from anything else the same ImageKit account
 * might ever hold. Without this, every file (every tenant, every entity)
 * lands loose at the ImageKit root. ImageKit creates the nested folders on
 * first upload if they don't exist yet — nothing to provision.
 */
export function buildMediaFolder(
  tenantId: number,
  entityType: MediaEntityType,
  entityId: number,
): string {
  return `/Chantios/tenant-${tenantId}/${entityType}/${entityId}`;
}

/**
 * What may leave the module — an allow-list. ImageKit's own `file_id` never
 * appears in a response; it is an internal handle used only to call the
 * ImageKit SDK later, same spirit as `password_hash` never leaving `users`.
 */
/**
 * The `entity_id` a file carries while it waits to be attached to something
 * that does not exist yet — a chat message is written AFTER its files are
 * uploaded. `attach-media.handler.ts` replaces it with the real id.
 */
export const PENDING_ENTITY_ID = 0;

export function toMediaEntity(media: Media) {
  return {
    id: media.id,
    tenantId: media.tenantId,
    entityType: media.entityType,
    entityId: media.entityId,
    fileName: media.fileName,
    fileUrl: media.fileUrl,
    fileType: media.fileType,
    fileSize: Number(media.fileSize),
    isLocked: media.isLocked,
    uploadedBy: media.uploadedBy,
    deletedAt: media.deletedAt,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  };
}

/** Builds the Prisma filter for the list route: entity + (scoped) uploader. */
export function buildMediaFilter(
  entityType?: MediaEntityType,
  entityId?: number,
  uploadedBy?: number,
): Prisma.MediaWhereInput {
  return {
    deletedAt: null,
    ...(entityType !== undefined && { entityType }),
    ...(entityId !== undefined && { entityId }),
    ...(uploadedBy !== undefined && { uploadedBy }),
  };
}

/** Splits a bulk id lookup into what the caller may act on vs. what is frozen. */
export function splitLocked<T extends { id: number; isLocked: boolean }>(
  rows: T[],
): { eligible: T[]; skipped: number[] } {
  const eligible: T[] = [];
  const skipped: number[] = [];
  for (const row of rows) {
    if (row.isLocked) skipped.push(row.id);
    else eligible.push(row);
  }
  return { eligible, skipped };
}
