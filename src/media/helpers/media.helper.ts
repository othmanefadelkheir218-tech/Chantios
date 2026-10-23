import { Media, MediaEntityType, Prisma } from '@prisma/client';

/** Matches the `media.chk_media_file_size` CHECK constraint (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** D2 — email files may be up to 25 MB (Gmail's limit), the CHECK allows it. */
export const MAX_EMAIL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** The size limit of one file of this entity type. */
export function maxFileSize(entityType: MediaEntityType): number {
  return entityType === 'email_attachment'
    ? MAX_EMAIL_ATTACHMENT_BYTES
    : MAX_FILE_SIZE_BYTES;
}

/**
 * D2 — what an email may carry (doc/notes/client-email.md § What we save):
 * PDF, images, Office, ZIP, TXT, CSV. The key is the extension, used when a
 * mail app sends a generic `application/octet-stream`.
 */
const EMAIL_ATTACHMENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  zip: 'application/zip',
  txt: 'text/plain',
  csv: 'text/csv',
};

/** D2 — programs and scripts, never saved: "not saved for security". */
export const EMAIL_BLOCKED_EXTENSIONS: readonly string[] = [
  'exe',
  'bat',
  'cmd',
  'com',
  'msi',
  'scr',
  'js',
  'vbs',
  'ps1',
  'jar',
  'sh',
  'apk',
];
const EMAIL_BLOCKED_MIME_TYPES: readonly string[] = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-ms-installer',
  'application/vnd.microsoft.portable-executable',
  'application/x-bat',
  'application/x-sh',
  'application/x-shellscript',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'text/vbscript',
  'application/java-archive',
  'application/x-java-archive',
  'application/vnd.android.package-archive',
];
/** Extra names some mail apps give to an allowed type. */
const EMAIL_MIME_ALIASES: Record<string, string> = {
  'application/x-zip-compressed': 'application/zip',
  'image/jpg': 'image/jpeg',
  'application/csv': 'text/csv',
};

export type EmailAttachmentCheck =
  | { ok: true; mimeType: string }
  | { ok: false; reason: 'blocked_type' | 'too_large' };

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot < 0
    ? ''
    : filename
        .slice(dot + 1)
        .trim()
        .toLowerCase();
}

/**
 * D2 — may this email file be saved? Blocked by extension **and** by type;
 * a type outside the allowed list is refused the same way. A generic
 * `application/octet-stream` takes the type of its extension.
 */
export function checkEmailAttachment(
  filename: string,
  contentType: string | null | undefined,
  size: number,
): EmailAttachmentCheck {
  const extension = extensionOf(filename);
  const raw = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (
    EMAIL_BLOCKED_EXTENSIONS.includes(extension) ||
    EMAIL_BLOCKED_MIME_TYPES.includes(raw)
  ) {
    return { ok: false, reason: 'blocked_type' };
  }
  const mimeType =
    !raw || raw === 'application/octet-stream'
      ? EMAIL_ATTACHMENT_TYPES[extension]
      : (EMAIL_MIME_ALIASES[raw] ?? raw);
  if (!mimeType || !ALLOWED_MIME_TYPES.email_attachment.includes(mimeType)) {
    return { ok: false, reason: 'blocked_type' };
  }
  if (size <= 0 || size > MAX_EMAIL_ATTACHMENT_BYTES) {
    return { ok: false, reason: 'too_large' };
  }
  return { ok: true, mimeType };
}

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
  note: ['image/jpeg', 'image/png', 'image/webp'],
  email_attachment: [...new Set(Object.values(EMAIL_ATTACHMENT_TYPES))],
};

/**
 * Files only their owner's module may reach (doc/notes/notes.md: a note's
 * images are private). The generic `/api/media` routes never list, read,
 * rename, trash or delete them, and refuse them on upload.
 */
export const PRIVATE_MEDIA_ENTITY_TYPES: readonly MediaEntityType[] = [
  'note',
  // A Gmail inbox is private to its owner (doc/notes/client-email.md): email
  // files are reached through the client chat routes only.
  'email_attachment',
];

/** The `entity_type` values the generic `/api/media` routes accept. */
export const PUBLIC_MEDIA_ENTITY_TYPES = Object.values(MediaEntityType).filter(
  (type) => !PRIVATE_MEDIA_ENTITY_TYPES.includes(type),
);

/** Prisma filter for every generic-route read: never a private file. */
export const NOT_PRIVATE_MEDIA: Prisma.MediaWhereInput = {
  entityType: { notIn: [...PRIVATE_MEDIA_ENTITY_TYPES] },
};

/**
 * Step 26 B (doc/notes/notes.md § Private) — who sees note files on `/media`:
 * the uploader (the note's owner), and the tenant admin every note file.
 * `null` = nobody: internal callers, and a platform admin who impersonates.
 */
export type NoteFileViewer = { userId: number; isAdmin: boolean } | null;

/** The generic routes' read filter: public files + the note files this viewer may see. */
export function visibleMediaFilter(
  viewer: NoteFileViewer,
): Prisma.MediaWhereInput {
  if (!viewer) return NOT_PRIVATE_MEDIA;
  return {
    OR: [
      NOT_PRIVATE_MEDIA,
      {
        entityType: 'note',
        ...(!viewer.isAdmin && { uploadedBy: viewer.userId }),
      },
    ],
  };
}

/**
 * A note file never links to its note (step 26 B3): `entity_id` is hidden,
 * `entity_type = note` is enough. Every other file goes out unchanged.
 */
export function toVisibleMediaEntity(media: Media) {
  const entity = toMediaEntity(media);
  return media.entityType === 'note' ? { ...entity, entityId: null } : entity;
}

/**
 * Who uploads a file: a staff user, or the client in the portal chat, which
 * has no user account (`userId = null` → `media.uploaded_by = NULL`).
 * `AuthenticatedUser` fits this shape.
 */
export interface MediaUploader {
  tenantId: number;
  userId: number | null;
}

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

/**
 * Builds the Prisma filter for the list route: entity + (scoped) uploader.
 * A search by `entity_id` never returns note files — their note stays hidden.
 */
export function buildMediaFilter(
  entityType?: MediaEntityType,
  entityId?: number,
  uploadedBy?: number,
  viewer: NoteFileViewer = null,
): Prisma.MediaWhereInput {
  return {
    deletedAt: null,
    AND: [
      entityId !== undefined ? NOT_PRIVATE_MEDIA : visibleMediaFilter(viewer),
    ],
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
