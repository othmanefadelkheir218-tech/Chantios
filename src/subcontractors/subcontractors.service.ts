import { Injectable } from '@nestjs/common';
import { SubcontractorContract } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { FindContractsQueryDto } from './dto/find-contracts-query.dto';
import { FindSubcontractorsQueryDto } from './dto/find-subcontractors-query.dto';
import { SetContractStatusDto } from './dto/set-contract-status.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { ArchiveSubcontractorHandler } from './handlers/archive-subcontractor.handler';
import { CreateContractHandler } from './handlers/create-contract.handler';
import { CreateSubcontractorHandler } from './handlers/create-subcontractor.handler';
import { FindContractsHandler } from './handlers/find-contracts.handler';
import { FindSubcontractorsHandler } from './handlers/find-subcontractors.handler';
import { SetContractStatusHandler } from './handlers/set-contract-status.handler';
import { UpdateContractHandler } from './handlers/update-contract.handler';
import { UpdateSubcontractorHandler } from './handlers/update-subcontractor.handler';
import { ContractRepository } from './repositories/contract.repository';
import { SubcontractorRepository } from './repositories/subcontractor.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class SubcontractorsService {
  constructor(
    private readonly subcontractors: SubcontractorRepository,
    private readonly contracts: ContractRepository,
    private readonly createSubcontractor: CreateSubcontractorHandler,
    private readonly findSubcontractors: FindSubcontractorsHandler,
    private readonly updateSubcontractor: UpdateSubcontractorHandler,
    private readonly archiveSubcontractor: ArchiveSubcontractorHandler,
    private readonly createContract: CreateContractHandler,
    private readonly findContracts: FindContractsHandler,
    private readonly updateContract: UpdateContractHandler,
    private readonly setContractStatus: SetContractStatusHandler,
  ) {}

  // ---- Directory ----

  create(dto: CreateSubcontractorDto, actor: AuthenticatedUser) {
    return this.createSubcontractor.execute(dto, actor);
  }

  findAll(query: FindSubcontractorsQueryDto) {
    return this.findSubcontractors.execute(query);
  }

  findOne(id: number) {
    return this.findSubcontractors.findOne(id);
  }

  update(id: number, dto: UpdateSubcontractorDto, actor: AuthenticatedUser) {
    return this.updateSubcontractor.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveSubcontractor.execute(id, actor);
  }

  // ---- Contracts ----

  createNewContract(dto: CreateContractDto, actor: AuthenticatedUser) {
    return this.createContract.execute(dto, actor);
  }

  findAllContracts(query: FindContractsQueryDto) {
    return this.findContracts.execute(query);
  }

  findContractsOfSubcontractor(
    subcontractorId: number,
    query: FindContractsQueryDto,
  ) {
    return this.findContracts.execute(query, subcontractorId);
  }

  updateExistingContract(
    id: number,
    dto: UpdateContractDto,
    actor: AuthenticatedUser,
  ) {
    return this.updateContract.execute(id, dto, actor);
  }

  changeContractStatus(
    id: number,
    dto: SetContractStatusDto,
    actor: AuthenticatedUser,
  ) {
    return this.setContractStatus.execute(id, dto, actor);
  }

  // ---- Internal API for other modules (`purchase-invoices`) ----

  /** The raw contract row, scoped to the current tenant, or `null`. */
  findContractByIdRaw(id: number): Promise<SubcontractorContract | null> {
    return this.contracts.findById(id);
  }

  /** The `max_subcontractors` billing dimension (step 14). */
  countActive(): Promise<number> {
    return this.subcontractors.countActive();
  }
}
