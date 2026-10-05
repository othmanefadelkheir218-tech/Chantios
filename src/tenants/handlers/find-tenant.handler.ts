import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class FindTenantHandler {
  constructor(
    @InjectPinoLogger(FindTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(id: number) {
    this.logger.debug(`Finding tenant ${id}`);

    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      this.logger.warn(`Tenant not found: ${id}`);
      throw new NotFoundException('Tenant not found');
    }
    return toTenantEntity(tenant);
  }
}
