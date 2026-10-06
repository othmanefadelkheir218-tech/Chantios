import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';

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
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return next.handle();
  }
}
