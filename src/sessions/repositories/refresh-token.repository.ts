import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the sessions module talks to the database.
 * `refresh_tokens` is one of the 8 platform tables skipped by the tenant
 * extension (doc/notes/technical/build-order.md § 1b), so this always uses
 * the raw `PrismaService` — there is no tenant-scoped variant to bypass.
 */
@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  revoke(id: number): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: number): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  async revokeAllForAdmin(adminUserId: number): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  listLiveForUser(userId: number): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLiveById(id: number, userId: number): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: { id, userId, revokedAt: null },
    });
  }

  async deleteExpiredOlderThan(date: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: date } },
    });
    return count;
  }
}
