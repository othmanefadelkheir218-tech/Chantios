import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { PlanRepository } from '../repositories/plan.repository';
import { CreatePlanVersionHandler } from './create-plan-version.handler';
import { CreatePlanHandler } from './create-plan.handler';
import { DeactivatePlanHandler } from './deactivate-plan.handler';
import { SetDefaultPlanHandler } from './set-default-plan.handler';

/** Arguments of every call to a mock, typed. */
const callsOf = (fn: jest.Mock) => fn.mock.calls as unknown[][];

const features = [
  { featureKey: 'max_workers', limitValue: 5, overageRate: '2.00' },
  { featureKey: 'max_managers', limitValue: 2, overageRate: '5.00' },
  { featureKey: 'max_clients', limitValue: 50, overageRate: '0.20' },
  { featureKey: 'max_subcontractors', limitValue: 20, overageRate: '0.20' },
  { featureKey: 'storage_gb', limitValue: 20, overageRate: '0.50' },
  { featureKey: 'retention_days', limitValue: 365, overageRate: '0' },
];
const plan = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Pro',
  basePrice: '50.00',
  isActive: true,
  isDefault: false,
  stripePriceId: 'price_old',
  features,
  ...over,
});

describe('Plans handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    deactivate: jest.fn(),
    setDefault: jest.fn(),
    createVersion: jest.fn(),
  };
  const stripe = {
    createPlanPrice: jest.fn(),
    archivePlanPrice: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreatePlanHandler;
  let deactivate: DeactivatePlanHandler;
  let setDefault: SetDefaultPlanHandler;
  let createVersion: CreatePlanVersionHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    stripe.createPlanPrice.mockResolvedValue('price_new');
    const handlers = [
      CreatePlanHandler,
      DeactivatePlanHandler,
      SetDefaultPlanHandler,
      CreatePlanVersionHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: PlanRepository, useValue: repo },
        { provide: StripeService, useValue: stripe },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreatePlanHandler);
    deactivate = module.get(DeactivatePlanHandler);
    setDefault = module.get(SetDefaultPlanHandler);
    createVersion = module.get(CreatePlanVersionHandler);
  });

  describe('CreatePlanHandler', () => {
    const dto = {
      name: 'Pro',
      base_price: '50.00',
      features: [
        {
          feature_key: 'max_workers' as const,
          limit_value: 5,
          overage_rate: '2.00',
        },
        {
          feature_key: 'max_managers' as const,
          limit_value: 2,
          overage_rate: '5.00',
        },
        {
          feature_key: 'max_clients' as const,
          limit_value: 50,
          overage_rate: '0.20',
        },
        {
          feature_key: 'max_subcontractors' as const,
          limit_value: 20,
          overage_rate: '0.20',
        },
        {
          feature_key: 'storage_gb' as const,
          limit_value: 20,
          overage_rate: '0.50',
        },
        {
          feature_key: 'retention_days' as const,
          limit_value: 365,
          overage_rate: '9.99',
        },
      ],
    };

    it('is never default unless asked', async () => {
      repo.create.mockResolvedValue(plan());
      await create.execute(dto);
      expect(callsOf(repo.create)[0][0]).toMatchObject({ isDefault: false });
    });

    it('creates the Stripe price and stores the returned id', async () => {
      repo.create.mockResolvedValue(plan());
      await create.execute(dto);
      expect(stripe.createPlanPrice).toHaveBeenCalledWith('Pro', '50.00');
      expect(callsOf(repo.create)[0][0]).toMatchObject({
        stripePriceId: 'price_new',
      });
    });

    it('forces the overage of retention_days to 0', async () => {
      repo.create.mockResolvedValue(plan());
      await create.execute(dto);
      const rows = callsOf(repo.create)[0][1] as {
        featureKey: string;
        overageRate: string;
      }[];
      expect(
        rows.find((r) => r.featureKey === 'retention_days')?.overageRate,
      ).toBe('0');
      expect(
        rows.find((r) => r.featureKey === 'max_workers')?.overageRate,
      ).toBe('2.00');
    });

    it('rejects a repeated feature_key', async () => {
      const twice = {
        ...dto,
        features: [dto.features[0], dto.features[0]],
      };
      await expect(create.execute(twice)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
      expect(stripe.createPlanPrice).not.toHaveBeenCalled();
    });

    it('rejects a features list missing one of the 6 required keys', async () => {
      const incomplete = { ...dto, features: dto.features.slice(0, 5) };
      await expect(create.execute(incomplete)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
      expect(stripe.createPlanPrice).not.toHaveBeenCalled();
    });
  });

  describe('DeactivatePlanHandler', () => {
    it('refuses the default plan', async () => {
      repo.findById.mockResolvedValue(plan({ isDefault: true }));
      await expect(deactivate.execute(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.deactivate).not.toHaveBeenCalled();
    });

    it('deactivates a normal plan and archives its Stripe price', async () => {
      repo.findById.mockResolvedValue(plan());
      repo.deactivate.mockResolvedValue(
        plan({ isActive: false, stripePriceId: 'price_old' }),
      );
      await expect(deactivate.execute(1)).resolves.toMatchObject({
        isActive: false,
      });
      expect(stripe.archivePlanPrice).toHaveBeenCalledWith('price_old');
    });

    it('404 when the plan does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(deactivate.execute(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('SetDefaultPlanHandler', () => {
    it('refuses an inactive plan', async () => {
      repo.findById.mockResolvedValue(plan({ isActive: false }));
      await expect(setDefault.execute(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.setDefault).not.toHaveBeenCalled();
    });

    it('moves the default', async () => {
      repo.findById.mockResolvedValue(plan());
      repo.setDefault.mockResolvedValue(plan({ isDefault: true }));
      await expect(setDefault.execute(1)).resolves.toMatchObject({
        isDefault: true,
      });
    });
  });

  describe('CreatePlanVersionHandler', () => {
    it('copies what the request leaves out and passes the default flag on', async () => {
      repo.findById.mockResolvedValue(plan({ isDefault: true }));
      repo.createVersion.mockResolvedValue(plan({ id: 2 }));

      await createVersion.execute(1, { base_price: '60.00' });

      const [parentId, data, rows, inheritDefault] = repo.createVersion.mock
        .calls[0] as [
        number,
        Record<string, unknown>,
        { featureKey: string }[],
        boolean,
      ];
      expect(parentId).toBe(1);
      expect(data).toMatchObject({
        name: 'Pro',
        basePrice: '60.00',
        stripePriceId: 'price_new',
      });
      expect(rows).toHaveLength(6);
      expect(inheritDefault).toBe(true);
      expect(stripe.createPlanPrice).toHaveBeenCalledWith('Pro', '60.00');
      expect(stripe.archivePlanPrice).toHaveBeenCalledWith('price_old');
    });

    it('refuses a plan that is already replaced', async () => {
      repo.findById.mockResolvedValue(plan({ isActive: false }));
      await expect(createVersion.execute(1, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses a sent features list missing one of the 6 required keys', async () => {
      repo.findById.mockResolvedValue(plan());
      await expect(
        createVersion.execute(1, {
          features: [
            {
              feature_key: 'max_workers',
              limit_value: 2,
              overage_rate: '3.00',
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createVersion).not.toHaveBeenCalled();
    });
  });
});
