import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AUDIT_SKIP_KEY } from '../../audit/helpers/audit.helper';
import { CheckCountryHandler } from './check-country.handler';
import { CreateVatRateHandler } from './create-vat-rate.handler';
import { UpdateVatRateHandler } from './update-vat-rate.handler';

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  countryCode: 'BE',
  rate: new Prisma.Decimal('21.00'),
  isEu: true,
  isActive: true,
  stripeTaxRateId: 'txr_old',
  stripeReverseChargeTaxRateId: 'txr_rc',
  ...over,
});

describe('vat-rates handlers (step 27)', () => {
  const repo = {
    findByCountry: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const stripe = { createTaxRate: jest.fn(), archiveTaxRate: jest.fn() };
  const subscriptions = { findCardTenantIds: jest.fn() };
  const events = { emit: jest.fn() };
  const cls = { set: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  // `ModuleRef.get(StripeService)` / `get(SubscriptionsService)`.
  const moduleRef = {
    get: (token: { name: string }) =>
      token.name === 'StripeService' ? stripe : subscriptions,
  };
  const create = new CreateVatRateHandler(
    logger as never,
    repo as never,
    moduleRef as never,
  );
  const update = new UpdateVatRateHandler(
    logger as never,
    repo as never,
    moduleRef as never,
    events as never,
    cls as never,
  );
  const check = new CheckCountryHandler(logger as never, repo as never);

  beforeEach(() => {
    jest.resetAllMocks();
    repo.create.mockImplementation((data: object) => ({ id: 1, ...data }));
    repo.update.mockImplementation((_id: number, data: object) => ({
      ...row(),
      ...data,
      rate: new Prisma.Decimal(String((data as { rate?: string }).rate ?? 21)),
    }));
    subscriptions.findCardTenantIds.mockResolvedValue([]);
  });

  describe('create', () => {
    it('EU country: normal + reverse-charge TaxRates, then the row', async () => {
      stripe.createTaxRate
        .mockResolvedValueOnce('txr_n')
        .mockResolvedValueOnce('txr_r');
      await create.execute({ country_code: 'FR', rate: '20.00' });

      expect(stripe.createTaxRate).toHaveBeenNthCalledWith(1, {
        countryCode: 'FR',
        rate: '20.00',
        reverseCharge: false,
      });
      expect(stripe.createTaxRate).toHaveBeenNthCalledWith(2, {
        countryCode: 'FR',
        rate: '0',
        reverseCharge: true,
      });
      expect(repo.create).toHaveBeenCalledWith({
        countryCode: 'FR',
        rate: '20.00',
        isEu: true,
        stripeTaxRateId: 'txr_n',
        stripeReverseChargeTaxRateId: 'txr_r',
      });
    });

    it('non-EU country: one TaxRate only', async () => {
      stripe.createTaxRate.mockResolvedValueOnce('txr_n');
      await create.execute({ country_code: 'CH', rate: '8.10', is_eu: false });
      expect(stripe.createTaxRate).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ stripeReverseChargeTaxRateId: null }),
      );
    });

    it('409 when the country exists, no Stripe call', async () => {
      repo.findByCountry.mockResolvedValue(row());
      await expect(
        create.execute({ country_code: 'BE', rate: '21' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(stripe.createTaxRate).not.toHaveBeenCalled();
    });

    it('Stripe fails on the 2nd TaxRate → 1st archived, nothing saved', async () => {
      stripe.createTaxRate
        .mockResolvedValueOnce('txr_n')
        .mockRejectedValueOnce(new BadGatewayException());
      await expect(
        create.execute({ country_code: 'FR', rate: '20' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(stripe.archiveTaxRate).toHaveBeenCalledWith('txr_n');
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('404 when the row is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(update.execute(9, { rate: '22' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('new rate → new TaxRate, old archived, re-point event', async () => {
      repo.findById.mockResolvedValue(row());
      stripe.createTaxRate.mockResolvedValue('txr_new');
      await update.execute(1, { rate: '22.00' });

      expect(repo.update).toHaveBeenCalledWith(1, {
        rate: '22.00',
        stripeTaxRateId: 'txr_new',
      });
      expect(stripe.archiveTaxRate).toHaveBeenCalledWith('txr_old');
      expect(events.emit).toHaveBeenCalledWith('vat_rate.changed', {
        countryCode: 'BE',
      });
    });

    it('same rate written differently → nothing, no audit row', async () => {
      repo.findById.mockResolvedValue(row());
      await update.execute(1, { rate: '21' });
      expect(repo.update).not.toHaveBeenCalled();
      expect(cls.set).toHaveBeenCalledWith(AUDIT_SKIP_KEY, true);
    });

    it('close refused (409) while a company pays by card (Q10)', async () => {
      repo.findById.mockResolvedValue(row());
      subscriptions.findCardTenantIds.mockResolvedValue([4]);
      await expect(
        update.execute(1, { is_active: false }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(subscriptions.findCardTenantIds).toHaveBeenCalledWith('BE');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('close allowed with no card company, no re-point event', async () => {
      repo.findById.mockResolvedValue(row());
      await update.execute(1, { is_active: false });
      expect(repo.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('EU flag on → reverse-charge TaxRate made when missing', async () => {
      repo.findById.mockResolvedValue(
        row({ isEu: false, stripeReverseChargeTaxRateId: null }),
      );
      stripe.createTaxRate.mockResolvedValue('txr_rc_new');
      await update.execute(1, { is_eu: true });
      expect(repo.update).toHaveBeenCalledWith(1, {
        isEu: true,
        stripeReverseChargeTaxRateId: 'txr_rc_new',
      });
      expect(events.emit).toHaveBeenCalled();
    });
  });

  describe('country check (Q11)', () => {
    it('accepts an active country', async () => {
      repo.findByCountry.mockResolvedValue(row());
      await expect(check.execute('BE')).resolves.toBeUndefined();
    });

    it.each([null, row({ isActive: false })])(
      'refuses a missing or closed country (%p)',
      async (found) => {
        repo.findByCountry.mockResolvedValue(found);
        await expect(check.execute('US')).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it('accepts the unchanged old value, even closed', async () => {
      await expect(check.execute('US', 'US')).resolves.toBeUndefined();
      expect(repo.findByCountry).not.toHaveBeenCalled();
    });
  });
});
