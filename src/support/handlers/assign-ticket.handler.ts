import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ChatService } from '../../chat/chat.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/**
 * `PATCH /api/admin/support/tickets/:id/assign` — sets `assigned_admin_id`
 * AND adds that admin to the ticket's conversation (idempotent;
 * `addAdminToSupportConversation` is a no-op if already a member), so the
 * assigned staff member can see and reply to it right away.
 */
@Injectable()
export class AssignTicketHandler {
  constructor(
    @InjectPinoLogger(AssignTicketHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
    private readonly chat: ChatService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: AssignTicketDto, actor: RequestActor) {
    this.logger.info(
      `Assigning support ticket ${id} to admin ${dto.assigned_admin_id}`,
    );

    const ticket = await this.tickets.findByIdForAdmin(id);
    if (!ticket) {
      this.logger.warn(`Cannot assign: support ticket ${id} not found`);
      throw new NotFoundException('Support ticket not found');
    }

    const updated = await this.tickets.assign(id, dto.assigned_admin_id);
    await this.chat.addAdminToSupportConversation(
      id,
      ticket.tenantId,
      dto.assigned_admin_id,
    );

    await this.audit.write({
      tenantId: ticket.tenantId,
      adminUserId: actor.adminUserId,
      action: 'assign',
      entityType: 'support_ticket',
      entityId: id,
      oldValue: { assignedAdminId: ticket.assignedAdminId },
      newValue: { assignedAdminId: dto.assigned_admin_id },
      ipAddress: actor.ip,
    });

    this.logger.info(
      `Support ticket ${id} assigned to admin ${dto.assigned_admin_id}`,
    );
    return updated;
  }
}
