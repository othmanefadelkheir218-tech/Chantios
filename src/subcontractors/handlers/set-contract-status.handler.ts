import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SetContractStatusDto } from '../dto/set-contract-status.dto';
import {
  canTransitionContract,
  toContractEntity,
} from '../helpers/contract.helper';
import { ContractRepository } from '../repositories/contract.repository';

/** `PATCH /api/contracts/:id/status` — `in_progress` → `completed` / `cancelled`; both are final. */
@Injectable()
export class SetContractStatusHandler {
  constructor(
    @InjectPinoLogger(SetContractStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly contracts: ContractRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: SetContractStatusDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Setting contract ${id} status to ${dto.status}`);

    const current = await this.contracts.findById(id);
    if (!current) {
      this.logger.warn(`Cannot change contract status: ${id} not found`);
      throw new NotFoundException('Contract not found');
    }

    if (!canTransitionContract(current.status, dto.status)) {
      this.logger.warn(
        `Refused contract ${id} transition ${current.status} -> ${dto.status}`,
      );
      throw new BadRequestException(
        `A contract cannot go from ${current.status} to ${dto.status}`,
      );
    }

    const updated = await this.contracts.setStatus(id, dto.status);
    const entity = toContractEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'status_change',
      entityType: 'subcontractor_contract',
      entityId: id,
      oldValue: { status: current.status },
      newValue: { status: updated.status },
      ipAddress: null,
    });
    this.logger.info(`Contract ${id} is now ${updated.status}`);
    return entity;
  }
}
