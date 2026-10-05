import { BadGatewayException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';

const productsCreate = jest.fn();
const pricesCreate = jest.fn();
const pricesUpdate = jest.fn();

jest.mock('../../config/stripe.config', () => ({
  stripe: {
    products: { create: productsCreate },
    prices: { create: pricesCreate, update: pricesUpdate },
  },
}));

import { ArchivePlanPriceHandler } from './archive-plan-price.handler';
import { CreatePlanPriceHandler } from './create-plan-price.handler';

describe('Stripe plan-price handlers', () => {
  const logger = { info: jest.fn(), error: jest.fn() };
  let createPlanPrice: CreatePlanPriceHandler;
  let archivePlanPrice: ArchivePlanPriceHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [CreatePlanPriceHandler, ArchivePlanPriceHandler];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createPlanPrice = module.get(CreatePlanPriceHandler);
    archivePlanPrice = module.get(ArchivePlanPriceHandler);
  });

  describe('CreatePlanPriceHandler', () => {
    it('creates a Stripe product and a monthly EUR price, and returns the price id', async () => {
      productsCreate.mockResolvedValue({ id: 'prod_123' });
      pricesCreate.mockResolvedValue({ id: 'price_123' });

      const result = await createPlanPrice.execute('Pro', '50.00');

      expect(productsCreate).toHaveBeenCalledWith({ name: 'Pro' });
      expect(pricesCreate).toHaveBeenCalledWith({
        product: 'prod_123',
        currency: 'eur',
        unit_amount: 5000,
        recurring: { interval: 'month' },
      });
      expect(result).toBe('price_123');
    });

    it('throws a BadGatewayException when Stripe fails', async () => {
      productsCreate.mockRejectedValue(new Error('network error'));

      await expect(
        createPlanPrice.execute('Pro', '50.00'),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('ArchivePlanPriceHandler', () => {
    it('archives the price', async () => {
      pricesUpdate.mockResolvedValue({});

      await archivePlanPrice.execute('price_123');

      expect(pricesUpdate).toHaveBeenCalledWith('price_123', {
        active: false,
      });
    });

    it('does nothing when there is no price id', async () => {
      await archivePlanPrice.execute(null);
      expect(pricesUpdate).not.toHaveBeenCalled();
    });

    it('never throws when Stripe fails', async () => {
      pricesUpdate.mockRejectedValue(new Error('network error'));
      await expect(
        archivePlanPrice.execute('price_123'),
      ).resolves.toBeUndefined();
    });
  });
});
