import { Injectable } from '@nestjs/common';
import { createAdminPermissionGuard } from './admin-permission.guard';

/** Suspend / reactivate a company: `super_admin`, or a staff admin with `can_manage_tenants`. */
@Injectable()
export class AdminTenantAccessGuard extends createAdminPermissionGuard(
  'canManageTenants',
) {}
