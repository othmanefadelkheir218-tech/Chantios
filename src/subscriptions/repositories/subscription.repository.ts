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

  /**
   * Status and grace date together. `graceEndsAt` undefined = left as it is.
   * The rule of WHEN to clear it lives in `SetStatusHandler`.
   */
  setStatusAndGrace(
    tenantId: number,
    status: SubscriptionStatus,
    graceEndsAt: Date | null | undefined,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    const client = tx ?? this.prisma;
    return client.tenantSubscription.update({
      where: { tenantId },
      data: { status, graceEndsAt },
    });
  }

  /** Dev tools only: the four dates, already shifted by the handler. */
  setDates(
    tenantId: number,
    data: Pick<
      Prisma.TenantSubscriptionUpdateInput,
      'periodStart' | 'periodEnd' | 'pendingPlanEffectiveAt' | 'graceEndsAt'
    >,
  ): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.update({
      where: { tenantId },
      data,
    });
  }

  setStripeCustomerId(
    tenantId: number,
    stripeCustomerId: string,
  ): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: { stripeCustomerId },
    });
  }

  /**
   * Moves the date of a waiting plan change. A no-op when no plan is waiting
   * (`pending_plan_id` is null), so it never invents a date.
   */
  movePendingPlanDate(tenantId: number, effectiveAt: Date) {
    return this.prisma.tenantSubscription.updateMany({
      where: { tenantId, pendingPlanId: { not: null } },
      data: { pendingPlanEffectiveAt: effectiveAt },
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

  /** Stripe webhooks for one card subscription (step 21). */
  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<TenantSubscription | null> {
    return this.prisma.tenantSubscription.findFirst({
      where: { stripeSubscriptionId },
    });
  }

  /** Copies a Stripe subscription onto the row: ids, price, period, cancel flag (step 21). */
  setStripeSubscription(
    tenantId: number,
    data: Pick<
      Prisma.TenantSubscriptionUpdateInput,
      | 'stripeSubscriptionId'
      | 'stripePriceId'
      | 'periodStart'
      | 'periodEnd'
      | 'cancelAtPeriodEnd'
    >,
  ): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.update({
      where: { tenantId },
      data,
    });
  }

  /** The card subscription is gone in Stripe: forget it, keep the customer. */
  clearStripeSubscription(tenantId: number): Promise<TenantSubscription> {
    return this.prisma.tenantSubscription.update({
      where: { tenantId },
      data: { stripeSubscriptionId: null, cancelAtPeriodEnd: false },
    });
  }

  // ---- Platform stats (GET /api/admin/stats) ----

  /** Subscriptions of live companies, per status. */
  async countByStatus(): Promise<
    { status: SubscriptionStatus; count: number }[]
  > {
    const rows = await this.prisma.tenantSubscription.groupBy({
      by: ['status'],
      where: { tenant: { deletedAt: null } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }

  /** Live, not-cancelled companies per current plan id. */
  async countByPlan(): Promise<{ planId: number; count: number }[]> {
    const rows = await this.prisma.tenantSubscription.groupBy({
      by: ['planId'],
      where: { tenant: { deletedAt: null }, status: { not: 'cancelled' } },
      _count: { _all: true },
    });
    return rows.map((r) => ({ planId: r.planId, count: r._count._all }));
  }
}
