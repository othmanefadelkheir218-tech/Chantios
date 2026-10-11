import { AdminTenantAccessGuard } from '../admin-users/guards/admin-tenant-access.guard';
import { TenantsController } from './tenants.controller';

// The method is only read for its metadata, never called.
const guardsOf = (method: keyof TenantsController): unknown[] =>
  // eslint-disable-next-line @typescript-eslint/unbound-method
  (Reflect.getMetadata('__guards__', TenantsController.prototype[method]) ??
    []) as unknown[];

describe('TenantsController — the can_manage_tenants right', () => {
  it.each([
    'setStatus',
    'restore',
    'restoreMany',
    'softDelete',
    'softDeleteMany',
  ])('%s needs super_admin or the can_manage_tenants right', (method) => {
    expect(guardsOf(method as keyof TenantsController)).toContain(
      AdminTenantAccessGuard,
    );
  });

  it.each(['findAll', 'findOne', 'update'])(
    '%s stays open to every platform admin',
    (method) => {
      expect(guardsOf(method as keyof TenantsController)).not.toContain(
        AdminTenantAccessGuard,
      );
    },
  );
});
