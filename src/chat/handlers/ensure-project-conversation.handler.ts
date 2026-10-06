import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { UsersService } from '../../users/users.service';
import { ChatIdentity } from '../helpers/chat-access.helper';
import { toConversationEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * The find-or-create step 12 calls when a portal link is generated:
 * `(project_id, type = 'project_client')`. **Idempotent** — a regenerated link
 * reuses the one thread, never a second (the partial unique index
 * `idx_one_client_conversation` makes a second one impossible, and a lost race
 * is caught and answered with the thread that won).
 *
 * Members when it is created: the project's CLIENT (the portal speaks for them
 * by `client_id`), the employee who generated the link, and the project's
 * manager if there is one. When it already exists, the caller joins it if they
 * are not in it yet (so another employee regenerating the link can reply).
 */
@Injectable()
export class EnsureProjectConversationHandler {
  constructor(
    @InjectPinoLogger(EnsureProjectConversationHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly conversations: ConversationRepository,
    private readonly projects: ProjectsService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async execute(projectId: number, actor: AuthenticatedUser) {
    // Throws NotFoundException if the project does not belong to this tenant.
    const project = await this.projects.findOne(projectId);

    const existing = await this.conversations.findByProject(
      projectId,
      'project_client',
    );
    if (existing) {
      return this.reuse(existing.id, projectId, actor);
    }

    const members: ChatIdentity[] = [
      { clientId: project.clientId },
      { userId: actor.userId },
    ];
    if (project.managerId && project.managerId !== actor.userId) {
      const manager = await this.users.findActiveInTenant(
        project.managerId,
        actor.tenantId,
      );
      if (manager) members.push({ userId: manager.id });
    }

    try {
      const created = await this.tenantPrisma.db.$transaction((tx) =>
        this.conversations.create(
          {
            tenantId: actor.tenantId,
            type: 'project_client',
            projectId,
          },
          members,
          tx,
        ),
      );
      const entity = toConversationEntity(created);
      await this.audit.write({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'create',
        entityType: 'conversation',
        entityId: created.id,
        newValue: entity,
        ipAddress: null,
      });
      this.logger.info(
        `Project conversation ${created.id} created for project ${projectId}`,
      );
      return { created: true, conversation: entity };
    } catch (error: unknown) {
      // Two links generated at the same moment: the unique index let one win.
      const winner = await this.conversations.findByProject(
        projectId,
        'project_client',
      );
      if (!winner) throw error;
      this.logger.info(
        `Lost the race for project ${projectId}'s conversation — reusing ${winner.id}`,
      );
      return this.reuse(winner.id, projectId, actor);
    }
  }

  /** The thread already exists: make sure the caller is in it, answer with it. */
  private async reuse(
    conversationId: number,
    projectId: number,
    actor: AuthenticatedUser,
  ) {
    await this.conversations.addMember(conversationId, actor.tenantId, {
      userId: actor.userId,
    });
    const conversation = await this.conversations.findByProject(
      projectId,
      'project_client',
    );
    this.logger.debug(
      `Project ${projectId} already has conversation ${conversationId} — reused`,
    );
    return {
      created: false,
      conversation: toConversationEntity(conversation!),
    };
  }
}
