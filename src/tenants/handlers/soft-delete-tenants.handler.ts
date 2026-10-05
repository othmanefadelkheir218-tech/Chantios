import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class SoftDeleteTenantsHandler {
  constructor(
    @InjectPinoLogger(SoftDeleteTenantsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(ids: number[]) {
    this.logger.info(`Soft deleting ${ids.length} tenant(s)`);

    const count = await this.tenants.softDeleteMany(ids);

    this.logger.info(`${count} of ${ids.length} tenant(s) soft deleted`);
    return { count };
  }
}
