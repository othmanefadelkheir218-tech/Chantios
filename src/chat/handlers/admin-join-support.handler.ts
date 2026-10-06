import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * A platform admin joining the LIVE room of a support conversation over the
 * socket. It is a cross-tenant read, so it goes through the explicit
 * `findSupportByIdForAdmin(conversationId, tenantId)` (unwrapped client; the
 * conversation must be a `support` thread of THAT tenant) and writes an
 * `audit_logs` row every time — the same rule as the HTTP read.
 */
@Injectable()
export class AdminJoinSupportHandler {
  constructor(
    @InjectPinoLogger(AdminJoinSupportHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    conversationId: number,
    tenantId: number,
    adminUserId: number,
    ip: string | null,
  ) {
    const conversation = await this.conversations.findSupportByIdForAdmin(
      conversationId,
      tenantId,
    );
    if (!conversation) {
      this.logger.warn(
        `Admin ${adminUserId}: no support conversation ${conversationId} for tenant ${tenantId}`,
      );
      throw new NotFoundException('Support conversation not found');
    }

    await this.audit.write({
      tenantId,
      adminUserId,
      action: 'support_join',
      entityType: 'conversation',
      entityId: conversationId,
      ipAddress: ip,
    });
    this.logger.info(
      `Admin ${adminUserId} joined support conversation ${conversationId} (tenant ${tenantId})`,
    );
    return conversation;
  }
}
