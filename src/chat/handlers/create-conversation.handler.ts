import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { UsersService } from '../../users/users.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { toConversationEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * `POST /api/conversations` — `internal` only (the DTO). The caller is a member
 * automatically; every other member must be an ACTIVE user of THIS tenant
 * (`UsersService.findActiveInTenant` — never the unscoped lookup), so a user of
 * another company is refused. Conversation and members are one transaction.
 */
@Injectable()
export class CreateConversationHandler {
  constructor(
    @InjectPinoLogger(CreateConversationHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly conversations: ConversationRepository,
    private readonly users: UsersService,
    private readonly projects: ProjectsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateConversationDto, actor: AuthenticatedUser) {
    const memberIds = [...new Set([actor.userId, ...dto.member_user_ids])];
    this.logger.info(
      `Creating an internal conversation with ${memberIds.length} member(s)`,
    );

    for (const userId of memberIds) {
      if (userId === actor.userId) continue;
      const user = await this.users.findActiveInTenant(userId, actor.tenantId);
      if (!user) {
        this.logger.warn(
          `Cannot create conversation: user ${userId} is not an active user of tenant ${actor.tenantId}`,
        );
        throw new BadRequestException(
          `User ${userId} is not an active user of this company`,
        );
      }
    }
    if (dto.project_id !== undefined) {
      // Throws NotFoundException if the project does not belong to this tenant.
      await this.projects.findOne(dto.project_id);
    }

    const created = await this.tenantPrisma.db.$transaction((tx) =>
      this.conversations.create(
        {
          tenantId: actor.tenantId,
          type: 'internal',
          projectId: dto.project_id ?? null,
        },
        memberIds.map((userId) => ({ userId })),
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
    this.logger.info(`Conversation created: ${created.id}`);
    return entity;
  }
}
