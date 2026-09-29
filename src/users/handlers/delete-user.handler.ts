import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from '../repositories/user.repository';
import { FindUserHandler } from './find-user.handler';

@Injectable()
export class DeleteUserHandler {
  constructor(
    @InjectPinoLogger(DeleteUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
    private readonly findUser: FindUserHandler,
  ) {}

  async execute(id: string) {
    this.logger.info(`Deleting user: ${id}`);
    await this.findUser.execute(id); // throws 404 if missing
    await this.users.delete(id);
    this.logger.info(`User deleted: ${id}`);
  }
}
