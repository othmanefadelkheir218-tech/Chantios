import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContextService } from '../cls/tenant-context.service';

/**
 * The only 8 tables excluded from tenant scoping — platform-level data with
 * no `tenant_id` column. See doc/notes/technical/build-order.md § 1b. Every
 * other table gets `tenant_id` injected automatically, child tables included.
 */
export const TENANT_EXTENSION_SKIP_LIST = [
  'Tenant',
  'AdminUser',
  'Plan',
  'PlanFeature',
  'StripeEvent',
  'Role',
  'RefreshToken',
  'OneTimeCode',
] as const;

const READ_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);
const WHERE_OPS = new Set([
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
]);

/**
 * A Prisma client extension, not Postgres RLS (decision recorded in
 * doc/notes/technical/build-order.md § 1b). Reads `tenant_id` from
 * `TenantContextService` (`nestjs-cls`) and injects it into every query for a
 * table that isn't in the skip list above.
 *
 * `categories` and `cost_types` have a nullable `tenant_id` (shared defaults)
 * and are deliberately NOT handled here — they need `WHERE tenant_id IS NULL
 * OR tenant_id = :current`, read through their own dedicated repository
 * method on the raw client, never through this generic extension.
 *
 * Fails loudly (throws) rather than silently running an unscoped query when a
 * tenant-owned table is queried with no tenant in context — a request that
 * reaches a handler without `TenantGuard` having run is a bug, not a case to
 * paper over. The one legitimate exception is tenant registration, which
 * calls `TenantContextService.setTenantId()` itself right after creating the
 * `tenants` row, before writing the first `users` row in the same transaction.
 *
 * **Rule for every repository's `create`/`createMany` through this client:**
 * use scalar foreign keys (`roleId: 5`), never a relation connect
 * (`role: { connect: { id: 5 } }`), for every OTHER foreign key on the row.
 * The injected `tenantId` here is always a scalar — Prisma's `create()`
 * rejects a payload that mixes the "checked" (relation) and "unchecked"
 * (scalar) input styles across different foreign keys in the same call.
 */
export function tenantExtension(tenantContext: TenantContextService) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-scope',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (
              (TENANT_EXTENSION_SKIP_LIST as readonly string[]).includes(model)
            ) {
              return query(args);
            }

            const tenantId = tenantContext.tenantId;
            if (tenantId === undefined) {
              throw new Error(
                `Tenant-scoped query on "${model}.${operation}" ran with no tenant in context — ` +
                  'TenantGuard must run before this handler, or the handler must call ' +
                  'TenantContextService.setTenantId() first (registration only).',
              );
            }

            const scopedArgs = args as {
              where?: Record<string, unknown>;
              data?: Record<string, unknown> | Record<string, unknown>[];
              create?: Record<string, unknown>;
            };

            if (READ_OPS.has(operation)) {
              scopedArgs.where = { ...scopedArgs.where, tenantId };
            } else if (CREATE_OPS.has(operation)) {
              if (operation === 'create') {
                scopedArgs.data = { ...scopedArgs.data, tenantId };
              } else if (Array.isArray(scopedArgs.data)) {
                scopedArgs.data = scopedArgs.data.map((row) => ({
                  ...row,
                  tenantId,
                }));
              }
            } else if (operation === 'upsert') {
              scopedArgs.where = { ...scopedArgs.where, tenantId };
              scopedArgs.create = { ...scopedArgs.create, tenantId };
            } else if (WHERE_OPS.has(operation)) {
              scopedArgs.where = { ...scopedArgs.where, tenantId };
            }

            return query(scopedArgs);
          },
        },
      },
    }),
  );
}

/**
 * A plain function (not a method reference) so `ReturnType<typeof ...>`
 * resolves to the real extended-client type instead of collapsing to
 * `unknown` — `$extends` is generic enough that TypeScript can only carry
 * it through an actual call, not an indexed-access type.
 */
export function applyTenantExtension(
  prisma: PrismaClient,
  tenantContext: TenantContextService,
) {
  return prisma.$extends(tenantExtension(tenantContext));
}
