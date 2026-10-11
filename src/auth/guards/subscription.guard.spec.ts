import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SubscriptionGuard } from './subscription.guard';

// Step 20 — a blocked company may still read its billing.

describe('SubscriptionGuard', () => {
  const subscriptions = { findByTenant: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new SubscriptionGuard(
    { tenantId: 1 } as unknown as TenantContextService,
    subscriptions as unknown as SubscriptionsService,
    reflector as unknown as Reflector,
  );
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;

  beforeEach(() => jest.resetAllMocks());

  it.each(['trialing', 'active', 'past_due'])('%s passes', async (status) => {
    subscriptions.findByTenant.mockResolvedValue({ status });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('cancelled is blocked on a normal route', async () => {
    subscriptions.findByTenant.mockResolvedValue({ status: 'cancelled' });
    reflector.getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('cancelled passes on a @AllowLapsedSubscription() route (billing read)', async () => {
    subscriptions.findByTenant.mockResolvedValue({ status: 'cancelled' });
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('no subscription at all is blocked, even on a lapsed-allowed route', async () => {
    subscriptions.findByTenant.mockResolvedValue(null);
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
