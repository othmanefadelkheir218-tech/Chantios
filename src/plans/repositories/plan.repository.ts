import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanFeatureData } from '../helpers/plan.helper';

const withFeatures = { features: { orderBy: { featureKey: 'asc' } } } as const;

export type PlanWithFeatures = Prisma.PlanGetPayload<{
  include: typeof withFeatures;
}>;

/** The only place where the plans module talks to the database (plans + plan_features). */
@Injectable()
export class PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One transaction: the plan and all its features. A default clears the old one first. */
  create(
    data: Omit<Prisma.PlanCreateInput, 'features'>,
    features: PlanFeatureData[],
  ): Promise<PlanWithFeatures> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.plan.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.plan.create({
        data: { ...data, features: { create: features } },
        include: withFeatures,
      });
    });
  }

  async findMany(
    where: Prisma.PlanWhereInput,
    skip: number,
    take: number,
  ): Promise<[PlanWithFeatures[], number]> {
    return this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        include: withFeatures,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.plan.count({ where }),
    ]);
  }

  findById(id: number): Promise<PlanWithFeatures | null> {
    return this.prisma.plan.findUnique({
      where: { id },
      include: withFeatures,
    });
  }

  findDefault(): Promise<PlanWithFeatures | null> {
    return this.prisma.plan.findFirst({
      where: { isDefault: true },
      include: withFeatures,
    });
  }

  deactivate(id: number): Promise<PlanWithFeatures> {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
      include: withFeatures,
    });
  }

  /** Clears the previous default in the same transaction: `idx_plans_one_default` allows one. */
  setDefault(id: number): Promise<PlanWithFeatures> {
    return this.prisma.$transaction(async (tx) => {
      await tx.plan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      return tx.plan.update({
        where: { id },
        data: { isDefault: true },
        include: withFeatures,
      });
    });
  }

  /**
   * One transaction: the parent is closed (inactive, no longer default) and
   * the new version is created. If the parent was the default, the new
   * version takes the flag, so signups never find the default missing.
   */
  createVersion(
    parentId: number,
    data: Omit<Prisma.PlanUncheckedCreateInput, 'parentPlanId' | 'isDefault'>,
    features: PlanFeatureData[],
    inheritDefault: boolean,
  ): Promise<PlanWithFeatures> {
    return this.prisma.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id: parentId },
        data: { isActive: false, isDefault: false },
      });
      return tx.plan.create({
        data: {
          ...data,
          parentPlanId: parentId,
          isDefault: inheritDefault,
          features: { create: features },
        },
        include: withFeatures,
      });
    });
  }
}
