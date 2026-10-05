import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class DeactivateAdminUserHandler {
  constructor(
    @InjectPinoLogger(DeactivateAdminUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
  ) {}

  /** Never a hard delete: the row stays, `is_active` goes to false. */
  async execute(id: number): Promise<void> {
    this.logger.info(`Deactivating admin user ${id}`);

    if (!(await this.admins.findById(id))) {
      this.logger.warn(`Cannot deactivate admin user: ${id} not found`);
      throw new NotFoundException('Admin user not found');
    }

    // TODO: step 02 — also revoke every refresh token of this admin.
    await this.admins.deactivate(id);
    this.logger.info(`Admin user deactivated: ${id}`);
  }
}
