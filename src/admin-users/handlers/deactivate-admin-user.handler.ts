import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionsService } from '../../sessions/sessions.service';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class DeactivateAdminUserHandler {
  constructor(
    @InjectPinoLogger(DeactivateAdminUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
    private readonly sessions: SessionsService,
  ) {}

  /** Never a hard delete: the row stays, `is_active` goes to false. */
  async execute(id: number): Promise<void> {
    this.logger.info(`Deactivating admin user ${id}`);

    if (!(await this.admins.findById(id))) {
      this.logger.warn(`Cannot deactivate admin user: ${id} not found`);
      throw new NotFoundException('Admin user not found');
    }

    await this.admins.deactivate(id);
    await this.sessions.revokeAllForAdmin(id);
    this.logger.info(`Admin user deactivated: ${id}`);
  }
}
