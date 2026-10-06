import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { AdminSendSupportMessageDto } from '../dto/admin-send-support-message.dto';
import { ChatGateway } from '../gateways/chat.gateway';
import { toMessageEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';

/**
 * `POST /api/admin/support/:ticketId/messages?tenant_id=` — a platform staff
 * reply, `sender_type = 'admin'`. Same escape hatch as the read: behind
 * `AdminAuthGuard`, explicit `tenantId` on the unwrapped client, the ticket
 * must belong to THAT tenant, and an `audit_logs` row on every call. The
 * message's `tenant_id` is the conversation's, set explicitly. The replying
 * admin becomes a member (idempotent). Then `new_message` goes to the room.
 */
@Injectable()
export class AdminSendSupportMessageHandler {
  constructor(
    @InjectPinoLogger(AdminSendSupportMessageHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly audit: AuditService,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(
    ticketId: number,
    tenantId: number,
    dto: AdminSendSupportMessageDto,
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
    if (conversation.isArchived) {
      throw new BadRequestException('This conversation is archived');
    }
    const content = dto.content.trim();
    if (content.length === 0) {
      throw new BadRequestException('A message cannot be empty');
    }

    await this.conversations.addAdminMemberForAdmin(
      conversation.id,
      tenantId,
      actor.adminUserId,
    );
    const created = await this.messages.createForAdmin({
      tenantId: conversation.tenantId,
      conversationId: conversation.id,
      senderType: 'admin',
      senderId: actor.adminUserId,
      content,
    });
    const entity = toMessageEntity(created);

    await this.audit.write({
      tenantId,
      adminUserId: actor.adminUserId,
      action: 'support_reply',
      entityType: 'conversation',
      entityId: conversation.id,
      newValue: { ticketId, messageId: created.id },
      ipAddress: actor.ip,
    });
    this.gateway.emitNewMessage(conversation.id, entity);
    // TODO: step 13 — notify + email the tenant's members of this support thread
    this.logger.info(
      `Admin ${actor.adminUserId} replied on support ticket ${ticketId} of tenant ${tenantId}`,
    );
    return entity;
  }
}
