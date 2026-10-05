import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashPassword } from '../../common/helpers/password.helper';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { toAdminUserEntity } from '../helpers/admin-user.helper';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class UpdateAdminUserHandler {
  constructor(
    @InjectPinoLogger(UpdateAdminUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
  ) {}

  async execute(id: string, { password, name, role }: UpdateAdminUserDto) {
    this.logger.info(`Updating admin user ${id}`);

    if (!(await this.admins.findById(id))) {
      this.logger.warn(`Cannot update admin user: ${id} not found`);
      throw new NotFoundException('Admin user not found');
    }

    const admin = await this.admins.update(id, {
      ...(name && { name }),
      ...(role && { role }),
      ...(password && { passwordHash: await hashPassword(password) }),
    });
    this.logger.info(`Admin user updated: ${id}`);
    return toAdminUserEntity(admin);
  }
}
