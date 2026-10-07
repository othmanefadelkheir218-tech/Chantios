import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/**
 * `PATCH /api/admin/support/tickets/:id/status` — platform admin, any tenant.
 * Written explicitly (not through the generic `@AuditLog` interceptor): the
 * interceptor has no `tenant_id` route param to read here, and a ticket's
 * tenant must not be lost from its own audit row.
 */
@Injectable()
export class SetStatusHandler {
  constructor(
    @InjectPinoLogger(SetStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateTicketStatusDto, actor: RequestActor) {
    this.logger.info(`Setting support ticket ${id} to ${dto.status}`);

    const ticket = await this.tickets.findByIdForAdmin(id);
    if (!ticket) {
      this.logger.warn(`Cannot update status: support ticket ${id} not found`);
      throw new NotFoundException('Support ticket not found');
    }

    const updated = await this.tickets.setStatus(id, dto.status);
    await this.audit.write({
      tenantId: ticket.tenantId,
      adminUserId: actor.adminUserId,
      action: 'update_status',
      entityType: 'support_ticket',
      entityId: id,
      oldValue: { status: ticket.status },
      newValue: { status: updated.status },
      ipAddress: actor.ip,
    });

    this.logger.info(`Support ticket ${id} is now ${updated.status}`);
    return updated;
  }
}
