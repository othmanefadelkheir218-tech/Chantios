import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';
import { Observable, tap } from 'rxjs';
import { getRequestActor } from '../common/decorators/actor.decorator';
import { AuditService } from './audit.service';
import { AUDIT_LOG_KEY, AuditLogMeta } from './decorators/audit-log.decorator';
import { AUDIT_SKIP_KEY, asIdOrNull } from './helpers/audit.helper';

/**
 * Writes one `audit_logs` row after a successful route marked `@AuditLog()`.
 * Use it where the route has no old value to record. Handlers that know the
 * old value (tenant update, tenant status) write the log themselves.
 * A failure to write the log is logged, never thrown: the action already happened.
 * A handler that changed nothing sets `AUDIT_SKIP_KEY` and no row is written.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(AuditInterceptor.name)
    private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditLogMeta | undefined>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      tap((result: unknown) => {
        if (this.cls.get<boolean | undefined>(AUDIT_SKIP_KEY)) return;
        const resultId = (result as { id?: unknown } | null)?.id;
        const params = req.params as Record<string, string | undefined>;
        const actor = getRequestActor(req);
        this.audit
          .write({
            tenantId: asIdOrNull(params.tenantId),
            adminUserId: actor.adminUserId,
            action: meta.action,
            entityType: meta.entityType,
            entityId: asIdOrNull(params.id ?? params.tenantId ?? resultId),
            newValue: req.body as unknown,
            ipAddress: actor.ip,
          })
          .catch((error: unknown) =>
            this.logger.error(
              `Failed to write audit log (${meta.action} ${meta.entityType}): ${String(error)}`,
            ),
          );
      }),
    );
  }
}
