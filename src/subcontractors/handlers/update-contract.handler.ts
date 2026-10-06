import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { assertDateOrder } from '../../common/helpers/date-range.helper';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateContractDto } from '../dto/update-contract.dto';
import {
  assertNonNegativeAmount,
  toContractEntity,
} from '../helpers/contract.helper';
import { ContractRepository } from '../repositories/contract.repository';

/** `PATCH /api/contracts/:id` — dates are checked against the values that would result, not just the ones sent. */
@Injectable()
export class UpdateContractHandler {
  constructor(
    @InjectPinoLogger(UpdateContractHandler.name)
    private readonly logger: PinoLogger,
    private readonly contracts: ContractRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateContractDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating contract ${id}`);

    const current = await this.contracts.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update contract: ${id} not found`);
      throw new NotFoundException('Contract not found');
    }

    if (dto.amount_excl_vat !== undefined) {
      assertNonNegativeAmount(dto.amount_excl_vat);
    }
    assertDateOrder(
      dto.start_date ?? current.startDate,
      dto.end_date ?? current.endDate,
    );

    const data: Prisma.SubcontractorContractUpdateInput = {
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amount_excl_vat !== undefined && {
        amountExclVat: dto.amount_excl_vat,
      }),
      ...(dto.start_date && { startDate: new Date(dto.start_date) }),
      ...(dto.end_date && { endDate: new Date(dto.end_date) }),
    };
    const updated = await this.contracts.update(id, data);
    const entity = toContractEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'subcontractor_contract',
      entityId: id,
      oldValue: toContractEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Contract updated: ${id}`);
    return entity;
  }
}
