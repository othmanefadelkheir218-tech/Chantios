import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AuditService } from './audit.service';
import { ApiFindAuditLogs } from './decorators/audit.swagger';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';

/** Read-only. Writing goes through `AuditService.write()` and `@AuditLog()`. */
@ApiTags('Audit logs')
@Public() // TODO: step 02 — AdminAuthGuard, super_admin
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiFindAuditLogs()
  findAll(@Query() query: FindAuditLogsQueryDto) {
    return this.auditService.findAll(query);
  }
}
