import { BadRequestException } from '@nestjs/common';
import { Note, NoteLabel, Prisma } from '@prisma/client';

/** The fixed color keys (doc/notes/notes.md § How a note works). The frontend maps each to a color. */
export const NOTE_COLORS = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'dark_blue',
  'purple',
  'pink',
  'brown',
  'gray',
] as const;

export type NoteView = 'notes' | 'archive' | 'trash';
export const NOTE_VIEWS: readonly NoteView[] = ['notes', 'archive', 'trash'];

/** A trashed note is deleted for good after this many days. */
export const NOTE_TRASH_DAYS = 7;

/** The editor document, serialized — a guard against a huge body. */
export const MAX_NOTE_CONTENT_BYTES = 200 * 1024;

const DAY_MS = 24 * 60 * 60 * 1000;

export function trashCutoff(now: Date): Date {
  return new Date(now.getTime() - NOTE_TRASH_DAYS * DAY_MS);
}

/** Refuses an editor document bigger than `MAX_NOTE_CONTENT_BYTES`. */
export function assertContentSize(content: unknown): void {
  if (content === undefined || content === null) return;
  const bytes = Buffer.byteLength(JSON.stringify(content), 'utf8');
  if (bytes > MAX_NOTE_CONTENT_BYTES) {
    throw new BadRequestException(
      `Note too large: max ${MAX_NOTE_CONTENT_BYTES / 1024} KB`,
    );
  }
}

/**
 * The plain text of a Tiptap document: every `text` node, one block per
 * line. Built by the server for search — the client never sends it.
 */
export function extractNoteText(
  title: string | null | undefined,
  content: unknown,
): string {
  const parts: string[] = [];
  if (title) parts.push(title);

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const { text, content: children } = node as {
      text?: unknown;
      content?: unknown;
    };
    if (typeof text === 'string') parts.push(text);
    if (Array.isArray(children)) children.forEach(walk);
  };
  walk(content);

  return parts.join('\n').replace(/\s+\n/g, '\n').trim();
}

/**
 * An archived note is not pinned; pinning an archived note brings it back to
 * Notes (doc/notes/notes.md). Pin wins when both are asked at once.
 */
export function resolvePinArchive(
  current: { isPinned: boolean; isArchived: boolean },
  isPinned?: boolean,
  isArchived?: boolean,
): { isPinned: boolean; isArchived: boolean } {
  if (isPinned === true) return { isPinned: true, isArchived: false };
  if (isArchived === true) return { isPinned: false, isArchived: true };
  return {
    isPinned: isPinned ?? current.isPinned,
    isArchived: isArchived ?? current.isArchived,
  };
}

/** An empty title is no title. */
export function cleanTitle(title: string | undefined): string | null {
  const trimmed = title?.trim();
  return trimmed ? trimmed : null;
}

/** The audit row of a note action — never its title or content (doc/notes/notes.md). */
export function noteAudit(
  actor: { tenantId: number; userId: number },
  action: string,
  noteId: number | null,
  entityType = 'note',
) {
  return {
    tenantId: actor.tenantId,
    userId: actor.userId,
    action,
    entityType,
    entityId: noteId,
    ipAddress: null,
  };
}

/** The list filter of one view, for the owner only. */
export function buildNoteFilter(
  userId: number,
  view: NoteView,
  labelId?: number,
  search?: string,
): Prisma.NoteWhereInput {
  return {
    userId,
    ...(view === 'trash'
      ? { deletedAt: { not: null } }
      : { deletedAt: null, isArchived: view === 'archive' }),
    ...(labelId !== undefined && { labels: { some: { labelId } } }),
    ...(search && {
      contentText: { contains: search.trim(), mode: 'insensitive' },
    }),
  };
}

/** A label, as it leaves the module. */
export function toNoteLabelEntity(label: NoteLabel) {
  return { id: label.id, name: label.name, createdAt: label.createdAt };
}

export type NoteWithLabels = Note & {
  labels: { label: NoteLabel }[];
};

/** What may leave the module — an allow-list. `contentText` stays inside. */
export function toNoteEntity(
  note: NoteWithLabels,
  images: { id: number; fileUrl: string; fileName: string }[] = [],
) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    color: note.color,
    isPinned: note.isPinned,
    isArchived: note.isArchived,
    deletedAt: note.deletedAt,
    labels: note.labels.map((link) => toNoteLabelEntity(link.label)),
    images: images.map((image) => ({
      id: image.id,
      fileUrl: image.fileUrl,
      fileName: image.fileName,
    })),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
