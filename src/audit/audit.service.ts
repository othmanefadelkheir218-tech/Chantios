import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';
import { FindAuditLogsHandler } from './handlers/find-audit-logs.handler';
import { TouchedByOthersHandler } from './handlers/touched-by-others.handler';
import { WriteAuditLogHandler } from './handlers/write-audit-log.handler';
import { AuditEntry } from './helpers/audit.helper';

/** The public door of the audit module: other modules call `write()`. */
@Injectable()
export class AuditService {
  constructor(
    private readonly writeLog: WriteAuditLogHandler,
    private readonly findLogs: FindAuditLogsHandler,
    private readonly touchedByOthers: TouchedByOthersHandler,
  ) {}

  /** `tx` — lets a caller keep this write inside its own transaction. */
  write(entry: AuditEntry, tx?: Prisma.TransactionClient) {
    return this.writeLog.execute(entry, tx);
  }

  findAll(query: FindAuditLogsQueryDto) {
    return this.findLogs.execute(query);
  }

  /** True if anyone other than `ownerUserId` has an audit row on this entity. */
  wasTouchedByOthers(
    tenantId: number,
    entityType: string,
    entityId: number,
    ownerUserId: number,
  ): Promise<boolean> {
    return this.touchedByOthers.execute(
      tenantId,
      entityType,
      entityId,
      ownerUserId,
    );
  }
}
