import { Injectable, NotFoundException } from '@nestjs/common';
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
}
