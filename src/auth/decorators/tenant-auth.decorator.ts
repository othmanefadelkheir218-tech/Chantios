import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { TenantGuard } from '../guards/tenant.guard';

/**
 * The full tenant-side pipeline (doc/notes/Phaces/02-auth-users.md):
 * AuthGuard -> TenantGuard -> SubscriptionGuard -> PermissionGuard.
 * Add `@Roles(...)` or `@Module(...)` on the route to say who may pass.
 */
export const TenantAuth = () =>
  applyDecorators(
    UseGuards(AuthGuard, TenantGuard, SubscriptionGuard, PermissionGuard),
  );

/** Logged-in user only (own session, own profile): AuthGuard + TenantGuard. */
export const SessionAuth = () =>
  applyDecorators(UseGuards(AuthGuard, TenantGuard));
