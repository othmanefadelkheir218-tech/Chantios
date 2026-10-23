import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { ProjectsService } from '../../projects/projects.service';
import { FindChatTopicsQueryDto } from '../dto/client-chat.dto';
import { toTopicEntity } from '../helpers/client-chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/** The first page of topics in `GET /api/client-chats/:id`. */
export const FIRST_TOPICS_PAGE = 20;

/**
 * Step 26 D — the email topics of a client chat, paged, newest activity first
 * (doc/notes/client-email.md § Paging). Page 1 also comes inside
 * `GET /api/client-chats/:id`; "Charger plus" asks the next pages here.
 */
@Injectable()
export class FindChatTopicsHandler {
  constructor(
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly projects: ProjectsService,
  ) {}

  /** `GET /api/client-chats/:id/topics` */
  async list(
    conversationId: number,
    query: FindChatTopicsQueryDto,
    actor: AuthenticatedUser,
  ) {
    const { conversation } = await this.access.assertChat(
      conversationId,
      actor,
    );
    return this.page(
      conversation.id,
      query.page,
      query.limit,
      undefined,
      query.search,
    );
  }

  /**
   * One page of a chat the caller may read (checked by the caller).
   * `alsoTopicId`: add that topic of the same chat when it is not on the page,
   * so a link to an older topic still opens it.
   * `search`: only the topics whose subject holds this text (any case).
   */
  async page(
    conversationId: number,
    page: number,
    limit: number,
    alsoTopicId?: number,
    search?: string,
  ) {
    const [found, total] = await this.conversations.findTopicsPage(
      conversationId,
      toSkip(page, limit),
      limit,
      search || undefined,
    );
    const rows = [...found];
    if (alsoTopicId && !rows.some((row) => row.id === alsoTopicId)) {
      const asked = await this.conversations.findTopicById(alsoTopicId);
      if (asked?.conversationId === conversationId) rows.push(asked);
    }
    const projectIds = rows.flatMap((row) =>
      row.projectId ? [row.projectId] : [],
    );
    const [flagged, projects] = await Promise.all([
      this.messages.findTopicIdsWithNewAddress(conversationId),
      this.projects.findBasics([...new Set(projectIds)]),
    ]);
    const projectName = new Map(projects.map((p) => [p.id, p.name]));
    return toPaginated(
      rows.map((row) =>
        toTopicEntity(
          row,
          row.projectId ? (projectName.get(row.projectId) ?? null) : null,
          { hasNewAddress: flagged.has(row.id) },
        ),
      ),
      total,
      page,
      limit,
    );
  }
}
