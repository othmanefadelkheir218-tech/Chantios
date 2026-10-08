import { ForbiddenException } from '@nestjs/common';
import { TenantStatusGuard } from './tenant-status.guard';

describe('TenantStatusGuard', () => {
  const tenants = { findOne: jest.fn() };
  const context = (tenantId?: number) =>
    new TenantStatusGuard({ tenantId } as never, tenants as never);

  beforeEach(() => jest.resetAllMocks());

  it('lets an active tenant through', async () => {
    tenants.findOne.mockResolvedValue({ status: 'active' });
    await expect(context(1).canActivate()).resolves.toBe(true);
  });

  it.each(['suspended', 'banned'])('blocks a %s tenant', async (status) => {
    tenants.findOne.mockResolvedValue({ status });
    await expect(context(1).canActivate()).rejects.toThrow(
      new ForbiddenException('This company is suspended or banned'),
    );
  });

  it('blocks when no tenant is in context', async () => {
    await expect(context(undefined).canActivate()).rejects.toThrow(
      ForbiddenException,
    );
    expect(tenants.findOne).not.toHaveBeenCalled();
  });
});
