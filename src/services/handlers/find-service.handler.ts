import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toServiceEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

@Injectable()
export class FindServiceHandler {
  constructor(
    @InjectPinoLogger(FindServiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
  ) {}

  async execute(id: number) {
    const service = await this.services.findById(id);
    if (!service) {
      this.logger.warn(`Service not found: ${id}`);
      throw new NotFoundException('Service not found');
    }
    return toServiceEntity(service);
  }

  /**
   * Quote and invoice lines name a `service_id`; the FK alone does not stop
   * another company's id. Every id must be a service of THIS company —
   * archived ones are accepted, so a draft whose service was archived later
   * can still be saved (doc/notes/catalogue-stock-tables-and-cost-storage.md
   * § Picking a service).
   */
  async assertBelongToTenant(ids: Array<number | null | undefined>) {
    const wanted = [
      ...new Set(ids.filter((id): id is number => typeof id === 'number')),
    ];
    if (wanted.length === 0) return;
    const found = new Set(await this.services.findExistingIds(wanted));
    const missing = wanted.filter((id) => !found.has(id));
    if (missing.length > 0) {
      this.logger.warn(
        `Unknown service id(s) on document lines: ${missing.join(', ')}`,
      );
      throw new BadRequestException(`Service not found: ${missing.join(', ')}`);
    }
  }
}
