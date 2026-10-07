import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * `PATCH /api/admin/support/tickets/:id/assign` (step 16) adds the newly
 * assigned platform admin to the ticket's conversation. Same cross-tenant
 * door as the rest of the support escape hatch (`findByTicketForAdmin` /
 * `addAdminMemberForAdmin`, unwrapped client, explicit `tenantId`) — the
 * caller (`assign-ticket.handler`, behind `AdminAuthGuard`) writes the
 * `audit_logs` row for the assignment itself.
 */
@Injectable()
export class AdminAddSupportMemberHandler {
  constructor(
    @InjectPinoLogger(AdminAddSupportMemberHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
  ) {}

  /** Returns the conversation id joined, or `null` if the ticket has none (should not happen in practice). */
  async execute(
    ticketId: number,
    tenantId: number,
    adminUserId: number,
  ): Promise<number | null> {
    const conversation = await this.conversations.findByTicketForAdmin(
      ticketId,
      tenantId,
    );
    if (!conversation) {
      this.logger.warn(
        `No support conversation for ticket ${ticketId} (tenant ${tenantId}) — cannot add admin ${adminUserId}`,
      );
      return null;
    }
    await this.conversations.addAdminMemberForAdmin(
      conversation.id,
      tenantId,
      adminUserId,
    );
    this.logger.info(
      `Admin ${adminUserId} added to support conversation ${conversation.id} (ticket ${ticketId})`,
    );
    return conversation.id;
  }
}
