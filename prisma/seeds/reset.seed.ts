/**
 * Seed: everything, in order. Used by `yarn seed:reset` after the database is
 * dropped and the migration is re-applied (also by `prisma migrate reset`).
 *
 *   1. reference data   (roles, cost types, categories)
 *   2. super-admin
 *   3. demo tenants
 */
import { seedSuperAdmin } from './admin.seed';
import { seedData } from './data.seed';
import { runSeed } from './shared';
import { seedTenants } from './tenants.seed';

void runSeed('Seeding everything...', async () => {
  await seedData();
  await seedSuperAdmin();
  await seedTenants();
});
