import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { UpdateUserDto } from '../dto/update-user.dto';
import { toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

/** `PATCH /api/users/:id` — admin only: role, hourly_rate, is_active, name, phone. */
@Injectable()
export class UpdateUserHandler {
  constructor(
    @InjectPinoLogger(UpdateUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateUserDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating user ${id}`);

    const current = await this.users.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update user: ${id} not found`);
      throw new NotFoundException('User not found');
    }

    const updated = await this.users.update(
      id,
      toCamelKeys<Prisma.UserUpdateInput>(dto),
    );
    const entity = toUserEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'user',
      entityId: id,
      oldValue: toUserEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`User updated: ${id}`);
    return entity;
  }
}
