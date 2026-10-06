import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindContractsQueryDto } from '../dto/find-contracts-query.dto';
import {
  buildContractFilter,
  toContractEntity,
} from '../helpers/contract.helper';
import { ContractRepository } from '../repositories/contract.repository';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/**
 * `GET /api/contracts` (`?project_id=&status=`) and
 * `GET /api/subcontractors/:id/contracts` (history across projects).
 */
@Injectable()
export class FindContractsHandler {
  constructor(
    @InjectPinoLogger(FindContractsHandler.name)
    private readonly logger: PinoLogger,
    private readonly contracts: ContractRepository,
    private readonly subcontractors: SubcontractorRepository,
  ) {}

  async execute(
    { page, limit, project_id, status }: FindContractsQueryDto,
    subcontractorId?: number,
  ) {
    this.logger.debug(`Listing contracts (page ${page}, limit ${limit})`);

    if (subcontractorId !== undefined) {
      const subcontractor = await this.subcontractors.findById(subcontractorId);
      if (!subcontractor) {
        this.logger.warn(`Subcontractor ${subcontractorId} not found`);
        throw new NotFoundException('Subcontractor not found');
      }
    }

    const [data, total] = await this.contracts.findMany(
      buildContractFilter(project_id, status, subcontractorId),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toContractEntity), total, page, limit);
  }
}
