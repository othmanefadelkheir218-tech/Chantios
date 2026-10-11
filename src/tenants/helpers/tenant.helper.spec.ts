import { buildTenantFilter } from './tenant.helper';

describe('buildTenantFilter — live vs deleted tenants', () => {
  it('lists only live tenants by default', () => {
    expect(buildTenantFilter()).toEqual({ deletedAt: null });
  });

  it('lists only soft-deleted tenants with deleted = true', () => {
    expect(buildTenantFilter(undefined, 'active', true)).toEqual({
      deletedAt: { not: null },
      status: 'active',
    });
  });

  it('keeps the search with the deleted filter', () => {
    const where = buildTenantFilter('dupont', undefined, true);
    expect(where.deletedAt).toEqual({ not: null });
    expect(where.OR).toHaveLength(4);
  });
});
