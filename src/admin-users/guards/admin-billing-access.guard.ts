import { Injectable } from '@nestjs/common';
import { createAdminPermissionGuard } from './admin-permission.guard';

/** Plans and billing WRITE routes: `super_admin`, or a staff admin with `can_manage_billing`. */
@Injectable()
export class AdminBillingAccessGuard extends createAdminPermissionGuard(
  'canManageBilling',
) {}
