import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UsersService } from '../../users/users.service';
import { AddMemberDto } from '../dto/add-member.dto';
import { toConversationEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * `POST /api/conversations/:id/members` — `internal` conversations only (a
 * project thread's members are the portal's business, a support thread's the
 * platform's). The caller must be a member; the new one must be an ACTIVE
 * user of THIS tenant, so a user of another company is refused. Adding the
 * same person twice is refused (`uq_member_user` backs it up).
 */
@Injectable()
export class AddMemberHandler {
  constructor(
    @InjectPinoLogger(AddMemberHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly access: CheckAccessHandler,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: AddMemberDto, actor: AuthenticatedUser) {
    const conversation = await this.access.assertMember(id, {
      userId: actor.userId,
    });
    if (conversation.type !== 'internal') {
      throw new BadRequestException(
        'Members can only be added to an internal conversation',
      );
    }

    const user = await this.users.findActiveInTenant(
      dto.user_id,
      actor.tenantId,
    );
    if (!user) {
      this.logger.warn(
        `Cannot add user ${dto.user_id} to conversation ${id}: not an active user of tenant ${actor.tenantId}`,
      );
      throw new BadRequestException(
        `User ${dto.user_id} is not an active user of this company`,
      );
    }

    const added = await this.conversations.addMember(id, actor.tenantId, {
      userId: dto.user_id,
    });
    if (!added) {
      throw new ConflictException('This user is already a member');
    }

    const updated = await this.access.assertMember(id, {
      userId: actor.userId,
    });
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'add_member',
      entityType: 'conversation',
      entityId: id,
      newValue: { userId: dto.user_id },
      ipAddress: null,
    });
    this.logger.info(`User ${dto.user_id} added to conversation ${id}`);
    return toConversationEntity(updated);
  }
}
