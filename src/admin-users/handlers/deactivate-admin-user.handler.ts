import { Injectable, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AUDIT_SKIP_KEY } from '../../audit/helpers/audit.helper';
import { SessionsService } from '../../sessions/sessions.service';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class DeactivateAdminUserHandler {
  constructor(
    @InjectPinoLogger(DeactivateAdminUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
    private readonly sessions: SessionsService,
    private readonly cls: ClsService,
  ) {}

  /** Never a hard delete: the row stays, `is_active` goes to false. */
  async execute(id: number): Promise<void> {
    this.logger.info(`Deactivating admin user ${id}`);

    const admin = await this.admins.findById(id);
    if (!admin) {
      this.logger.warn(`Cannot deactivate admin user: ${id} not found`);
      throw new NotFoundException('Admin user not found');
    }
    if (!admin.isActive) {
      // Already inactive: nothing changed, so nothing to put in the history.
      this.cls.set(AUDIT_SKIP_KEY, true);
      return;
    }

    await this.admins.deactivate(id);
    await this.sessions.revokeAllForAdmin(id);
    this.logger.info(`Admin user deactivated: ${id}`);
  }
}
