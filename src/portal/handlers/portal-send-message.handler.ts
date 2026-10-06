import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatService } from '../../chat/chat.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { PortalMessageDto } from '../dto/portal-message.dto';
import { toPortalMessage } from '../helpers/portal-view.helper';

/**
 * `POST /api/portal/:token/messages` — chat's `ClientMessagesHandler` with
 * `sender_type = 'client'` and `sender_id = client_id` from the TOKEN, never
 * from the body. Staff see it in the dashboard thread, live over the socket.
 */
@Injectable()
export class PortalSendMessageHandler {
  constructor(
    @InjectPinoLogger(PortalSendMessageHandler.name)
    private readonly logger: PinoLogger,
    private readonly chat: ChatService,
  ) {}

  async execute(portal: PortalContextData, dto: PortalMessageDto) {
    this.logger.info(
      `Client ${portal.clientId} sends a message on project ${portal.projectId}`,
    );
    const message = await this.chat.sendClientMessage(
      portal.projectId,
      portal.clientId,
      dto.content,
    );
    return toPortalMessage(message);
  }
}
