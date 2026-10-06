import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** The only place where the projects module talks to the database for `projects` rows. */
@Injectable()
export class ProjectRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    return this.tenantPrisma.db.project.create({ data });
  }

  findById(id: number): Promise<Project | null> {
    return this.tenantPrisma.db.project.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.ProjectWhereInput,
    skip: number,
    take: number,
  ): Promise<[Project[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.project.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.tenantPrisma.db.project.update({ where: { id }, data });
  }

  /** `actualEndDate` is only ever set when moving to `completed`. */
  setStatus(
    id: number,
    status: ProjectStatus,
    actualEndDate?: Date,
  ): Promise<Project> {
    return this.tenantPrisma.db.project.update({
      where: { id },
      data: {
        status,
        ...(actualEndDate !== undefined && { actualEndDate }),
      },
    });
  }

  countByClient(clientId: number): Promise<number> {
    return this.tenantPrisma.db.project.count({ where: { clientId } });
  }

  /**
   * `DELETE /api/projects/:id` — the caller (`delete-project.handler`) has
   * already refused anything but a `prospect` project and cleared its
   * `media` rows first.
   */
  delete(id: number): Promise<Project> {
    return this.tenantPrisma.db.project.delete({ where: { id } });
  }
}
