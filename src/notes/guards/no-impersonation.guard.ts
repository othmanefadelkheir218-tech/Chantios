import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';

/**
 * Notes are private (doc/notes/notes.md): a platform admin who impersonates
 * a user gets `403` here. Runs after `@TenantAuth()` filled `req.user`.
 */
@Injectable()
export class NoImpersonationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as unknown as { user?: AuthenticatedUser }).user;
    if (user?.impersonatedBy !== undefined) {
      throw new ForbiddenException(
        'Notes are private — not open while impersonating',
      );
    }
    return true;
  }
}
