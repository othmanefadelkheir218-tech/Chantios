import { Injectable } from '@nestjs/common';
import { Feedback, FeedbackStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the feedback module talks to the database. */
@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  findById(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: FeedbackStatus): Promise<Feedback> {
    return this.prisma.feedback.update({ where: { id }, data: { status } });
  }
}
