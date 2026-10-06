import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateProjectDto } from '../dto/create-project.dto';
import { assertDateOrder, toProjectEntity } from '../helpers/project.helper';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';

/**
 * `POST /api/projects` — starts at `prospect`. `client_id` must be an
 * active client of this tenant. Writes the first `project_status_history`
 * row with `from_status = NULL`.
 */
@Injectable()
export class CreateProjectHandler {
  constructor(
    @InjectPinoLogger(CreateProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly history: ProjectStatusHistoryRepository,
    private readonly clients: ClientsService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateProjectDto, actor: AuthenticatedUser) {
    this.logger.info(
      `Creating project ${dto.name} for client ${dto.client_id}`,
    );

    const client = await this.clients.findByIdRaw(dto.client_id);
    if (!client) {
      this.logger.warn(
        `Cannot create project: client ${dto.client_id} not found`,
      );
      throw new NotFoundException('Client not found');
    }
    if (!client.isActive) {
      this.logger.warn(
        `Cannot create project: client ${dto.client_id} is archived`,
      );
      throw new BadRequestException(
        'Cannot create a project for an archived client',
      );
    }
    assertDateOrder(dto.start_date, dto.end_date);

    const created = await this.projects.create({
      ...toCamelKeys<Prisma.ProjectUncheckedCreateInput>(dto),
      tenantId: actor.tenantId,
      status: 'prospect',
      createdBy: actor.userId,
    });

    await this.history.write({
      tenantId: actor.tenantId,
      projectId: created.id,
      fromStatus: null,
      toStatus: 'prospect',
      reason: null,
      changedBy: actor.userId,
    });

    const entity = toProjectEntity(created);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'project',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Project created: ${created.id} (prospect)`);
    return entity;
  }
}
