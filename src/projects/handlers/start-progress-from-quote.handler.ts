import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { canTransition } from '../helpers/project-status.helper';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';

/**
 * Step 06's quote-acceptance chain calls this through `ProjectsService`
 * (never this module's repositories directly), inside its own transaction —
 * not the full `ChangeStatusHandler` HTTP-route logic, whose admin-reopen
 * check is irrelevant here. Reuses the one transition matrix
 * (`canTransition`, `project-status.helper.ts`) rather than re-implementing
 * it. Refuses (400) a project that is not `prospect` or `in_progress`
 * (doc/notes/Phaces/06-quotes-invoices.md). A project already `in_progress`
 * — a second accepted quote on the same job — is a no-op: the matrix has no
 * self-transition, and there is nothing to change or to write to
 * `project_status_history` for it.
 */
@Injectable()
export class StartProgressFromQuoteHandler {
  constructor(
    @InjectPinoLogger(StartProgressFromQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly history: ProjectStatusHistoryRepository,
  ) {}

  async execute(
    projectId: number,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ): Promise<Project> {
    const project = await this.projects.findById(projectId, tx);
    if (!project) {
      this.logger.warn(`Cannot accept quote: project ${projectId} not found`);
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'prospect' && project.status !== 'in_progress') {
      this.logger.warn(
        `Cannot accept quote: project ${projectId} is ${project.status}`,
      );
      throw new BadRequestException(
        `Cannot accept a quote for a project in status ${project.status}`,
      );
    }

    if (project.status === 'in_progress') {
      this.logger.info(
        `Project ${projectId} already in_progress — no transition needed`,
      );
      return project;
    }

    if (!canTransition(project.status, 'in_progress')) {
      // Unreachable given the current matrix (prospect -> in_progress is
      // always legal) — kept so a future matrix change fails loudly here
      // instead of silently skipping the history row.
      throw new BadRequestException(
        `Cannot move project ${projectId} from ${project.status} to in_progress`,
      );
    }

    const updated = await this.projects.setStatus(
      projectId,
      'in_progress',
      undefined,
      tx,
    );
    await this.history.write(
      {
        tenantId: actor.tenantId,
        projectId,
        fromStatus: project.status,
        toStatus: 'in_progress',
        reason: 'quote_accepted',
        changedBy: actor.userId,
      },
      tx,
    );
    this.logger.info(
      `Project ${projectId} moved to in_progress (quote accepted)`,
    );
    return updated;
  }
}
