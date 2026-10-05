/**
 * Seed: the necessary reference data. No admin, no tenant, no plan.
 *
 *   yarn seed:data
 *
 *   roles        7 rows, SMALLINT ids 1-7        (doc/notes/roles-permissions.md)
 *   cost_types   3 shared defaults, tenant_id = NULL   (doc/notes/purchase-invoices.md)
 *   categories   shared defaults, tenant_id = NULL     (doc/notes/catalogue-stock-...md)
 */
import { prisma, runSeed } from './shared';

/** The 7 fixed roles. A tenant never creates a role — it overrides permissions. */
const ROLES = [
  { id: 1, name: 'admin', label: 'Main Manager' },
  { id: 2, name: 'manager', label: 'Sub Manager' },
  { id: 3, name: 'site_supervisor', label: 'Site Supervisor' },
  { id: 4, name: 'team_leader', label: 'Team Leader' },
  { id: 5, name: 'worker', label: 'Worker' },
  { id: 6, name: 'sales', label: 'Sales' },
  { id: 7, name: 'accountant', label: 'Accountant' },
];

/**
 * The margin groups bills by cost type. `material` is special: a bill of this
 * type never carries a project (a DB trigger enforces it), because material
 * cost already enters the margin through the stock ledger.
 */
const COST_TYPES = ['material', 'subcontractor', 'labor'];

/** Shared catalogue categories. A tenant adds its own rows on top. */
const CATEGORIES = [
  'Painting',
  'Tiling',
  'Plumbing',
  'Electricity',
  'Masonry',
  'Carpentry',
  'Roofing',
  'Insulation',
  'Flooring',
  'Demolition',
];

async function seedRoles() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { label: role.label, isActive: true },
      create: role,
    });
  }
  console.log(`  roles         ${ROLES.length} ok`);
}

/**
 * categories and cost_types have a NULLABLE tenant_id, and NULL never collides
 * in a unique index — so there is no unique key to upsert on. Look the row up
 * by (tenant_id IS NULL, name) and only create it when it is missing.
 */
async function seedCostTypes() {
  let created = 0;
  for (const name of COST_TYPES) {
    const existing = await prisma.costType.findFirst({
      where: { tenantId: null, name },
    });
    if (!existing) {
      await prisma.costType.create({ data: { tenantId: null, name } });
      created++;
    }
  }
  console.log(`  cost_types    ${COST_TYPES.length} ok (${created} new)`);
}

async function seedCategories() {
  let created = 0;
  for (const name of CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { tenantId: null, name },
    });
    if (!existing) {
      await prisma.category.create({ data: { tenantId: null, name } });
      created++;
    }
  }
  console.log(`  categories    ${CATEGORIES.length} ok (${created} new)`);
}

export async function seedData() {
  await seedRoles();
  await seedCostTypes();
  await seedCategories();
}

if (require.main === module) {
  void runSeed('Seeding reference data...', seedData);
}
