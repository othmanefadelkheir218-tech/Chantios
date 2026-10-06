import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatService } from '../../chat/chat.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { FindPortalMessagesQueryDto } from '../dto/find-portal-messages-query.dto';
import { toPortalMessage } from '../helpers/portal-view.helper';

/**
 * `GET /api/portal/:token/messages` — the project's `project_client` thread,
 * newest first. It goes through chat's membership check for THIS client, and
 * opening it marks the client's unread messages as read. Each message shows
 * "from: company" or "from: you" — never an employee's name or id.
 */
@Injectable()
export class PortalMessagesHandler {
  constructor(
    @InjectPinoLogger(PortalMessagesHandler.name)
    private readonly logger: PinoLogger,
    private readonly chat: ChatService,
  ) {}

  async execute(portal: PortalContextData, query: FindPortalMessagesQueryDto) {
    this.logger.debug(`Portal messages of project ${portal.projectId}`);
    const page = await this.chat.listClientMessages(
      portal.projectId,
      portal.clientId,
      portal.tenantId,
      query,
    );
    return {
      data: page.data.map(toPortalMessage),
      total: page.total,
      page: page.page,
      limit: page.limit,
      totalPages: page.totalPages,
    };
  }
}
