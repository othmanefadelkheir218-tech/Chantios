import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class FindUserHandler {
  constructor(
    @InjectPinoLogger(FindUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute(id: number) {
    const user = await this.users.findById(id);
    if (!user) {
      this.logger.warn(`User ${id} not found`);
      throw new NotFoundException('User not found');
    }
    return toUserEntity(user);
  }
}
