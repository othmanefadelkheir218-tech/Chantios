import { Injectable } from '@nestjs/common';
import {
  ActingParty,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChangeStatusHandler } from './handlers/change-status.handler';
import { CreateProjectHandler } from './handlers/create-project.handler';
import { DeleteProjectHandler } from './handlers/delete-project.handler';
import { FindProjectHandler } from './handlers/find-project.handler';
import { FindProjectsHandler } from './handlers/find-projects.handler';
import { StartProgressFromQuoteHandler } from './handlers/start-progress-from-quote.handler';
import { UpdateProjectHandler } from './handlers/update-project.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly createProject: CreateProjectHandler,
    private readonly findProjects: FindProjectsHandler,
    private readonly findProject: FindProjectHandler,
    private readonly updateProject: UpdateProjectHandler,
    private readonly changeStatus: ChangeStatusHandler,
    private readonly deleteProject: DeleteProjectHandler,
    private readonly startProgressFromQuote: StartProgressFromQuoteHandler,
  ) {}

  create(dto: CreateProjectDto, actor: AuthenticatedUser) {
    return this.createProject.execute(dto, actor);
  }

  findAll(query: FindProjectsQueryDto) {
    return this.findProjects.execute(query);
  }

  findOne(id: number) {
    return this.findProject.execute(id);
  }

  history(id: number) {
    return this.findProject.history(id);
  }

  update(id: number, dto: UpdateProjectDto, actor: AuthenticatedUser) {
    return this.updateProject.execute(id, dto, actor);
  }

  changeProjectStatus(
    id: number,
    dto: ChangeStatusDto,
    actor: AuthenticatedUser,
  ) {
    return this.changeStatus.execute(id, dto, actor);
  }

  remove(id: number, actor: AuthenticatedUser) {
    return this.deleteProject.execute(id, actor);
  }

  // ---- Internal API for `quotes` (step 06) ----

  /**
   * Step 06's quote-acceptance chain: moves the project to `in_progress`
   * (no-op if already there) inside the caller's own transaction. Never
   * goes through `ChangeStatusHandler` — this is not an HTTP-route status
   * change, just the one side effect quote acceptance needs.
   */
  beginFromQuoteAcceptance(
    projectId: number,
    actor: ActingParty,
    tx: TenantTransactionClient,
  ) {
    return this.startProgressFromQuote.execute(projectId, actor, tx);
  }
}
