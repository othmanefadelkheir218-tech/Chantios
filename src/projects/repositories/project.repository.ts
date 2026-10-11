import { Injectable } from '@nestjs/common';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/** The only place where the projects module talks to the database for `projects` rows. */
@Injectable()
export class ProjectRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    return this.tenantPrisma.db.project.create({ data });
  }

  /** `tx` — step 06's quote-acceptance chain reads the project inside its own transaction. */
  findById(id: number, tx?: TenantTransactionClient): Promise<Project | null> {
    return (tx ?? this.tenantPrisma.db).project.findFirst({ where: { id } });
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

  /**
   * `actualEndDate` is only ever set when moving to `completed`. `tx` —
   * step 06's quote-acceptance chain writes this inside its own transaction
   * alongside `quotes` and `stock_reservations` (register-tenant.handler.ts,
   * step 02, is the precedent for threading an additive `tx` across modules).
   */
  setStatus(
    id: number,
    status: ProjectStatus,
    actualEndDate?: Date,
    tx?: TenantTransactionClient,
  ): Promise<Project> {
    return (tx ?? this.tenantPrisma.db).project.update({
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

  /** Dashboard (step 18): open projects (not completed, not cancelled) per status. */
  async countOpenByStatus(): Promise<
    Record<'prospect' | 'in_progress', number>
  > {
    const rows = await this.tenantPrisma.db.project.groupBy({
      by: ['status'],
      where: { status: { in: ['prospect', 'in_progress'] } },
      _count: { _all: true },
    });
    const counts = { prospect: 0, in_progress: 0 };
    for (const row of rows) {
      counts[row.status as keyof typeof counts] = row._count._all;
    }
    return counts;
  }

  /** Name + address of these projects (the worker's own project list). Tenant-scoped like every read here. */
  findSummariesByIds(ids: number[]) {
    return this.tenantPrisma.db.project.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        postalCode: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
