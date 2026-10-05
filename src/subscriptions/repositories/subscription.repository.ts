import { Injectable } from '@nestjs/common';
import {
  BillingUsageSnapshot,
  Prisma,
  TenantSubscription,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the subscriptions module talks to the database. */
@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Called by step 02 registration, in the same transaction as the tenant. */
  create(
    data: Prisma.TenantSubscriptionUncheckedCreateInput,
  ): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.create({ data });
  }

  findByTenant(tenantId: string): Promise<TenantSubscription | null> {
    return this.prisma.tenantSubscription.findUnique({ where: { tenantId } });
  }

  async findMany(
    where: Prisma.TenantSubscriptionWhereInput,
    skip: number,
    take: number,
  ): Promise<[TenantSubscription[], number]> {
    return this.prisma.$transaction([
      this.prisma.tenantSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tenantSubscription.count({ where }),
    ]);
  }

  /** Never touches `plan_id`: the change waits for the next renewal. */
  setPendingPlan(
    tenantId: string,
    planId: string,
    effectiveAt: Date,
  ): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: { pendingPlanId: planId, pendingPlanEffectiveAt: effectiveAt },
    });
  }

  /** Rows already written for the same (tenant, period, dimension) are skipped. */
  async snapshotUsage(
    rows: Prisma.BillingUsageSnapshotCreateManyInput[],
  ): Promise<number> {
    const { count } = await this.prisma.billingUsageSnapshot.createMany({
      data: rows,
      skipDuplicates: true,
    });
    return count;
  }

  async findUsage(
    tenantId: string,
    skip: number,
    take: number,
  ): Promise<[BillingUsageSnapshot[], number]> {
    const where = { tenantId };
    return this.prisma.$transaction([
      this.prisma.billingUsageSnapshot.findMany({
        where,
        orderBy: [{ periodStart: 'desc' }, { featureKey: 'asc' }],
        skip,
        take,
      }),
      this.prisma.billingUsageSnapshot.count({ where }),
    ]);
  }
}
