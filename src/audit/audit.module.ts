import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { FindAuditLogsHandler } from './handlers/find-audit-logs.handler';
import { TouchedByOthersHandler } from './handlers/touched-by-others.handler';
import { WriteAuditLogHandler } from './handlers/write-audit-log.handler';
import { AuditRepository } from './repositories/audit.repository';

@Module({
  imports: [TokenModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditRepository,
    AuditInterceptor,
    WriteAuditLogHandler,
    FindAuditLogsHandler,
    TouchedByOthersHandler,
  ],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
