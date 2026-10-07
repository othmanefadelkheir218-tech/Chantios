import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatService } from '../../chat/chat.service';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/**
 * `GET /api/support/tickets/:id` — tenant-scoped (another company's ticket is
 * simply not found), with its `conversation_id` so the client can open the
 * thread.
 */
@Injectable()
export class FindTicketHandler {
  constructor(
    @InjectPinoLogger(FindTicketHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
    private readonly chat: ChatService,
  ) {}

  async execute(id: number) {
    this.logger.debug(`Finding support ticket ${id}`);
    const ticket = await this.tickets.findById(id);
    if (!ticket) {
      this.logger.warn(`Support ticket not found: ${id}`);
      throw new NotFoundException('Support ticket not found');
    }
    const conversation = await this.chat.findSupportConversationByTicket(id);
    return { ...ticket, conversationId: conversation?.id ?? null };
  }
}
