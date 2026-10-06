import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { CreateContractDto } from '../dto/create-contract.dto';
import {
  assertDateOrder,
  assertNonNegativeAmount,
  toContractEntity,
} from '../helpers/contract.helper';
import { ContractRepository } from '../repositories/contract.repository';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';

/**
 * `POST /api/contracts` — `project_id` required (DTO). The project must
 * belong to this tenant and not be `cancelled`; the subcontractor must exist
 * and be active; `end_date` not before `start_date`. Starts `in_progress`.
 * The same subcontractor on a second project is a NEW contract — the
 * directory row is reused.
 */
@Injectable()
export class CreateContractHandler {
  constructor(
    @InjectPinoLogger(CreateContractHandler.name)
    private readonly logger: PinoLogger,
    private readonly contracts: ContractRepository,
    private readonly subcontractors: SubcontractorRepository,
    private readonly projects: ProjectsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateContractDto, actor: AuthenticatedUser) {
    this.logger.info(
      `Creating contract: subcontractor ${dto.subcontractor_id}, project ${dto.project_id}`,
    );

    assertNonNegativeAmount(dto.amount_excl_vat);
    assertDateOrder(dto.start_date, dto.end_date);

    const subcontractor = await this.subcontractors.findById(
      dto.subcontractor_id,
    );
    if (!subcontractor || !subcontractor.isActive) {
      this.logger.warn(
        `Cannot create contract: subcontractor ${dto.subcontractor_id} not found or archived`,
      );
      throw new BadRequestException('Subcontractor not found or archived');
    }

    // Throws NotFoundException if the project does not belong to this tenant.
    const project = await this.projects.findOne(dto.project_id);
    if (project.status === 'cancelled') {
      this.logger.warn(
        `Cannot create contract: project ${dto.project_id} is cancelled`,
      );
      throw new BadRequestException(
        'Cannot create a contract on a cancelled project',
      );
    }

    const created = await this.contracts.create({
      tenantId: actor.tenantId,
      subcontractorId: dto.subcontractor_id,
      projectId: dto.project_id,
      description: dto.description ?? null,
      amountExclVat: dto.amount_excl_vat,
      status: 'in_progress',
      ...(dto.start_date && { startDate: new Date(dto.start_date) }),
      ...(dto.end_date && { endDate: new Date(dto.end_date) }),
      createdBy: actor.userId,
    });
    const entity = toContractEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'subcontractor_contract',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Contract created: ${created.id}`);
    return entity;
  }
}
