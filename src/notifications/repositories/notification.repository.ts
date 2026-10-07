import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationRecipient } from '../notification.types';

/**
 * The only place where the notifications module talks to `notifications`.
 *
 * It uses the raw client on purpose: `tenant_id` is NULLABLE here (a platform
 * alert has none), so the generic tenant extension cannot scope it. Every
 * method filters by the recipient itself — `user_id` + `tenant_id`, or
 * `admin_user_id` — so nobody reads or marks another person's row.
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The recipient's own rows only (the CHECK guarantees exactly one of the two ids). */
  private ownedBy(
    recipient: NotificationRecipient,
  ): Prisma.NotificationWhereInput {
    return 'adminUserId' in recipient
      ? { adminUserId: recipient.adminUserId }
      : { userId: recipient.userId, tenantId: recipient.tenantId };
  }

  createMany(
    rows: Prisma.NotificationCreateManyInput[],
  ): Promise<Notification[]> {
    return this.prisma.notification.createManyAndReturn({ data: rows });
  }

  async findManyForRecipient(
    recipient: NotificationRecipient,
    isRead: boolean | undefined,
    skip: number,
    take: number,
  ): Promise<[Notification[], number]> {
    const where: Prisma.NotificationWhereInput = {
      ...this.ownedBy(recipient),
      ...(isRead !== undefined && { isRead }),
    };
    return this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);
  }

  /** By id only — the handler decides 404 (no such row) versus 403 (not yours). */
  findById(id: number): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markRead(
    id: number,
    recipient: NotificationRecipient,
  ): Promise<Notification | null> {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, ...this.ownedBy(recipient) },
      data: { isRead: true },
    });
    return count === 0 ? null : this.findById(id);
  }

  async markAllRead(recipient: NotificationRecipient): Promise<number> {
    const { count } = await this.prisma.notification.updateMany({
      where: { ...this.ownedBy(recipient), isRead: false },
      data: { isRead: true },
    });
    return count;
  }

  countUnread(recipient: NotificationRecipient): Promise<number> {
    return this.prisma.notification.count({
      where: { ...this.ownedBy(recipient), isRead: false },
    });
  }

  /**
   * Which of these users already got `type` about `entityId` since `since` —
   * the dedupe of a daily cron. Matches `payload.entity_id`.
   */
  async findRecentRecipients(
    type: string,
    entityId: number,
    userIds: number[],
    since: Date,
  ): Promise<Set<number>> {
    const rows = await this.prisma.notification.findMany({
      where: {
        type,
        userId: { in: userIds },
        createdAt: { gte: since },
        payload: { path: ['entity_id'], equals: entityId },
      },
      select: { userId: true },
    });
    return new Set(rows.flatMap((row) => (row.userId ? [row.userId] : [])));
  }

  /**
   * Retention: ONLY read notifications of this company, older than `before`.
   * An unread one is never deleted, whatever its age.
   */
  async deleteReadOlderThan(tenantId: number, before: Date): Promise<number> {
    const { count } = await this.prisma.notification.deleteMany({
      where: { tenantId, isRead: true, createdAt: { lt: before } },
    });
    return count;
  }
}
