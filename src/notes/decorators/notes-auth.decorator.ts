import { applyDecorators, UseGuards } from '@nestjs/common';
import { Module } from '../../auth/decorators/module.decorator';
import { TenantAuth } from '../../auth/decorators/tenant-auth.decorator';
import { NoImpersonationGuard } from '../guards/no-impersonation.guard';

/**
 * Every notes route: the tenant pipeline + the `notes` permission, then no
 * impersonation. On the method, so `NoImpersonationGuard` runs after
 * `AuthGuard` has filled `req.user`.
 */
export const NotesAuth = () =>
  applyDecorators(
    TenantAuth(),
    Module('notes'),
    UseGuards(NoImpersonationGuard),
  );
