import { Injectable } from '@nestjs/common';
import { Feedback, FeedbackStatus, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the feedback module talks to the database. Two
 * clients, same dual pattern as `categories`/`chat`'s own admin door: the
 * PLATFORM side (`findMany`, `findById`, `updateStatus` — step 01) stays on
 * the raw `PrismaService`, since a platform admin reads and changes every
 * tenant's feedback. The TENANT side (`create`, `findMine` — step 16) goes
 * through `TenantPrismaService` — "the tenant posts, reads only their own" is
 * then structural, never a filter that could be forgotten.
 */
@Injectable()
export class FeedbackRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  // ---- Platform side ----

  async findMany(
    where: Prisma.FeedbackWhereInput,
    skip: number,
    take: number,
  ): Promise<[Feedback[], number]> {
    return this.prisma.$transaction([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.feedback.count({ where }),
    ]);
  }

  findById(id: number): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({ where: { id } });
  }

  updateStatus(id: number, status: FeedbackStatus): Promise<Feedback> {
    return this.prisma.feedback.update({ where: { id }, data: { status } });
  }

  // ---- Tenant side ----

  create(data: Prisma.FeedbackUncheckedCreateInput): Promise<Feedback> {
    return this.tenantPrisma.db.feedback.create({ data });
  }

  async findMine(
    where: Prisma.FeedbackWhereInput,
    skip: number,
    take: number,
  ): Promise<[Feedback[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.feedback.count({ where }),
    ]);
  }
}
