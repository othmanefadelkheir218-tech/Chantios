import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toMaterialExportEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * `GET /api/materials/export` — every active material, no pagination. The
 * frontend turns it into the `.xlsx` the user fills and imports back
 * (doc/notes/bulk-import.md § The flow).
 */
@Injectable()
export class ExportMaterialsHandler {
  constructor(
    @InjectPinoLogger(ExportMaterialsHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async execute() {
    const rows = await this.materials.findAllActive();
    this.logger.info(`Exporting ${rows.length} materials`);
    return rows.map(toMaterialExportEntity);
  }
}
