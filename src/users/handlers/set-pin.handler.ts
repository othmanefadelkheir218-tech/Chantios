import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { hashPassword } from '../../common/helpers/password.helper';
import { SetPinDto } from '../dto/set-pin.dto';
import { toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

/** `POST /api/users/:id/pin` — admin sets a worker's mobile PIN (argon2id). */
@Injectable()
export class SetPinHandler {
  constructor(
    @InjectPinoLogger(SetPinHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: SetPinDto, actor: AuthenticatedUser) {
    this.logger.info(`Setting mobile PIN for user ${id}`);

    const user = await this.users.findById(id);
    if (!user) {
      this.logger.warn(`Cannot set PIN: user ${id} not found`);
      throw new NotFoundException('User not found');
    }
    if (user.roleId !== 5) {
      this.logger.warn(`Cannot set PIN: user ${id} is not a worker`);
      throw new BadRequestException('A mobile PIN is only for the worker role');
    }

    const mobilePinHash = await hashPassword(dto.pin);
    const updated = await this.users.setMobilePin(id, mobilePinHash);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_pin',
      entityType: 'user',
      entityId: id,
      ipAddress: null,
    });
    this.logger.info(`Mobile PIN set for user ${id}`);
    return toUserEntity(updated);
  }
}
