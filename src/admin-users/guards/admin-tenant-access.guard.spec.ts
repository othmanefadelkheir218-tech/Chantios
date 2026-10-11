import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminUsersService } from '../admin-users.service';
import { AdminTenantAccessGuard } from './admin-tenant-access.guard';

const contextFor = (user?: { id: number; role: string }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('AdminTenantAccessGuard', () => {
  const adminUsers = { findByIdRaw: jest.fn() };
  const guard = new AdminTenantAccessGuard(
    adminUsers as unknown as AdminUsersService,
  );

  beforeEach(() => jest.resetAllMocks());

  it('a super_admin always passes, with no database read', async () => {
    await expect(
      guard.canActivate(contextFor({ id: 1, role: 'super_admin' })),
    ).resolves.toBe(true);
    expect(adminUsers.findByIdRaw).not.toHaveBeenCalled();
  });

  it('a staff admin without the right is refused', async () => {
    adminUsers.findByIdRaw.mockResolvedValue({
      id: 2,
      isActive: true,
      canManageTenants: false,
    });
    await expect(
      guard.canActivate(contextFor({ id: 2, role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('a staff admin with the right passes', async () => {
    adminUsers.findByIdRaw.mockResolvedValue({
      id: 2,
      isActive: true,
      canManageTenants: true,
    });
    await expect(
      guard.canActivate(contextFor({ id: 2, role: 'staff' })),
    ).resolves.toBe(true);
  });

  it('the right is read from the database, so taking it away works at once', async () => {
    adminUsers.findByIdRaw
      .mockResolvedValueOnce({ id: 2, isActive: true, canManageTenants: true })
      .mockResolvedValueOnce({
        id: 2,
        isActive: true,
        canManageTenants: false,
      });
    const ctx = contextFor({ id: 2, role: 'staff' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('a deactivated staff admin is refused even with the right', async () => {
    adminUsers.findByIdRaw.mockResolvedValue({
      id: 2,
      isActive: false,
      canManageTenants: true,
    });
    await expect(
      guard.canActivate(contextFor({ id: 2, role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('an admin that no longer exists is refused', async () => {
    adminUsers.findByIdRaw.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextFor({ id: 9, role: 'staff' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('a request with no user is refused as not authenticated', async () => {
    await expect(guard.canActivate(contextFor(undefined))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
