import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequestActor } from '../common/decorators/actor.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FindTicketsQueryDto } from './dto/find-tickets-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketHandler } from './handlers/assign-ticket.handler';
import { CloseTicketHandler } from './handlers/close-ticket.handler';
import { CreateTicketHandler } from './handlers/create-ticket.handler';
import { FindTicketHandler } from './handlers/find-ticket.handler';
import { FindTicketsAdminHandler } from './handlers/find-tickets-admin.handler';
import { FindTicketsHandler } from './handlers/find-tickets.handler';
import { SetStatusHandler } from './handlers/set-status.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class SupportService {
  constructor(
    private readonly createTicket: CreateTicketHandler,
    private readonly findTickets: FindTicketsHandler,
    private readonly findTicket: FindTicketHandler,
    private readonly findTicketsAdmin: FindTicketsAdminHandler,
    private readonly setStatus: SetStatusHandler,
    private readonly assignTicket: AssignTicketHandler,
    private readonly closeTicket: CloseTicketHandler,
  ) {}

  // ---- Tenant side ----

  create(dto: CreateTicketDto, actor: AuthenticatedUser) {
    return this.createTicket.execute(dto, actor);
  }

  findAll(query: PaginationQueryDto) {
    return this.findTickets.execute(query);
  }

  findOne(id: number) {
    return this.findTicket.execute(id);
  }

  // ---- Platform side ----

  findAllForAdmin(query: FindTicketsQueryDto) {
    return this.findTicketsAdmin.execute(query);
  }

  updateStatus(id: number, dto: UpdateTicketStatusDto, actor: RequestActor) {
    return this.setStatus.execute(id, dto, actor);
  }

  assign(id: number, dto: AssignTicketDto, actor: RequestActor) {
    return this.assignTicket.execute(id, dto, actor);
  }

  close(id: number, actor: RequestActor) {
    return this.closeTicket.execute(id, actor);
  }
}
