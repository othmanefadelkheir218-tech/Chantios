import { Injectable } from '@nestjs/common';
import { Media, MediaEntityType, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the media module talks to the database. */
@Injectable()
export class MediaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  create(data: Prisma.MediaUncheckedCreateInput): Promise<Media> {
    return this.tenantPrisma.db.media.create({ data });
  }

  /** Excludes trash — every normal read does. */
  findById(id: number): Promise<Media | null> {
    return this.tenantPrisma.db.media.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /** Bypasses the trash filter — restore/hard-delete need to see an already-trashed row. */
  findByIdIncludingTrashed(id: number): Promise<Media | null> {
    return this.tenantPrisma.db.media.findFirst({ where: { id } });
  }

  /** Excludes trash. */
  findByEntity(
    entityType: MediaEntityType,
    entityId: number,
  ): Promise<Media[]> {
    return this.tenantPrisma.db.media.findMany({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Every row for one entity — trashed and locked included. The cascade
   * (`deleteAllForEntity`) fetch step: the parent itself is gone, so even a
   * trashed row for it must go (nothing left to keep it in trash for).
   */
  findAllForEntity(
    entityType: MediaEntityType,
    entityId: number,
  ): Promise<Media[]> {
    return this.tenantPrisma.db.media.findMany({
      where: { entityType, entityId },
    });
  }

  /** Single-image entities (`user` avatar, `tenant` logo). Excludes trash. */
  findByEntityAndType(
    entityType: MediaEntityType,
    entityId: number,
  ): Promise<Media | null> {
    return this.tenantPrisma.db.media.findFirst({
      where: { entityType, entityId, deletedAt: null },
    });
  }

  /**
   * Bulk lookup by id, trash included — bulk soft delete / hard delete /
   * restore all need to see `is_locked` (and the current `deleted_at`)
   * before deciding what to do with each row.
   */
  findManyByIds(ids: number[]): Promise<Media[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.tenantPrisma.db.media.findMany({ where: { id: { in: ids } } });
  }

  async findMany(
    where: Prisma.MediaWhereInput,
    skip: number,
    take: number,
  ): Promise<[Media[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.media.count({ where }),
    ]);
  }

  rename(id: number, fileName: string): Promise<Media> {
    return this.tenantPrisma.db.media.update({
      where: { id },
      data: { fileName },
    });
  }

  /** Sets `deleted_at`. File stays on ImageKit — the caller never touches it. */
  async softDelete(ids: number[]): Promise<Media[]> {
    if (ids.length === 0) return [];
    await this.tenantPrisma.db.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    return this.tenantPrisma.db.media.findMany({ where: { id: { in: ids } } });
  }

  /** Clears `deleted_at`. */
  async restore(ids: number[]): Promise<Media[]> {
    if (ids.length === 0) return [];
    await this.tenantPrisma.db.media.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    return this.tenantPrisma.db.media.findMany({ where: { id: { in: ids } } });
  }

  /**
   * Removes the given ids from the database. The caller (a handler) decides
   * which ids are safe to pass here — ImageKit cleanup for each row must
   * already have happened first. Returns what was removed.
   */
  async hardDelete(ids: number[]): Promise<Media[]> {
    if (ids.length === 0) return [];
    const rows = await this.tenantPrisma.db.media.findMany({
      where: { id: { in: ids } },
    });
    await this.tenantPrisma.db.media.deleteMany({ where: { id: { in: ids } } });
    return rows;
  }

  /**
   * NOT tenant-filtered — the daily purge job scans every tenant's trash in
   * one sweep, with no tenant in `nestjs-cls` (it runs outside any request),
   * same reason as `UserRepository.countActiveByRole`.
   */
  findExpiredTrash(olderThanDays: number): Promise<Media[]> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    return this.prisma.media.findMany({ where: { deletedAt: { lt: cutoff } } });
  }

  /**
   * NOT tenant-filtered, same reason as `findExpiredTrash` — deletes by
   * primary key, already-known-safe ids from that global scan.
   */
  async hardDeleteUnscoped(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const { count } = await this.prisma.media.deleteMany({
      where: { id: { in: ids } },
    });
    return count;
  }

  /** The `storage_gb` billing dimension — includes trashed rows on purpose. */
  async sumFileSize(): Promise<bigint> {
    const result = await this.tenantPrisma.db.media.aggregate({
      _sum: { fileSize: true },
    });
    return result._sum.fileSize ?? BigInt(0);
  }
}
