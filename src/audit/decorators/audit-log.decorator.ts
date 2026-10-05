import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit.interceptor';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogMeta {
  action: string;
  entityType: string;
}

/** `@AuditLog('create', 'plan')` — records the call in `audit_logs`. */
export const AuditLog = (action: string, entityType: string) =>
  applyDecorators(
    SetMetadata(AUDIT_LOG_KEY, { action, entityType } satisfies AuditLogMeta),
    UseInterceptors(AuditInterceptor),
  );
