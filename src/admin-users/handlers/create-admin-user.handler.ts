import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashPassword } from '../../common/helpers/password.helper';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { toAdminUserEntity } from '../helpers/admin-user.helper';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class CreateAdminUserHandler {
  constructor(
    @InjectPinoLogger(CreateAdminUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
  ) {}

  async execute(dto: CreateAdminUserDto) {
    const email = dto.email.toLowerCase();
    this.logger.info(`Creating admin user ${email} (${dto.role})`);

    if (await this.admins.findByEmail(email)) {
      this.logger.warn(`Cannot create admin user: email ${email} already used`);
      throw new ConflictException(`Email ${email} is already used`);
    }

    const admin = await this.admins.create({
      email,
      name: dto.name,
      role: dto.role,
      passwordHash: await hashPassword(dto.password),
    });
    this.logger.info(`Admin user created: ${admin.id}`);
    return toAdminUserEntity(admin);
  }
}
