import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatService } from '../../chat/chat.service';
import { MediaService } from '../../media/media.service';
import { PENDING_ENTITY_ID } from '../../media/helpers/media.helper';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { PortalMessageDto } from '../dto/portal-message.dto';
import { toPortalMessage } from '../helpers/portal-view.helper';

/**
 * `POST /api/portal/:token/messages` — chat's `ClientMessagesHandler` with
 * `sender_type = 'client'` and `sender_id = client_id` from the TOKEN, never
 * from the body. Staff see it in the dashboard thread, live over the socket.
 *
 * Files (doc/notes/client-portal.md § Files in the portal chat): the message
 * checks and EVERY file's size/type run first, then each file goes up through
 * `MediaService.upload` as a pending `message` file with no uploader, then the
 * message and its files are written in one transaction.
 */
@Injectable()
export class PortalSendMessageHandler {
  constructor(
    @InjectPinoLogger(PortalSendMessageHandler.name)
    private readonly logger: PinoLogger,
    private readonly chat: ChatService,
    private readonly media: MediaService,
  ) {}

  async execute(
    portal: PortalContextData,
    dto: PortalMessageDto,
    files: Express.Multer.File[] = [],
  ) {
    this.logger.info(
      `Client ${portal.clientId} sends a message with ${files.length} file(s) on project ${portal.projectId}`,
    );
    const mediaIds = await this.uploadFiles(portal, dto.content, files);
    const message = await this.chat.sendClientMessage(
      portal.projectId,
      portal.clientId,
      dto.content,
      mediaIds,
    );
    return toPortalMessage(message);
  }

  private async uploadFiles(
    portal: PortalContextData,
    content: string,
    files: Express.Multer.File[],
  ): Promise<number[]> {
    if (files.length === 0) return [];
    await this.chat.assertClientCanSend(
      portal.projectId,
      portal.clientId,
      content,
    );
    for (const file of files) this.media.assertUploadable(file, 'message');

    const uploader = { tenantId: portal.tenantId, userId: null };
    const ids: number[] = [];
    for (const file of files) {
      const media = await this.media.upload(
        file,
        { entity_type: 'message', entity_id: PENDING_ENTITY_ID },
        uploader,
      );
      ids.push(media.id);
    }
    return ids;
  }
}
