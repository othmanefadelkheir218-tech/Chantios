import { Prisma } from '@prisma/client';
import type { PinoLogger } from 'nestjs-pino';
import type { PlanRepository } from '../repositories/plan.repository';
import { FindPublicPlansHandler } from './find-public-plans.handler';

describe('FindPublicPlansHandler — step 18', () => {
  const logger = { debug: jest.fn() } as unknown as PinoLogger;
  const plans = { findActiveWithFeatures: jest.fn() };
  const handler = new FindPublicPlansHandler(
    logger,
    plans as unknown as PlanRepository,
  );

  it('returns the active plans without stripe_price_id or parent_plan_id', async () => {
    plans.findActiveWithFeatures.mockResolvedValue([
      {
        id: 3,
        name: 'Pro',
        basePrice: new Prisma.Decimal('50.00'),
        isActive: true,
        isDefault: true,
        stripePriceId: 'price_secret',
        parentPlanId: 1,
        createdAt: new Date(),
        features: [
          {
            id: 9,
            planId: 3,
            featureKey: 'max_workers',
            limitValue: 5,
            overageRate: new Prisma.Decimal('2.00'),
          },
        ],
      },
    ]);

    const [plan] = await handler.execute();
    expect(plan).toEqual({
      id: 3,
      name: 'Pro',
      basePrice: new Prisma.Decimal('50.00'),
      isDefault: true,
      features: [
        {
          featureKey: 'max_workers',
          limitValue: 5,
          overageRate: new Prisma.Decimal('2.00'),
        },
      ],
    });
    expect(plan).not.toHaveProperty('stripePriceId');
    expect(plan).not.toHaveProperty('parentPlanId');
  });

  it('keeps the repository order (cheapest first)', async () => {
    plans.findActiveWithFeatures.mockResolvedValue([
      { id: 1, name: 'A', basePrice: '10', isDefault: false, features: [] },
      { id: 2, name: 'B', basePrice: '20', isDefault: false, features: [] },
    ]);
    const result = await handler.execute();
    expect(result.map((p) => p.id)).toEqual([1, 2]);
  });
});
