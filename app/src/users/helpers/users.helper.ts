import { Prisma } from '@prisma/client';

/** Builds the Prisma filter to search in name, last name and phone. */
export function buildUserSearchFilter(search?: string): Prisma.UserWhereInput {
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ],
  };
}

/** Builds the paginated response. */
export function toPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
