import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindTicketsQueryDto } from '../dto/find-tickets-query.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/** `GET /api/admin/support/tickets` — every tenant, `?status=&priority=&tenant_id=`. */
@Injectable()
export class FindTicketsAdminHandler {
  constructor(
    @InjectPinoLogger(FindTicketsAdminHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
  ) {}

  async execute({
    page,
    limit,
    status,
    priority,
    tenant_id,
  }: FindTicketsQueryDto) {
    this.logger.debug(
      `Listing support tickets for admin (page ${page}, limit ${limit})`,
    );
    const where: Prisma.SupportTicketWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(tenant_id && { tenantId: tenant_id }),
    };
    const [data, total] = await this.tickets.findAllForAdmin(
      where,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
