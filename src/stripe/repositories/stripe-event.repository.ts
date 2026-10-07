import { Injectable } from '@nestjs/common';
import { Prisma, StripeEvent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the stripe module talks to the database. */
@Injectable()
export class StripeEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.StripeEventCreateInput): Promise<StripeEvent> {
    return this.prisma.stripeEvent.create({ data });
  }

  findByStripeId(stripeEventId: string): Promise<StripeEvent | null> {
    return this.prisma.stripeEvent.findUnique({ where: { stripeEventId } });
  }

  markProcessed(id: number): Promise<StripeEvent> {
    return this.prisma.stripeEvent.update({
      where: { id },
      data: { processedAt: new Date(), error: null },
    });
  }

  markError(id: number, error: string): Promise<StripeEvent> {
    return this.prisma.stripeEvent.update({
      where: { id },
      data: { error },
    });
  }
}
