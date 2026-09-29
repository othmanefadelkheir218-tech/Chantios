import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class FindUserHandler {
  constructor(
    @InjectPinoLogger(FindUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute(id: string) {
    const user = await this.users.findById(id);
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
