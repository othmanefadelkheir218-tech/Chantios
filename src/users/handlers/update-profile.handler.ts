import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

/** `PATCH /api/users/me` — a user updates their own name/phone. */
@Injectable()
export class UpdateProfileHandler {
  constructor(
    @InjectPinoLogger(UpdateProfileHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute(dto: UpdateProfileDto, actor: AuthenticatedUser) {
    this.logger.info(`User ${actor.userId} updating their own profile`);

    const current = await this.users.findById(actor.userId);
    if (!current) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.users.update(actor.userId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });
    return toUserEntity(updated);
  }
}
