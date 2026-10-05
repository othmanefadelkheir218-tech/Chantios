import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { SessionsService } from '../../sessions/sessions.service';
import { toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

/**
 * `DELETE /api/users/:id` — admin only. `is_active = false` and every one of
 * the user's sessions is revoked, same as suspending a tenant. History is
 * kept (doc/notes/auth-tokens.md).
 */
@Injectable()
export class DeactivateUserHandler {
  constructor(
    @InjectPinoLogger(DeactivateUserHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Deactivating user ${id}`);

    const current = await this.users.findById(id);
    if (!current) {
      this.logger.warn(`Cannot deactivate user: ${id} not found`);
      throw new NotFoundException('User not found');
    }

    const updated = await this.users.setActive(id, false);
    await this.sessions.revokeAllForUser(id);
    const entity = toUserEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'deactivate',
      entityType: 'user',
      entityId: id,
      oldValue: toUserEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`User deactivated and sessions revoked: ${id}`);
    return entity;
  }
}
