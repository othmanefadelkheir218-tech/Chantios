import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatusHistory } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/**
 * The one allowed second repository in `projects` (doc/notes/Phaces/04-clients-projects.md):
 * same domain as `project.repository.ts`, but a genuinely separate write path
 * — every status change, including the first one at creation, writes here.
 */
@Injectable()
export class ProjectStatusHistoryRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** `tx` — step 06's quote-acceptance chain writes this inside its own transaction. */
  write(
    entry: Prisma.ProjectStatusHistoryUncheckedCreateInput,
    tx?: TenantTransactionClient,
  ): Promise<ProjectStatusHistory> {
    return (tx ?? this.tenantPrisma.db).projectStatusHistory.create({
      data: entry,
    });
  }

  findByProject(projectId: number): Promise<ProjectStatusHistory[]> {
    return this.tenantPrisma.db.projectStatusHistory.findMany({
      where: { projectId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
