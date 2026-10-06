import { Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { FindTimeEntriesQueryDto } from './dto/find-time-entries-query.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { CreateTimeEntryHandler } from './handlers/create-time-entry.handler';
import { DeleteTimeEntryHandler } from './handlers/delete-time-entry.handler';
import { FindTimeEntriesHandler } from './handlers/find-time-entries.handler';
import { ProjectLabourCostHandler } from './handlers/project-labour-cost.handler';
import { UpdateTimeEntryHandler } from './handlers/update-time-entry.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly createEntry: CreateTimeEntryHandler,
    private readonly findEntries: FindTimeEntriesHandler,
    private readonly updateEntry: UpdateTimeEntryHandler,
    private readonly deleteEntry: DeleteTimeEntryHandler,
    private readonly labourCost: ProjectLabourCostHandler,
  ) {}

  create(
    dto: CreateTimeEntryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.createEntry.execute(dto, actor, scope);
  }

  findAll(
    query: FindTimeEntriesQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.findEntries.execute(query, actor, scope);
  }

  findMine(
    query: FindTimeEntriesQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.findEntries.execute(query, actor, scope, true);
  }

  update(
    id: number,
    dto: UpdateTimeEntryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.updateEntry.execute(id, dto, actor, scope);
  }

  remove(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    return this.deleteEntry.execute(id, actor, scope);
  }

  projectLabourCost(projectId: number, actor: AuthenticatedUser) {
    return this.labourCost.execute(projectId, actor);
  }
}
