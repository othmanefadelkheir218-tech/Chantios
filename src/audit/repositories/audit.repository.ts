import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEntry } from '../helpers/audit.helper';

/** The only place where the audit module talks to the database. */
@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** `tx` — lets a caller keep this write inside its own transaction. */
  async write(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    await (tx ?? this.prisma).auditLog.create({
      data: {
        tenantId: entry.tenantId ?? null,
        adminUserId: entry.adminUserId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        oldValue: entry.oldValue ?? undefined,
        newValue: entry.newValue ?? undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }

  /**
   * How many audit rows on this entity were written by someone OTHER than
   * `ownerUserId` (a different tenant user, an admin, or an unknown actor).
   * Used by time entries: "an employee may edit their own entry only if
   * nobody else touched it".
   */
  countByOtherActors(
    tenantId: number,
    entityType: string,
    entityId: number,
    ownerUserId: number,
  ): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        tenantId,
        entityType,
        entityId,
        OR: [{ userId: null }, { userId: { not: ownerUserId } }],
      },
    });
  }

  findMany(
    where: Prisma.AuditLogWhereInput,
    skip: number,
    take: number,
  ): Promise<[AuditLog[], number]> {
    return this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
  }
}
