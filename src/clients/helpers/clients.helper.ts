import { BadRequestException } from '@nestjs/common';
import { Client, ClientType, Prisma } from '@prisma/client';

/** What may leave the module. Mirrors `users/helpers/user.helper.ts`. */
export function toClientEntity(client: Client) {
  return {
    id: client.id,
    tenantId: client.tenantId,
    type: client.type,
    name: client.name,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone,
    phoneSecondary: client.phoneSecondary,
    vatNumber: client.vatNumber,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    note: client.note,
    isActive: client.isActive,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

/** Builds the Prisma filter for the client list: search + active state. */
export function buildClientFilter(
  search?: string,
  isActive?: boolean,
): Prisma.ClientWhereInput {
  return {
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}

/**
 * The single implementation of "`vat_number` required for `professional`"
 * (doc/notes/technical/phase-03-clients-projects.md). Backed by the DB's
 * `chk_professional_has_vat` constraint — this is the handler-level check
 * the step file asks for in addition to it.
 */
export function assertVatNumberForType(
  type: ClientType,
  vatNumber: string | null | undefined,
): void {
  if (type === 'professional' && !vatNumber) {
    throw new BadRequestException(
      'vat_number is required for a professional client',
    );
  }
}
