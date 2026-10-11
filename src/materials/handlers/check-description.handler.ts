import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { normalizeDescription } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * One description per company (doc/notes/bulk-import.md § Materials import),
 * compared trimmed and lower case, archived rows included. The DB index
 * `uq_materials_tenant_description` is the last guard; this gives the clean
 * `409` first. Used by the create and update forms.
 */
@Injectable()
export class CheckDescriptionHandler {
  constructor(
    @InjectPinoLogger(CheckDescriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async assertFree(description: string, exceptId?: number): Promise<void> {
    const [taken] = await this.materials.findByNormalizedDescriptions([
      normalizeDescription(description),
    ]);
    if (taken && taken.id !== exceptId) {
      this.logger.warn(
        `Material description "${description}" already used by ${taken.id}`,
      );
      throw new ConflictException(
        taken.isActive
          ? 'A material with this description already exists'
          : 'An archived material with this description already exists',
      );
    }
  }
}
