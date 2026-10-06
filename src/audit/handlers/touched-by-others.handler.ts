import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditRepository } from '../repositories/audit.repository';

/**
 * "Did anyone other than `ownerUserId` touch this entity?" — read from the
 * audit trail, so no extra `updated_by` column is needed.
 */
@Injectable()
export class TouchedByOthersHandler {
  constructor(
    @InjectPinoLogger(TouchedByOthersHandler.name)
    private readonly logger: PinoLogger,
    private readonly audit: AuditRepository,
  ) {}

  async execute(
    tenantId: number,
    entityType: string,
    entityId: number,
    ownerUserId: number,
  ): Promise<boolean> {
    const count = await this.audit.countByOtherActors(
      tenantId,
      entityType,
      entityId,
      ownerUserId,
    );
    this.logger.debug(
      `${entityType} ${entityId}: ${count} audit row(s) by someone other than user ${ownerUserId}`,
    );
    return count > 0;
  }
}
