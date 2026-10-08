import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { TenantStatusGuard } from '../guards/tenant-status.guard';
import { TenantGuard } from '../guards/tenant.guard';

/**
 * The full tenant-side pipeline (doc/notes/Phaces/02-auth-users.md):
 * AuthGuard -> TenantGuard -> TenantStatusGuard -> SubscriptionGuard ->
 * PermissionGuard.
 * Add `@Roles(...)` or `@Module(...)` on the route to say who may pass.
 */
export const TenantAuth = () =>
  applyDecorators(
    UseGuards(
      AuthGuard,
      TenantGuard,
      TenantStatusGuard,
      SubscriptionGuard,
      PermissionGuard,
    ),
  );

/**
 * Logged-in user only (own session, own profile): AuthGuard + TenantGuard +
 * TenantStatusGuard. No subscription check — a tenant with a lapsed
 * subscription can still see who it is — but a suspended one is locked out.
 */
export const SessionAuth = () =>
  applyDecorators(UseGuards(AuthGuard, TenantGuard, TenantStatusGuard));
