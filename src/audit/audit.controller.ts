import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AuditService } from './audit.service';
import { ApiFindAuditLogs } from './decorators/audit.swagger';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';

/** Read-only. Writing goes through `AuditService.write()` and `@AuditLog()`. */
@ApiTags('Audit logs')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin')
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
