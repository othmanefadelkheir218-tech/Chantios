import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class CreateUserHandler {
  constructor(
    @InjectPinoLogger(CreateUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute(dto: CreateUserDto) {
    this.logger.info('Creating user');

    if (await this.users.findByPhone(dto.phone)) {
      this.logger.warn('Cannot create user: phone number already used');
      throw new ConflictException(`Phone ${dto.phone} is already used`);
    }

    const user = await this.users.create(dto);
    this.logger.info(`User created: ${user.id}`);
    return user;
  }
}
