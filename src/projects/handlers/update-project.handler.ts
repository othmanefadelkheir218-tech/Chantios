import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { assertDateOrder, toProjectEntity } from '../helpers/project.helper';
import { ProjectRepository } from '../repositories/project.repository';

/**
 * `PATCH /api/projects/:id` — never the status (`UpdateProjectDto` has no
 * `status` field, and the global `ValidationPipe` is `whitelist +
 * forbidNonWhitelisted`, so a `status` in the body is rejected outright,
 * not silently dropped).
 */
@Injectable()
export class UpdateProjectHandler {
  constructor(
    @InjectPinoLogger(UpdateProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateProjectDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating project ${id}`);

    const current = await this.projects.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update project: ${id} not found`);
      throw new NotFoundException('Project not found');
    }

    const effectiveStart = dto.start_date ?? current.startDate;
    const effectiveEnd = dto.end_date ?? current.endDate;
    assertDateOrder(effectiveStart, effectiveEnd);

    const updated = await this.projects.update(
      id,
      toCamelKeys<Prisma.ProjectUpdateInput>(dto),
    );
    const entity = toProjectEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'project',
      entityId: id,
      oldValue: toProjectEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Project updated: ${id}`);
    return entity;
  }
}
