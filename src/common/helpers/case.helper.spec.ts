import { Prisma } from '@prisma/client';
import { toCamelKeys, toSnakeKeys } from './case.helper';

describe('case helpers', () => {
  it('turns response keys into snake_case, deep, in arrays', () => {
    expect(
      toSnakeKeys({
        legalName: 'A',
        data: [{ createdAt: 1, planFeature: { limitValue: 5 } }],
      }),
    ).toEqual({
      legal_name: 'A',
      data: [{ created_at: 1, plan_feature: { limit_value: 5 } }],
    });
  });

  it('never touches dates or decimals', () => {
    const date = new Date();
    const price = new Prisma.Decimal('50.00');
    const out = toSnakeKeys<{ base_price: Prisma.Decimal; created_at: Date }>({
      basePrice: price,
      createdAt: date,
    });
    expect(out.base_price).toBe(price);
    expect(out.created_at).toBe(date);
  });

  it('keeps free-form JSON exactly as stored', () => {
    expect(toSnakeKeys({ newValue: { someKey: 1 } })).toEqual({
      new_value: { someKey: 1 },
    });
  });

  it('turns request keys into camelCase', () => {
    expect(
      toCamelKeys({
        legal_name: 'A',
        features: [{ feature_key: 'x', limit_value: 1 }],
      }),
    ).toEqual({
      legalName: 'A',
      features: [{ featureKey: 'x', limitValue: 1 }],
    });
  });
});
