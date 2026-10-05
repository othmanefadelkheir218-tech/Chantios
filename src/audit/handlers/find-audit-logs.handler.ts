import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindAuditLogsQueryDto } from '../dto/find-audit-logs-query.dto';
import { AuditRepository } from '../repositories/audit.repository';

@Injectable()
export class FindAuditLogsHandler {
  constructor(
    @InjectPinoLogger(FindAuditLogsHandler.name)
    private readonly logger: PinoLogger,
    private readonly audit: AuditRepository,
  ) {}

  async execute(query: FindAuditLogsQueryDto) {
    const { page, limit, tenant_id, entity_type, action } = query;
    this.logger.debug(`Listing audit logs (page ${page}, limit ${limit})`);

    const where: Prisma.AuditLogWhereInput = {
      ...(tenant_id && { tenantId: tenant_id }),
      ...(entity_type && { entityType: entity_type }),
      ...(action && { action }),
    };
    const [data, total] = await this.audit.findMany(
      where,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
