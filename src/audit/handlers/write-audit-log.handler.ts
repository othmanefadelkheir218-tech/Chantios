import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toSnakeKeys } from '../../common/helpers/case.helper';
import { AuditEntry, redactSecrets } from '../helpers/audit.helper';
import { AuditRepository } from '../repositories/audit.repository';

@Injectable()
export class WriteAuditLogHandler {
  constructor(
    @InjectPinoLogger(WriteAuditLogHandler.name)
    private readonly logger: PinoLogger,
    private readonly audit: AuditRepository,
  ) {}

  async execute(
    entry: AuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    this.logger.debug(`Writing audit log: ${entry.action} ${entry.entityType}`);
    // One key style in the table: snake_case, like the API. Secrets are hidden.
    await this.audit.write(
      {
        ...entry,
        oldValue: redactSecrets(toSnakeKeys(entry.oldValue)),
        newValue: redactSecrets(toSnakeKeys(entry.newValue)),
      },
      tx,
    );
  }
}
