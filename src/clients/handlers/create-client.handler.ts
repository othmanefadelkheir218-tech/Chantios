import { ConflictException, Injectable } from '@nestjs/common';
import { ClientType, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateClientDto } from '../dto/create-client.dto';
import {
  assertVatNumberForType,
  toClientEntity,
} from '../helpers/clients.helper';
import { ClientRepository } from '../repositories/client.repository';

/**
 * `POST /api/clients` — `email` unique within the tenant, `vat_number`
 * required for `type = 'professional'`, `phone` format (DTO-level).
 */
@Injectable()
export class CreateClientHandler {
  constructor(
    @InjectPinoLogger(CreateClientHandler.name)
    private readonly logger: PinoLogger,
    private readonly clients: ClientRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateClientDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating client ${dto.name}`);

    const type = dto.type ?? ClientType.individual;
    assertVatNumberForType(type, dto.vat_number);

    const existing = await this.clients.findByEmail(dto.email);
    if (existing) {
      this.logger.warn(
        `Cannot create client: email ${dto.email} already used in this tenant`,
      );
      throw new ConflictException('A client with this email already exists');
    }

    const created = await this.clients.create({
      ...toCamelKeys<Prisma.ClientUncheckedCreateInput>(dto),
      tenantId: actor.tenantId,
      type,
    });
    const entity = toClientEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'client',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Client created: ${created.id}`);
    return entity;
  }
}
