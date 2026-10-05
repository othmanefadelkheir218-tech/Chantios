import { Injectable } from '@nestjs/common';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';
import { FindAuditLogsHandler } from './handlers/find-audit-logs.handler';
import { WriteAuditLogHandler } from './handlers/write-audit-log.handler';
import { AuditEntry } from './helpers/audit.helper';

/** The public door of the audit module: other modules call `write()`. */
@Injectable()
export class AuditService {
  constructor(
    private readonly writeLog: WriteAuditLogHandler,
    private readonly findLogs: FindAuditLogsHandler,
  ) {}

  write(entry: AuditEntry) {
    return this.writeLog.execute(entry);
  }

  findAll(query: FindAuditLogsQueryDto) {
    return this.findLogs.execute(query);
  }
}
