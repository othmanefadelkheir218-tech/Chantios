import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toMaterialEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

@Injectable()
export class FindMaterialHandler {
  constructor(
    @InjectPinoLogger(FindMaterialHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async execute(id: number) {
    const material = await this.materials.findById(id);
    if (!material) {
      this.logger.warn(`Material not found: ${id}`);
      throw new NotFoundException('Material not found');
    }
    return toMaterialEntity(material);
  }

  /** Internal API for other modules (`services`, `stock`) — the raw Prisma row. */
  findByIdRaw(id: number) {
    return this.materials.findById(id);
  }
}
