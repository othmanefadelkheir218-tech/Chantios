import { Injectable } from '@nestjs/common';
import { NoteLabel, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { NoteWithLabels } from '../helpers/note.helper';

const WITH_LABELS = { labels: { include: { label: true } } } as const;

/**
 * The only place where the notes module talks to the database — notes,
 * labels and their links. Every read takes the owner's `userId`: a note is
 * private (doc/notes/notes.md), whatever the caller's role.
 */
@Injectable()
export class NoteRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findMany(
    where: Prisma.NoteWhereInput,
    skip: number,
    take: number,
  ): Promise<[NoteWithLabels[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.note.findMany({
        where,
        include: WITH_LABELS,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.note.count({ where }),
    ]);
  }

  /** One note of this owner, trashed or not. `null` = not theirs or unknown. */
  findOwn(id: number, userId: number): Promise<NoteWithLabels | null> {
    return this.tenantPrisma.db.note.findFirst({
      where: { id, userId },
      include: WITH_LABELS,
    });
  }

  /** The note and its label links in one transaction. */
  create(
    data: Prisma.NoteUncheckedCreateInput,
    labelIds: number[],
  ): Promise<NoteWithLabels> {
    return this.tenantPrisma.db.$transaction(async (tx) => {
      const note = await tx.note.create({ data });
      if (labelIds.length > 0) {
        await tx.noteLabelLink.createMany({
          data: labelIds.map((labelId) => ({
            tenantId: data.tenantId,
            noteId: note.id,
            labelId,
          })),
        });
      }
      return tx.note.findFirstOrThrow({
        where: { id: note.id },
        include: WITH_LABELS,
      });
    });
  }

  /** `labelIds` given → the note's links are replaced by exactly these. */
  update(
    id: number,
    tenantId: number,
    data: Prisma.NoteUncheckedUpdateInput,
    labelIds?: number[],
  ): Promise<NoteWithLabels> {
    return this.tenantPrisma.db.$transaction(async (tx) => {
      await tx.note.update({ where: { id }, data });
      if (labelIds) {
        await tx.noteLabelLink.deleteMany({ where: { noteId: id } });
        if (labelIds.length > 0) {
          await tx.noteLabelLink.createMany({
            data: labelIds.map((labelId) => ({
              tenantId,
              noteId: id,
              labelId,
            })),
          });
        }
      }
      return tx.note.findFirstOrThrow({ where: { id }, include: WITH_LABELS });
    });
  }

  /** Trash (`date`) or restore (`null`). */
  setDeletedAt(id: number, deletedAt: Date | null): Promise<NoteWithLabels> {
    return this.tenantPrisma.db.note.update({
      where: { id },
      data: { deletedAt },
      include: WITH_LABELS,
    });
  }

  /** Deletes for good. Links go with it (FK cascade); images are the caller's job first. */
  async hardDelete(id: number): Promise<void> {
    await this.tenantPrisma.db.note.delete({ where: { id } });
  }

  /** The owner's trash — to empty it. */
  async findTrashedIds(userId: number): Promise<number[]> {
    const rows = await this.tenantPrisma.db.note.findMany({
      where: { userId, deletedAt: { not: null } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  /** The current company's notes trashed before `cutoff` — the daily purge. */
  findTrashedBefore(cutoff: Date): Promise<{ id: number; userId: number }[]> {
    return this.tenantPrisma.db.note.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: { id: true, userId: true },
    });
  }

  // ── Labels ────────────────────────────────────────────────────────────

  findLabels(userId: number): Promise<NoteLabel[]> {
    return this.tenantPrisma.db.noteLabel.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  findOwnLabel(id: number, userId: number): Promise<NoteLabel | null> {
    return this.tenantPrisma.db.noteLabel.findFirst({ where: { id, userId } });
  }

  countOwnLabels(ids: number[], userId: number): Promise<number> {
    if (ids.length === 0) return Promise.resolve(0);
    return this.tenantPrisma.db.noteLabel.count({
      where: { id: { in: ids }, userId },
    });
  }

  createLabel(data: Prisma.NoteLabelUncheckedCreateInput): Promise<NoteLabel> {
    return this.tenantPrisma.db.noteLabel.create({ data });
  }

  renameLabel(id: number, name: string): Promise<NoteLabel> {
    return this.tenantPrisma.db.noteLabel.update({
      where: { id },
      data: { name },
    });
  }

  /** Its links go with it (FK cascade); the notes stay. */
  async deleteLabel(id: number): Promise<void> {
    await this.tenantPrisma.db.noteLabel.delete({ where: { id } });
  }
}
