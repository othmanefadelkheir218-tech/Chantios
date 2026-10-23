import { TaxEventsListener } from '../listeners/tax-events.listener';
import { SyncTenantTaxHandler } from './sync-tenant-tax.handler';

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const domestic = {
  vat: {
    kind: 'domestic',
    country: 'BE',
    rate: '21.00',
    stripeTaxRateId: 'txr_be',
  },
  euVatNumber: null,
};

describe('SyncTenantTaxHandler (step 27, C2 / C6)', () => {
  const subscriptions = {
    findByTenant: jest.fn(),
    findCardTenantIds: jest.fn(),
  };
  const tenantVat = { withNumber: jest.fn() };
  const stripe = { syncSubscriptionTax: jest.fn() };
  const handler = new SyncTenantTaxHandler(
    logger as never,
    subscriptions as never,
    tenantVat as never,
    stripe as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    subscriptions.findByTenant.mockResolvedValue({
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    });
    tenantVat.withNumber.mockResolvedValue(domestic);
  });

  it('a card company → its TaxRate on Stripe', async () => {
    await expect(handler.execute(7)).resolves.toBe('synced');
    expect(stripe.syncSubscriptionTax).toHaveBeenCalledWith({
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      taxRateId: 'txr_be',
      reverseCharge: false,
      euVatNumber: null,
    });
  });

  it('no real Stripe customer (dev tools) → nothing', async () => {
    subscriptions.findByTenant.mockResolvedValue({
      stripeCustomerId: 'cus_dev_7',
    });
    await expect(handler.execute(7)).resolves.toBe('no_stripe_customer');
    expect(stripe.syncSubscriptionTax).not.toHaveBeenCalled();
  });

  it('no TVA → Stripe left as it is, reported', async () => {
    tenantVat.withNumber.mockResolvedValue({
      vat: { kind: 'missing', reason: 'no_country' },
      euVatNumber: null,
    });
    await expect(handler.execute(7)).resolves.toBe('missing');
    expect(stripe.syncSubscriptionTax).not.toHaveBeenCalled();
  });

  it('executeAll lists synced / missing / failed, one failure never stops the rest', async () => {
    subscriptions.findCardTenantIds.mockResolvedValue([1, 2, 3]);
    tenantVat.withNumber
      .mockResolvedValueOnce(domestic)
      .mockResolvedValueOnce({
        vat: { kind: 'missing', reason: 'no_country' },
        euVatNumber: null,
      })
      .mockResolvedValueOnce(domestic);
    stripe.syncSubscriptionTax
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('down'));
    await expect(handler.executeAll()).resolves.toEqual({
      synced: [1],
      no_stripe_customer: [],
      missing: [2],
      failed: [3],
    });
  });
});

describe('TaxEventsListener (step 27, C4 / C5)', () => {
  const handlers: Record<string, (payload: never) => Promise<void>> = {};
  const events = {
    on: (name: string, fn: (payload: never) => Promise<void>) =>
      (handlers[name] = fn),
  };
  const subscriptions = { findCardTenantIds: jest.fn() };
  const queue = { add: jest.fn() };
  const listener = new TaxEventsListener(
    logger as never,
    events as never,
    subscriptions as never,
    queue as never,
  );
  listener.onModuleInit();

  beforeEach(() => jest.clearAllMocks());

  it('a company changed → one job for it', async () => {
    await handlers['tenant.tax_profile_changed']({ tenantId: 4 } as never);
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      'sync',
      { tenantId: 4 },
      expect.any(Object),
    );
  });

  it('a rate changed → one job per card company of that country', async () => {
    subscriptions.findCardTenantIds.mockResolvedValue([1, 2]);
    await handlers['vat_rate.changed']({ countryCode: 'BE' } as never);
    expect(subscriptions.findCardTenantIds).toHaveBeenCalledWith('BE');
    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it('Redis down → logged, never thrown', async () => {
    queue.add.mockRejectedValue(new Error('redis'));
    await expect(listener.enqueue([1], 'test')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
