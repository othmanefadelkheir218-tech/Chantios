import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { UpdateClientDto } from '../dto/update-client.dto';
import {
  assertVatNumberForType,
  toClientEntity,
} from '../helpers/clients.helper';
import { ClientRepository } from '../repositories/client.repository';

/** `PATCH /api/clients/:id` — same two rules as create: email uniqueness, vat_number for professional. */
@Injectable()
export class UpdateClientHandler {
  constructor(
    @InjectPinoLogger(UpdateClientHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateClientDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating client ${id}`);

    const current = await this.clients.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update client: ${id} not found`);
      throw new NotFoundException('Client not found');
    }

    const effectiveType = dto.type ?? current.type;
    const effectiveVatNumber =
      dto.vat_number !== undefined ? dto.vat_number : current.vatNumber;
    assertVatNumberForType(effectiveType, effectiveVatNumber);

    if (dto.email && dto.email !== current.email) {
      const existing = await this.clients.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        this.logger.warn(
          `Cannot update client ${id}: email ${dto.email} already used in this tenant`,
        );
        throw new ConflictException('A client with this email already exists');
      }
    }

    const updated = await this.clients.update(
      id,
      toCamelKeys<Prisma.ClientUpdateInput>(dto),
    );
    const entity = toClientEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'client',
      entityId: id,
      oldValue: toClientEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Client updated: ${id}`);
    return entity;
  }
}
