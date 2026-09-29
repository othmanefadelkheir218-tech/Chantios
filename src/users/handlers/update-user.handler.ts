import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { FindUserHandler } from './find-user.handler';

@Injectable()
export class UpdateUserHandler {
  constructor(
    @InjectPinoLogger(UpdateUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
    private readonly findUser: FindUserHandler,
  ) {}

  async execute(id: string, dto: UpdateUserDto) {
    this.logger.info(`Updating user: ${id}`);
    const user = await this.findUser.execute(id); // throws 404 if missing

    if (dto.phone && dto.phone !== user.phone) {
      if (await this.users.findByPhone(dto.phone)) {
        this.logger.warn(`Cannot update user ${id}: phone already used`);
        throw new ConflictException(`Phone ${dto.phone} is already used`);
      }
    }

    const updated = await this.users.update(id, dto);
    this.logger.info(`User updated: ${id}`);
    return updated;
  }
}
