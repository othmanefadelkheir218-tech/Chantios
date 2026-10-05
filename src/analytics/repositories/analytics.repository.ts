import { Injectable } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the analytics module talks to the database. Append-only. */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.AnalyticsEventUncheckedCreateInput,
  ): Promise<AnalyticsEvent> {
    return this.prisma.analyticsEvent.create({ data });
  }

  async findMany(
    where: Prisma.AnalyticsEventWhereInput,
    skip: number,
    take: number,
  ): Promise<[AnalyticsEvent[], number]> {
    return this.prisma.$transaction([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);
  }
}
