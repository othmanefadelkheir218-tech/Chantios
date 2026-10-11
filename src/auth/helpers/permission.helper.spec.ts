import { defaultPermission, resolvePermission } from './permission.helper';

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
