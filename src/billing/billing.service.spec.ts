import { BillingService } from './billing.service';

describe('BillingService.allSnapshots — one tenant or every tenant', () => {
  const subscriptions = { usage: jest.fn(), allUsage: jest.fn() };
  const service = new BillingService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    subscriptions as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('reuses the per-tenant usage list when tenant_id is set', () => {
    const query = { page: 1, limit: 20, tenant_id: 4 };
    void service.allSnapshots(query);
    expect(subscriptions.usage).toHaveBeenCalledWith(4, query);
    expect(subscriptions.allUsage).not.toHaveBeenCalled();
  });

  it('lists every tenant when tenant_id is left out', () => {
    const query = { page: 2, limit: 20 };
    void service.allSnapshots(query);
    expect(subscriptions.allUsage).toHaveBeenCalledWith(query);
    expect(subscriptions.usage).not.toHaveBeenCalled();
  });
});
