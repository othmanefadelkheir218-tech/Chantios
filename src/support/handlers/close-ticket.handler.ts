import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/** `PATCH /api/admin/support/tickets/:id/close` — `status = 'closed'`, `closed_at`. Never deletes. */
@Injectable()
export class CloseTicketHandler {
  constructor(
    @InjectPinoLogger(CloseTicketHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: RequestActor) {
    this.logger.info(`Closing support ticket ${id}`);

    const ticket = await this.tickets.findByIdForAdmin(id);
    if (!ticket) {
      this.logger.warn(`Cannot close: support ticket ${id} not found`);
      throw new NotFoundException('Support ticket not found');
    }

    const closedAt = new Date();
    const updated = await this.tickets.close(id, closedAt);
    await this.audit.write({
      tenantId: ticket.tenantId,
      adminUserId: actor.adminUserId,
      action: 'close',
      entityType: 'support_ticket',
      entityId: id,
      oldValue: { status: ticket.status },
      newValue: { status: 'closed', closedAt },
      ipAddress: actor.ip,
    });

    this.logger.info(`Support ticket ${id} closed`);
    return updated;
  }
}
