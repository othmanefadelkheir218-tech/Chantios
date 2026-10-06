import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindConversationsQueryDto } from '../dto/find-conversations-query.dto';
import {
  buildConversationFilter,
  toConversationEntity,
} from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * `GET /api/conversations` — ONLY the conversations the caller is a member of
 * (an admin does not see other people's team chats); archived ones are hidden
 * unless `?archived=true`. `GET /api/conversations/:id` — one, members
 * included, after the membership check.
 */
@Injectable()
export class FindConversationsHandler {
  constructor(
    @InjectPinoLogger(FindConversationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly access: CheckAccessHandler,
  ) {}

  async execute(query: FindConversationsQueryDto, actor: AuthenticatedUser) {
    const { page, limit } = query;
    this.logger.debug(`Listing conversations of user ${actor.userId}`);

    const [rows, total] = await this.conversations.findMany(
      buildConversationFilter(actor.userId, {
        type: query.type,
        projectId: query.project_id,
        archived: query.archived,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(rows.map(toConversationEntity), total, page, limit);
  }

  async findOne(id: number, actor: AuthenticatedUser) {
    const conversation = await this.access.assertMember(id, {
      userId: actor.userId,
    });
    return toConversationEntity(conversation);
  }
}
