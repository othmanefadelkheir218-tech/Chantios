import {
  defaultPermission,
  isNeverGranted,
  resolvePermission,
} from './permission.helper';

describe('default permission matrix — the worker', () => {
  it.each(['tasks', 'reports'] as const)(
    'worker %s: view own rows only, no create / edit / delete',
    (module) => {
      expect(defaultPermission('worker', module)).toEqual({
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'own',
      });
    },
  );

  it.each(['time_entries', 'media', 'chat'] as const)(
    'worker %s: works on own rows (log hours, upload, write)',
    (module) => {
      expect(defaultPermission('worker', module)).toEqual({
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        scope: 'own',
      });
    },
  );

  it('a tenant override still wins over the default', () => {
    expect(
      resolvePermission('worker', 'tasks', [
        {
          module: 'tasks',
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
          scope: 'own',
        },
      ]).canCreate,
    ).toBe(true);
  });
});

describe('default permission matrix — "Connecter un Gmail" (email_gmail)', () => {
  it('admin only by default: the admin may connect a Gmail', () => {
    expect(defaultPermission('admin', 'email_gmail').canCreate).toBe(true);
  });

  it.each([
    'manager',
    'sales',
    'accountant',
    'site_supervisor',
    'team_leader',
  ] as const)(
    '%s: no Gmail connect by default (but email stays as it is)',
    (role) => {
      expect(defaultPermission(role, 'email_gmail').canCreate).toBe(false);
    },
  );

  it('manager and sales still answer clients (email full)', () => {
    expect(defaultPermission('manager', 'email').canCreate).toBe(true);
    expect(defaultPermission('sales', 'email').canCreate).toBe(true);
  });

  it('the admin can grant it to a role through an override', () => {
    const resolved = resolvePermission('manager', 'email_gmail', [
      {
        module: 'email_gmail',
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      } as never,
    ]);
    expect(resolved.canCreate).toBe(true);
  });

  it('the worker can never get it', () => {
    expect(isNeverGranted('worker', 'email_gmail')).toBe(true);
  });
});
