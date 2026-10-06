import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindSubcontractorsQueryDto } from '../dto/find-subcontractors-query.dto';
import {
  buildSubcontractorFilter,
  toSubcontractorEntity,
} from '../helpers/subcontractor.helper';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/** `GET /api/subcontractors` (`?search=&trade=`) and `GET /api/subcontractors/:id`. */
@Injectable()
export class FindSubcontractorsHandler {
  constructor(
    @InjectPinoLogger(FindSubcontractorsHandler.name)
    private readonly logger: PinoLogger,
    private readonly subcontractors: SubcontractorRepository,
  ) {}

  async execute({
    page,
    limit,
    search,
    trade,
    is_active,
  }: FindSubcontractorsQueryDto) {
    this.logger.debug(`Listing subcontractors (page ${page}, limit ${limit})`);

    const [data, total] = await this.subcontractors.findMany(
      buildSubcontractorFilter(search, trade, is_active),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toSubcontractorEntity), total, page, limit);
  }

  async findOne(id: number) {
    const subcontractor = await this.subcontractors.findById(id);
    if (!subcontractor) {
      this.logger.warn(`Subcontractor ${id} not found`);
      throw new NotFoundException('Subcontractor not found');
    }
    return toSubcontractorEntity(subcontractor);
  }
}
