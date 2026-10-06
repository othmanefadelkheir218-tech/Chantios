import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { AdminSupportQueryDto } from '../dto/admin-support-query.dto';
import { toMessageEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';

/**
 * `GET /api/admin/support/:ticketId/messages?tenant_id=` — **the platform
 * admin's cross-tenant read**, the escape hatch decided 2026-10-06
 * (doc/notes/chat-conversations.md).
 *
 * It is behind `AdminAuthGuard`. It reads through the two explicit repository
 * methods that take a `tenantId` and run on the UNWRAPPED client
 * (`findByTicketForAdmin`, `findManyForAdmin`) — the ticket must belong to
 * THAT tenant and be a `support` thread, or nothing is found. And it writes an
 * `audit_logs` row on EVERY call, before it answers: an access with no audit
 * row cannot happen.
 *
 * Text only: a tenant's file attachments are read through the tenant-scoped
 * media module, which a platform admin (no tenant) cannot use.
 */
@Injectable()
export class AdminFindSupportMessagesHandler {
  constructor(
    @InjectPinoLogger(AdminFindSupportMessagesHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    ticketId: number,
    { tenant_id: tenantId, page, limit }: AdminSupportQueryDto,
    actor: RequestActor,
  ) {
    if (actor.adminUserId === null) {
      throw new ForbiddenException('A platform admin session is required');
    }

    const conversation = await this.conversations.findByTicketForAdmin(
      ticketId,
      tenantId,
    );
    if (!conversation) {
      this.logger.warn(
        `Admin ${actor.adminUserId}: no support conversation for ticket ${ticketId} in tenant ${tenantId}`,
      );
      throw new NotFoundException('Support conversation not found');
    }

    const [rows, total] = await this.messages.findManyForAdmin(
      conversation.id,
      tenantId,
      toSkip(page, limit),
      limit,
    );

    await this.audit.write({
      tenantId,
      adminUserId: actor.adminUserId,
      action: 'support_read',
      entityType: 'conversation',
      entityId: conversation.id,
      newValue: { ticketId, page, returned: rows.length },
      ipAddress: actor.ip,
    });
    this.logger.info(
      `Admin ${actor.adminUserId} read support ticket ${ticketId} of tenant ${tenantId} (${rows.length} message(s))`,
    );
    return {
      conversationId: conversation.id,
      ...toPaginated(
        rows.map((row) => toMessageEntity(row)),
        total,
        page,
        limit,
      ),
    };
  }
}
