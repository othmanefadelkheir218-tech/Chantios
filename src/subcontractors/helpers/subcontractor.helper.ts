import { Prisma, Subcontractor } from '@prisma/client';

/** What may leave the module. Internal only — never shown in the portal. */
export function toSubcontractorEntity(subcontractor: Subcontractor) {
  return {
    id: subcontractor.id,
    tenantId: subcontractor.tenantId,
    companyName: subcontractor.companyName,
    trade: subcontractor.trade,
    email: subcontractor.email,
    phone: subcontractor.phone,
    vatNumber: subcontractor.vatNumber,
    hourlyRate: subcontractor.hourlyRate,
    isActive: subcontractor.isActive,
    createdAt: subcontractor.createdAt,
    updatedAt: subcontractor.updatedAt,
  };
}

/** Builds the Prisma filter for the directory list: search + trade + active state. */
export function buildSubcontractorFilter(
  search?: string,
  trade?: string,
  isActive?: boolean,
): Prisma.SubcontractorWhereInput {
  return {
    ...(isActive !== undefined && { isActive }),
    ...(trade && { trade: { equals: trade, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}
