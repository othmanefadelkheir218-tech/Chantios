import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import { ClientsService } from '../../clients/clients.service';
import { RolesService } from '../../roles/roles.service';
import { CreateClientDto } from '../../clients/dto/create-client.dto';
import { AddClientAddressDto } from '../dto/client-chat.dto';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/**
 * Who the sender is (doc/notes/client-email.md § Who is the client):
 * "Create client" from an unknown contact, and "Add this address" (a new
 * address of the chat's client, never automatic).
 */
@Injectable()
export class ResolveContactHandler {
  constructor(
    @InjectPinoLogger(ResolveContactHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly clients: ClientsService,
    private readonly messages: MessageRepository,
    private readonly roles: RolesService,
    private readonly conversations: ConversationRepository,
  ) {}

  /**
   * `POST /api/client-chats/:id/add-address` (`clients` edit) — the address
   * becomes one of the chat's client; its ⚠️ flag goes away. A new email from
   * it now matches the client.
   */
  async addAddress(
    conversationId: number,
    dto: AddClientAddressDto,
    actor: AuthenticatedUser,
  ) {
    const { conversation } = await this.access.assertChat(
      conversationId,
      actor,
    );
    const can = await loadPermissions(this.roles, actor.roleId);
    if (!can('clients').canEdit) {
      throw new ForbiddenException('No edit access to clients');
    }
    if (!conversation.clientId) {
      throw new BadRequestException(
        'This chat is an unknown contact: create the client first',
      );
    }
    const added = await this.clients.addEmail(conversation.clientId, dto.email);
    await this.messages.clearNewAddressFlag(conversationId, added.email);
    this.logger.info(
      `Address added to client ${conversation.clientId} from chat ${conversationId}`,
    );
    return added;
  }

  /**
   * `POST /api/client-chats/:id/create-client` (`clients` create, decided
   * 2026-10-19): the normal client form, pre-filled by the frontend with the
   * contact's name and email. The chat moves to the new client; a changed
   * email keeps the contact's address as an extra one.
   */
  async createClient(
    conversationId: number,
    dto: CreateClientDto,
    actor: AuthenticatedUser,
  ) {
    const { conversation } = await this.access.assertChat(
      conversationId,
      actor,
    );
    if (conversation.clientId || !conversation.contactEmail) {
      throw new BadRequestException('This chat already belongs to a client');
    }
    const client = await this.clients.create(dto, actor);
    if (
      client.email.toLowerCase() !== conversation.contactEmail.toLowerCase()
    ) {
      await this.clients.addEmail(client.id, conversation.contactEmail);
    }
    await this.conversations.moveContactToClient(conversationId, client.id);
    this.logger.info(
      `Contact chat ${conversationId} became client ${client.id} (user ${actor.userId})`,
    );
    return { conversationId, client };
  }
}
