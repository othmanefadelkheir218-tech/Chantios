import {
  Project,
  ProjectStatusHistory,
  Prisma,
  ProjectStatus,
} from '@prisma/client';

/**
 * What may leave the module. `projects` deliberately has no budget / progress
 * field to map — see doc/notes/Phaces/04-clients-projects.md.
 */
export function toProjectEntity(project: Project) {
  return {
    id: project.id,
    tenantId: project.tenantId,
    clientId: project.clientId,
    name: project.name,
    description: project.description,
    status: project.status,
    addressLine1: project.addressLine1,
    addressLine2: project.addressLine2,
    postalCode: project.postalCode,
    city: project.city,
    startDate: project.startDate,
    endDate: project.endDate,
    actualEndDate: project.actualEndDate,
    managerId: project.managerId,
    createdBy: project.createdBy,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toProjectHistoryEntity(row: ProjectStatusHistory) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    reason: row.reason,
    changedBy: row.changedBy,
    changedAt: row.changedAt,
  };
}

/** Builds the Prisma filter for the project list: status, client, search. */
export function buildProjectFilter(
  status?: ProjectStatus,
  clientId?: number,
  search?: string,
): Prisma.ProjectWhereInput {
  return {
    ...(status !== undefined && { status }),
    ...(clientId !== undefined && { clientId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}

// The one implementation lives in common (also used by contracts and tasks).
export { assertDateOrder } from '../../common/helpers/date-range.helper';
