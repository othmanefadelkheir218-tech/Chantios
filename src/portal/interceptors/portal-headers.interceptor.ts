import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';

/**
 * Sets the two headers on a portal response. Called by the guard too, so an
 * answer the guard refuses (`403`) carries them as well — an interceptor never
 * runs when a guard throws.
 */
export function setPortalHeaders(res: Response): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

/**
 * The token is IN the URL, so it ends up in logs and browser history. These two
 * headers keep it from spreading further: nothing a portal route returns is
 * cached (it is one client's private data), and no `Referer` is sent when the
 * client follows a link out of the page (the token would go with it).
 */
@Injectable()
export class PortalHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    setPortalHeaders(res);
    return next.handle();
  }
}
