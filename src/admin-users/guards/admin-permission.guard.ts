import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminUsersService } from '../admin-users.service';

/** The `admin_users` columns a super_admin can switch on for a staff admin. */
export type AdminPermission = 'canManageBilling' | 'canManageTenants';

/**
 * Builds a guard that narrows a platform WRITE route. Runs after
 * `AdminAuthGuard` (which sets `req.user`). A `super_admin` always passes; a
 * `staff` admin passes only while the given `admin_users` flag is true. The
 * flag is read from the database on every call, not from the token, so taking
 * the right away works at once. One implementation for every such right.
 */
export function createAdminPermissionGuard(
  permission: AdminPermission,
): Type<CanActivate> {
  @Injectable()
  class AdminPermissionGuard implements CanActivate {
    constructor(private readonly adminUsers: AdminUsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      const user = (req as unknown as { user?: { id: number; role: string } })
        .user;
      if (!user) throw new UnauthorizedException('Not authenticated');

      if (user.role === 'super_admin') return true;

      const admin = await this.adminUsers.findByIdRaw(user.id);
      if (admin?.isActive && admin[permission]) return true;

      throw new ForbiddenException('Not allowed for your admin role');
    }
  }
  return AdminPermissionGuard;
}
