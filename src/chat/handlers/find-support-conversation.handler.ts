import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * One ticket's `support` conversation, tenant-scoped — what
 * `GET /api/support/tickets/:id` (step 16) needs to show its
 * `conversation_id`. No business decision beyond the lookup, same spirit as
 * `FindTenantHandler`'s internal passthroughs.
 */
@Injectable()
export class FindSupportConversationHandler {
  constructor(private readonly conversations: ConversationRepository) {}

  byTicket(ticketId: number) {
    return this.conversations.findByTicket(ticketId, 'support');
  }
}
