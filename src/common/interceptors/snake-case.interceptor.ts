import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { toSnakeKeys } from '../helpers/case.helper';

/** Turns the keys of every response body into snake_case. */
@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((body: unknown) => toSnakeKeys(body)));
  }
}
