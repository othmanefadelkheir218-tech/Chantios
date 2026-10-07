import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ChatService } from '../../chat/chat.service';
import { ChatIdentity } from '../../chat/helpers/chat-access.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

/**
 * `POST /api/support/tickets` — only the tenant `admin` role may open a
 * ticket. Checked here, at the business layer, not just by the route's
 * `@Roles('admin')` — same defense-in-depth style as
 * `change-status.handler.ts`'s admin-only reopen check.
 *
 * One transaction: the `support_tickets` row, then step 11's `support`
 * conversation (`type = 'support'`, `support_ticket_id` set) and its first
 * message — through `ChatService.createSupportConversation`, which runs
 * inside the SAME `tx` this handler opens. The DB check
 * `chk_support_has_ticket` makes the reverse (a support conversation with no
 * ticket) structurally impossible.
 *
 * Members at open time: just the opener. There is no assigned platform admin
 * yet — `assign-ticket.handler` is what adds one once the ticket is picked
 * up — and nothing in the notes says every tenant user should see every
 * ticket, so the tenant side of the conversation starts as small as the chat
 * module's own `internal` conversations do (the creator plus whoever is
 * named explicitly).
 */
@Injectable()
export class CreateTicketHandler {
  constructor(
    @InjectPinoLogger(CreateTicketHandler.name)
    private readonly logger: PinoLogger,
    private readonly tickets: SupportTicketRepository,
    private readonly roles: RolesService,
    private readonly chat: ChatService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly audit: AuditService,
    private readonly tenants: TenantsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(dto: CreateTicketDto, actor: AuthenticatedUser) {
    this.logger.info(
      `User ${actor.userId} opening a support ticket for tenant ${actor.tenantId}`,
    );

    const role = await this.roles.findRoleById(actor.roleId);
    if (role?.name !== 'admin') {
      this.logger.warn(
        `User ${actor.userId} (role ${role?.name ?? 'unknown'}) cannot open a support ticket`,
      );
      throw new ForbiddenException('Only an admin can open a support ticket');
    }

    const members: ChatIdentity[] = [{ userId: actor.userId }];
    const message = dto.message.trim();

    const { ticket, conversation } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const ticket = await this.tickets.create(
          {
            tenantId: actor.tenantId,
            openedBy: actor.userId,
            subject: dto.subject,
            category: dto.category,
            priority: dto.priority ?? 'normal',
          },
          tx,
        );
        const { conversation } = await this.chat.createSupportConversation(
          ticket.id,
          members,
          message,
          actor,
          tx,
        );
        return { ticket, conversation };
      },
    );

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'support_ticket',
      entityId: ticket.id,
      newValue: { ...ticket, conversationId: conversation.id },
      ipAddress: null,
    });

    // ChantierOS staff hear about the new ticket (platform alert, no tenant row).
    const tenant = await this.tenants.findOne(actor.tenantId);
    await this.notifications.dispatch('support_ticket_opened', {
      payload: {
        entity_id: ticket.id,
        tenant_id: actor.tenantId,
        company_name: tenant.name,
        subject: ticket.subject,
      },
    });

    this.logger.info(
      `Support ticket ${ticket.id} opened (tenant ${actor.tenantId}), conversation ${conversation.id}`,
    );
    return { ...ticket, conversationId: conversation.id };
  }
}
