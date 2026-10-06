import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toConversationEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * `PATCH /api/conversations/:id/archive` — `is_archived = true`. **Never
 * deletes**: history is kept for legal and audit reasons. An archived
 * conversation leaves the default list; its rows stay.
 */
@Injectable()
export class ArchiveConversationHandler {
  constructor(
    @InjectPinoLogger(ArchiveConversationHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly access: CheckAccessHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    const current = await this.access.assertMember(id, {
      userId: actor.userId,
    });
    this.logger.info(`Archiving conversation ${id}`);

    const updated = await this.conversations.setArchived(id, true);
    const entity = toConversationEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'conversation',
      entityId: id,
      oldValue: { isArchived: current.isArchived },
      newValue: { isArchived: true },
      ipAddress: null,
    });
    return entity;
  }
}
