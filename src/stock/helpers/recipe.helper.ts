import { Prisma } from '@prisma/client';

/**
 * One line that may reserve (or consume) stock through a service's recipe.
 *
 * JUDGMENT CALL (step 05, no quotes module exists yet to dictate the real
 * shape): modelled as `{ serviceId, quantity }` — `serviceId` nullable
 * because `quote_lines.service_id` is nullable on purpose (a free-text line
 * reserves nothing, doc/notes/qa-project-quote-stock-invoices.md). Step 06
 * (quote acceptance) and step 09 (site report pre-fill) are the two real
 * callers; if their actual line shape differs, map it to this interface at
 * the call site rather than changing the walk itself.
 */
export interface RecipeLine {
  serviceId: number | null | undefined;
  quantity: Prisma.Decimal.Value;
}

/** One `service_materials` row, as needed by the walk. */
export interface RecipeRow {
  materialId: number;
  quantityPerUnit: Prisma.Decimal.Value;
}

/**
 * The one implementation of the recipe walk (doc/notes/Phaces/05-Catalogue
 * & Stock.md):
 *
 *   for each line WITH a service_id:
 *     for each row in service_materials for that service:
 *       reserve[material] += line.quantity × quantity_per_unit
 *
 * Pure and reusable: `getRecipe` is injected so this file never touches a
 * repository or a service directly. `create-reservations.handler` (step 05)
 * calls it against accepted-quote lines; step 09's report pre-fill will call
 * it again against the service done on site — same function, two callers,
 * per the single-source-of-truth rule.
 */
export async function walkRecipe(
  lines: RecipeLine[],
  getRecipe: (serviceId: number) => Promise<RecipeRow[]>,
): Promise<Map<number, Prisma.Decimal>> {
  const reserve = new Map<number, Prisma.Decimal>();

  for (const line of lines) {
    if (line.serviceId === null || line.serviceId === undefined) continue;
    const recipe = await getRecipe(line.serviceId);
    for (const row of recipe) {
      const add = new Prisma.Decimal(row.quantityPerUnit).times(line.quantity);
      const current = reserve.get(row.materialId) ?? new Prisma.Decimal(0);
      reserve.set(row.materialId, current.plus(add));
    }
  }

  return reserve;
}
