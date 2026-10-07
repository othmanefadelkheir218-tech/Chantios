import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';
import { MediaService } from '../../media/media.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { SendMessageDto } from '../dto/send-message.dto';
import { toMessageEntity } from '../helpers/chat.helper';
import {
  clientMemberId,
  newMessageContext,
  previewOf,
} from '../helpers/message-alert.helper';
import { MessageRepository } from '../repositories/message.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * `POST /api/conversations/:id/messages` — the caller must be a member; an
 * archived conversation takes no new message. The message carries the
 * conversation's `tenant_id` (never the body's), `sender_type = 'employee'`.
 * `media_ids` — files already uploaded with `entity_type = 'message'` — are
 * linked in the SAME transaction (`MediaService.attachToEntity`), so a bad id
 * leaves no message behind. Then `new_message` goes to the room, over the
 * socket.
 */
@Injectable()
export class SendMessageHandler {
  constructor(
    @InjectPinoLogger(SendMessageHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly messages: MessageRepository,
    private readonly access: CheckAccessHandler,
    private readonly media: MediaService,
    private readonly gateway: ChatGateway,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
    private readonly clients: ClientsService,
  ) {}

  async execute(
    conversationId: number,
    dto: SendMessageDto,
    actor: AuthenticatedUser,
  ) {
    const conversation = await this.access.assertMember(conversationId, {
      userId: actor.userId,
    });
    if (conversation.isArchived) {
      throw new BadRequestException('This conversation is archived');
    }
    const content = dto.content.trim();
    if (content.length === 0) {
      throw new BadRequestException('A message cannot be empty');
    }
    this.logger.info(
      `User ${actor.userId} sends a message to conversation ${conversationId}`,
    );

    const created = await this.tenantPrisma.db.$transaction(async (tx) => {
      const message = await this.messages.create(
        {
          tenantId: conversation.tenantId,
          conversationId,
          senderType: 'employee',
          senderId: actor.userId,
          content,
        },
        tx,
      );
      await this.media.attachToEntity(
        dto.media_ids ?? [],
        'message',
        message.id,
        actor,
        tx,
      );
      return message;
    });

    const files = await this.media.findByEntityIds('message', [created.id]);
    const entity = toMessageEntity(created, files.get(created.id) ?? []);

    this.gateway.emitNewMessage(conversationId, entity);
    await this.notifyMembers(conversation, actor, content);
    this.logger.info(
      `Message ${created.id} sent to conversation ${conversationId}`,
    );
    return entity;
  }

  /**
   * `new_message` to every other employee of the thread, and — in a
   * `project_client` thread — the "you have a reply" email to the client.
   */
  private async notifyMembers(
    conversation: Awaited<ReturnType<CheckAccessHandler['assertMember']>>,
    actor: AuthenticatedUser,
    content: string,
  ): Promise<void> {
    const sender = await this.users.findByIdRaw(actor.userId);
    await this.notifications.dispatch(
      'new_message',
      newMessageContext(
        conversation,
        sender?.name ?? 'A colleague',
        content,
        actor.userId,
      ),
    );

    const clientId = clientMemberId(conversation);
    const client = clientId ? await this.clients.findByIdRaw(clientId) : null;
    if (client) {
      await this.notifications.dispatch('client_portal_message', {
        tenantId: conversation.tenantId,
        clientEmail: client.email,
        payload: { preview: previewOf(content) },
      });
    }
  }
}
