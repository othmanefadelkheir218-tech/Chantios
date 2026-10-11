import type { TenantSubscription } from '@prisma/client';
import { withListNames } from './subscription-names.helper';

const row = (over: Partial<TenantSubscription>) =>
  ({
    id: 1,
    tenantId: 1,
    planId: 1,
    pendingPlanId: null,
    ...over,
  }) as TenantSubscription;

describe('withListNames — names on the admin subscription list', () => {
  it('adds the company, plan and pending plan names', () => {
    const [out] = withListNames(
      [row({ tenantId: 4, planId: 2, pendingPlanId: 3 })],
      [{ id: 4, name: 'Dupont' }],
      [
        { id: 2, name: 'Pro' },
        { id: 3, name: 'Max' },
      ],
    );
    expect(out).toMatchObject({
      tenantName: 'Dupont',
      planName: 'Pro',
      pendingPlanName: 'Max',
    });
  });

  it('gives null when there is no pending plan, #id when a name is missing', () => {
    const [out] = withListNames([row({ tenantId: 9, planId: 7 })], [], []);
    expect(out).toMatchObject({
      tenantName: '#9',
      planName: '#7',
      pendingPlanName: null,
    });
  });
});
