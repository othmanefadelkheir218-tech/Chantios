import { Injectable } from '@nestjs/common';
import { InboundEmailEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the inbound-email module talks to the database.
 * `inbound_email_events` is a platform table (no tenant scope, in
 * `TENANT_EXTENSION_SKIP_LIST`, like `stripe_events`): the raw client.
 */
@Injectable()
export class InboundEmailEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.InboundEmailEventCreateInput,
  ): Promise<InboundEmailEvent> {
    return this.prisma.inboundEmailEvent.create({ data });
  }

  findByResendId(resendEmailId: string): Promise<InboundEmailEvent | null> {
    return this.prisma.inboundEmailEvent.findUnique({
      where: { resendEmailId },
    });
  }

  findById(id: number): Promise<InboundEmailEvent | null> {
    return this.prisma.inboundEmailEvent.findUnique({ where: { id } });
  }

  /** Done. `note` keeps why nothing was saved (an auto-reply), for support. */
  markProcessed(
    id: number,
    tenantId: number | null,
    note: string | null = null,
  ): Promise<InboundEmailEvent> {
    return this.prisma.inboundEmailEvent.update({
      where: { id },
      data: { processedAt: new Date(), tenantId, error: note },
    });
  }

  markError(
    id: number,
    error: string,
    tenantId: number | null = null,
  ): Promise<InboundEmailEvent> {
    return this.prisma.inboundEmailEvent.update({
      where: { id },
      data: { error, ...(tenantId !== null && { tenantId }) },
    });
  }
}
