import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class RestoreTenantsHandler {
  constructor(
    @InjectPinoLogger(RestoreTenantsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(ids: number[]) {
    this.logger.info(`Restoring ${ids.length} tenant(s)`);

    const count = await this.tenants.restoreMany(ids);

    this.logger.info(`${count} of ${ids.length} tenant(s) restored`);
    return { count };
  }
}
