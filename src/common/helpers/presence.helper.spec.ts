import { onlineUserIds } from './presence.helper';

const socket = (identity: unknown) => ({ data: { identity } });

describe('onlineUserIds — who of a company is online', () => {
  it('lists each user once, even with several tabs open', () => {
    const ids = onlineUserIds([
      socket({ kind: 'user', userId: 4, impersonated: false }),
      socket({ kind: 'user', userId: 4, impersonated: false }),
      socket({ kind: 'user', userId: 7, impersonated: false }),
    ]);
    expect(ids.sort()).toEqual([4, 7]);
  });

  it('never counts an impersonation socket or a platform admin', () => {
    const ids = onlineUserIds([
      socket({ kind: 'user', userId: 1, impersonated: true }),
      socket({ kind: 'admin', adminUserId: 2 }),
      { data: undefined },
    ]);
    expect(ids).toEqual([]);
  });
});
