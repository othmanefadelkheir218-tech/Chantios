import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatusHistory } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/**
 * The one allowed second repository in `projects` (doc/notes/Phaces/04-clients-projects.md):
 * same domain as `project.repository.ts`, but a genuinely separate write path
 * — every status change, including the first one at creation, writes here.
 */
@Injectable()
export class ProjectStatusHistoryRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  write(
    entry: Prisma.ProjectStatusHistoryUncheckedCreateInput,
  ): Promise<ProjectStatusHistory> {
    return this.tenantPrisma.db.projectStatusHistory.create({ data: entry });
  }

  findByProject(projectId: number): Promise<ProjectStatusHistory[]> {
    return this.tenantPrisma.db.projectStatusHistory.findMany({
      where: { projectId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
