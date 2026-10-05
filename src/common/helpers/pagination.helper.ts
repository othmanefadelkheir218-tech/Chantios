/** Builds the paginated response of every list route. */
export function toPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Number of rows to skip for a 1-based page. */
export function toSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
