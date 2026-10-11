import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindImportsQueryDto } from '../dto/find-imports-query.dto';
import { toImportBatchEntity } from '../helpers/import-batch.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';

/** `GET /api/imports` (newest first, no errors) and `GET /api/imports/:id` (with errors). */
@Injectable()
export class FindImportsHandler {
  constructor(
    @InjectPinoLogger(FindImportsHandler.name)
    private readonly logger: PinoLogger,
    private readonly batches: ImportBatchRepository,
  ) {}

  async findAll({ page, limit, type, status }: FindImportsQueryDto) {
    this.logger.debug(`Listing imports (page ${page}, limit ${limit})`);
    const [data, total] = await this.batches.findMany(
      { ...(type && { type }), ...(status && { status }) },
      toSkip(page, limit),
      limit,
    );
    return toPaginated(
      data.map((batch) => toImportBatchEntity(batch)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const batch = await this.batches.findById(id);
    if (!batch) {
      this.logger.warn(`Import batch not found: ${id}`);
      throw new NotFoundException('Import not found');
    }
    return toImportBatchEntity(batch, true);
  }
}
