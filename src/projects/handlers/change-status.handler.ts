import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { RolesService } from '../../roles/roles.service';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { toProjectEntity } from '../helpers/project.helper';
import { canTransition, isReopen } from '../helpers/project-status.helper';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { CancelProjectHandler } from './cancel-project.handler';

/**
 * `PATCH /api/projects/:id/status` — the only route allowed to change
 * `status`. The matrix (`project-status.helper.ts`) decides what is legal;
 * anything else is refused. Always writes a `project_status_history` row.
 * Sets `actual_end_date` when moving to `completed`. `in_progress ->
 * completed` is never blocked by payment status (decided 2026-10-06,
 * doc/notes/technical/phase-03-clients-projects.md) — it is just another
 * transition through the matrix, same as any other.
 */
@Injectable()
export class ChangeStatusHandler {
  constructor(
    @InjectPinoLogger(ChangeStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly history: ProjectStatusHistoryRepository,
    private readonly roles: RolesService,
    private readonly audit: AuditService,
    private readonly cancelProject: CancelProjectHandler,
  ) {}

  async execute(id: number, dto: ChangeStatusDto, actor: AuthenticatedUser) {
    this.logger.info(`Changing project ${id} status to ${dto.status}`);

    const project = await this.projects.findById(id);
    if (!project) {
      this.logger.warn(`Cannot change status: project ${id} not found`);
      throw new NotFoundException('Project not found');
    }

    if (!canTransition(project.status, dto.status)) {
      this.logger.warn(
        `Rejected transition for project ${id}: ${project.status} -> ${dto.status}`,
      );
      throw new BadRequestException(
        `Cannot move a project from ${project.status} to ${dto.status}`,
      );
    }

    if (isReopen(project.status, dto.status)) {
      const role = await this.roles.findRoleById(actor.roleId);
      if (role?.name !== 'admin') {
        throw new ForbiddenException(
          'Only an admin can reopen a completed project',
        );
      }
      // TODO: step 10 — void this project's live `project_closure_snapshots`
      // row here (`voided_at`), once that table is built. It must never be
      // deleted — it stays a historical financial record.
    }

    if (dto.status === 'cancelled') {
      return this.cancelProject.execute(project, dto.reason, actor);
    }

    const actualEndDate = dto.status === 'completed' ? new Date() : undefined;
    const updated = await this.projects.setStatus(
      id,
      dto.status,
      actualEndDate,
    );
    await this.history.write({
      tenantId: actor.tenantId,
      projectId: id,
      fromStatus: project.status,
      toStatus: dto.status,
      reason: dto.reason ?? null,
      changedBy: actor.userId,
    });

    const entity = toProjectEntity(updated);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'change_status',
      entityType: 'project',
      entityId: id,
      oldValue: { status: project.status },
      newValue: { status: dto.status },
      ipAddress: null,
    });
    this.logger.info(
      `Project ${id} status changed: ${project.status} -> ${dto.status}`,
    );
    return entity;
  }
}
