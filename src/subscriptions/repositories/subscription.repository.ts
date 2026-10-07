import { Injectable } from '@nestjs/common';
import {
  BillingUsageSnapshot,
  Prisma,
  SubscriptionStatus,
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
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    if (tx) return tx.tenantSubscription.create({ data });
    return this.prisma.tenantSubscription.create({ data });
  }

  findByTenant(tenantId: number): Promise<TenantSubscription | null> {
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
    tenantId: number,
    planId: number,
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
    tenantId: number,
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

  /** `GET /api/admin/billing/snapshots` (step 14) — every tenant, newest first. */
  async findAllUsage(
    skip: number,
    take: number,
  ): Promise<[BillingUsageSnapshot[], number]> {
    return this.prisma.$transaction([
      this.prisma.billingUsageSnapshot.findMany({
        orderBy: [
          { snapshotTakenAt: 'desc' },
          { tenantId: 'asc' },
          { featureKey: 'asc' },
        ],
        skip,
        take,
      }),
      this.prisma.billingUsageSnapshot.count(),
    ]);
  }

  /** Stripe webhooks identify a tenant by its Stripe customer, not by `tenant_id`. */
  findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<TenantSubscription | null> {
    return this.prisma.tenantSubscription.findFirst({
      where: { stripeCustomerId },
    });
  }

  /** Called by the Stripe webhook handlers (step 14), never mid-request. */
  setStatus(
    tenantId: number,
    status: SubscriptionStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    return client.tenantSubscription.update({
      where: { tenantId },
      data: { status },
    });
  }

  /** Rolls the billing cycle forward (step 14's renewal job / payment-succeeded webhook). */
  setPeriod(
    tenantId: number,
    periodStart: Date,
    periodEnd: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    return client.tenantSubscription.update({
      where: { tenantId },
      data: { periodStart, periodEnd },
    });
  }

  /**
   * `plan_id = pending_plan_id`, clears both pending columns — a no-op when
   * nothing is pending. Only ever called from the renewal job, never mid-cycle.
   */
  async applyPendingPlan(
    tenantId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    const current = await client.tenantSubscription.findUniqueOrThrow({
      where: { tenantId },
    });
    if (current.pendingPlanId === null) return current;
    return client.tenantSubscription.update({
      where: { tenantId },
      data: {
        planId: current.pendingPlanId,
        pendingPlanId: null,
        pendingPlanEffectiveAt: null,
      },
    });
  }
}
