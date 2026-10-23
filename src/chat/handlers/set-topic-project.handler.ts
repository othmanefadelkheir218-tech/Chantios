import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { SetTopicProjectDto } from '../dto/client-chat.dto';
import { toTopicEntity } from '../helpers/client-chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/**
 * `PATCH /api/client-chats/topics/:topicId/project` — set or change the tag
 * (doc/notes/client-email.md § The project tag). Shared inbox: `email` edit
 * + `projects` edit; Gmail inbox: the owner only. The project must be one of
 * the chat's client. Setting it by hand confirms it (`project_suggested` off).
 */
@Injectable()
export class SetTopicProjectHandler {
  constructor(
    @InjectPinoLogger(SetTopicProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(
    topicId: number,
    dto: SetTopicProjectDto,
    actor: AuthenticatedUser,
  ) {
    const chat = await this.access.assertTopic(topicId, actor);
    await this.access.assertCanEditTopic(chat, actor, true);

    let projectName: string | null = null;
    if (dto.project_id !== null) {
      const [project] = await this.projects.findBasics([dto.project_id]);
      if (!project) throw new NotFoundException('Project not found');
      if (project.clientId !== chat.conversation.clientId) {
        this.logger.warn(
          `Project ${project.id} is not a project of the client of topic ${topicId}`,
        );
        throw new BadRequestException('This project belongs to another client');
      }
      projectName = project.name;
    }

    const updated = await this.conversations.setTopicProject(
      topicId,
      dto.project_id,
      false,
    );
    this.logger.info(
      `Topic ${topicId} tagged with project ${dto.project_id ?? 'none'} by user ${actor.userId}`,
    );
    return toTopicEntity(updated, projectName);
  }
}
