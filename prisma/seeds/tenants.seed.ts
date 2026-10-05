/**
 * Seed: DEMO tenants, for development only.
 *
 *   yarn seed:tenants        (run `yarn seed:data` first — users need the roles)
 *
 * Creates, per demo company: the tenant, its trial subscription, and users.
 * Also creates ONE demo plan ("Demo Starter"), because a tenant cannot exist
 * without a plan. It is marked is_default only if no default plan exists yet,
 * so it never replaces a real default plan made by the super-admin.
 *
 * Every demo user shares one password (see DEMO_PASSWORD below). Workers log in
 * on mobile with a PIN. Never run this in production.
 */
import { hashSecret, prisma, runSeed } from './shared';

const DEMO_PASSWORD = 'Demo@12345678';
const DEMO_PIN = '1234';
const DEMO_PLAN_NAME = 'Demo Starter';

const PLAN_FEATURES = [
  { featureKey: 'max_workers', limitValue: 5, overageRate: '2.00' },
  { featureKey: 'max_managers', limitValue: 3, overageRate: '5.00' },
  { featureKey: 'max_clients', limitValue: 50, overageRate: '0.20' },
  { featureKey: 'max_subcontractors', limitValue: 20, overageRate: '0.20' },
  { featureKey: 'storage_gb', limitValue: 20, overageRate: '0.50' },
  { featureKey: 'retention_days', limitValue: 365, overageRate: '0' },
];

interface DemoUser {
  email: string;
  name: string;
  phone: string;
  roleId: number;
  hourlyRate: string;
}

interface DemoTenant {
  name: string;
  legalName: string;
  vatNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
  locale: string;
  users: DemoUser[];
}

const TENANTS: DemoTenant[] = [
  {
    name: 'Rénovation Dupont',
    legalName: 'Dupont Rénovation SRL',
    vatNumber: 'BE0123456789',
    registrationNumber: '0123.456.789',
    email: 'contact@renovation-dupont.test',
    phone: '+32 2 123 45 67',
    addressLine1: 'Rue de la Loi 100',
    postalCode: '1000',
    city: 'Brussels',
    country: 'BE',
    locale: 'fr',
    // One user per role, so every permission level can be tried.
    users: [
      { roleId: 1, name: 'Marc Dupont', email: 'admin@dupont.test', phone: '+32 470 11 11 11', hourlyRate: '45.00' },
      { roleId: 2, name: 'Sophie Martin', email: 'manager@dupont.test', phone: '+32 470 22 22 22', hourlyRate: '38.00' },
      { roleId: 3, name: 'Luc Peeters', email: 'supervisor@dupont.test', phone: '+32 470 33 33 33', hourlyRate: '32.00' },
      { roleId: 4, name: 'Karim Benali', email: 'leader@dupont.test', phone: '+32 470 44 44 44', hourlyRate: '28.00' },
      { roleId: 5, name: 'Youssef Amrani', email: 'worker@dupont.test', phone: '+32 470 55 55 55', hourlyRate: '20.00' },
      { roleId: 6, name: 'Emma Janssens', email: 'sales@dupont.test', phone: '+32 470 66 66 66', hourlyRate: '30.00' },
      { roleId: 7, name: 'Nadia Claes', email: 'accountant@dupont.test', phone: '+32 470 77 77 77', hourlyRate: '35.00' },
    ],
  },
  {
    name: 'Bouw Verhelst',
    legalName: 'Verhelst Bouw BV',
    vatNumber: 'BE0987654321',
    registrationNumber: '0987.654.321',
    email: 'info@bouw-verhelst.test',
    phone: '+32 3 987 65 43',
    addressLine1: 'Meir 25',
    postalCode: '2000',
    city: 'Antwerp',
    country: 'BE',
    locale: 'en',
    users: [
      { roleId: 1, name: 'Jan Verhelst', email: 'admin@verhelst.test', phone: '+32 480 11 11 11', hourlyRate: '50.00' },
      { roleId: 2, name: 'Lotte Maes', email: 'manager@verhelst.test', phone: '+32 480 22 22 22', hourlyRate: '36.00' },
      { roleId: 5, name: 'Ahmed Haddad', email: 'worker@verhelst.test', phone: '+32 480 55 55 55', hourlyRate: '18.00' },
    ],
  },
];

async function seedDemoPlan(): Promise<string> {
  const existing = await prisma.plan.findFirst({
    where: { name: DEMO_PLAN_NAME },
  });
  if (existing) {
    console.log(`  plans         "${DEMO_PLAN_NAME}" already exists`);
    return existing.id;
  }

  const hasDefault = (await prisma.plan.count({ where: { isDefault: true } })) > 0;
  const plan = await prisma.plan.create({
    data: {
      name: DEMO_PLAN_NAME,
      basePrice: '50.00',
      isDefault: !hasDefault,
      features: { create: PLAN_FEATURES },
    },
  });
  console.log(
    `  plans         "${DEMO_PLAN_NAME}" created${hasDefault ? '' : ' (default)'}`,
  );
  return plan.id;
}

async function seedTenant(data: DemoTenant, planId: string, hashes: Hashes) {
  const { users, ...tenantFields } = data;

  let tenant = await prisma.tenant.findUnique({
    where: { email: tenantFields.email },
  });
  if (tenant) {
    console.log(`  tenants       ${data.name} already exists — left untouched`);
    return;
  }

  tenant = await prisma.tenant.create({ data: tenantFields });

  const now = new Date();
  await prisma.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      planId,
      status: 'trialing',
      periodStart: now,
      periodEnd: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  for (const user of users) {
    const isWorker = user.roleId === 5;
    await prisma.user.create({
      data: {
        ...user,
        email: user.email.toLowerCase(),
        tenantId: tenant.id,
        passwordHash: hashes.password,
        mobilePinHash: isWorker ? hashes.pin : null,
        emailVerifiedAt: now,
      },
    });
  }
  console.log(`  tenants       ${data.name} created (${users.length} users)`);
}

interface Hashes {
  password: string;
  pin: string;
}

export async function seedTenants() {
  const roles = await prisma.role.count();
  if (roles < 7) {
    throw new Error('Roles are missing — run `yarn seed:data` first');
  }

  const planId = await seedDemoPlan();
  const hashes: Hashes = {
    password: await hashSecret(DEMO_PASSWORD),
    pin: await hashSecret(DEMO_PIN),
  };
  for (const tenant of TENANTS) {
    await seedTenant(tenant, planId, hashes);
  }

  console.log('');
  console.log('  ┌──────────────────────────────────────────────');
  console.log(`  │  demo password  ${DEMO_PASSWORD}`);
  console.log(`  │  worker PIN     ${DEMO_PIN}`);
  console.log('  │');
  console.log('  │  admin@dupont.test    admin@verhelst.test');
  console.log('  │  (Dupont has one user per role)');
  console.log('  └──────────────────────────────────────────────');
}

if (require.main === module) {
  void runSeed('Seeding demo tenants...', seedTenants);
}
