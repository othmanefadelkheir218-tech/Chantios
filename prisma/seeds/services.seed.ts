/**
 * Seed: DEMO catalogue services for EVERY tenant, for testing only.
 *
 *   yarn seed:services       (run `yarn seed:data` first — services need the shared categories)
 *
 * Per tenant (not deleted): 5 works × 4 variants × 10 shared categories = 200
 * services, mixed units, prices and VAT (6 % on labour, else the tenant
 * default). About 5 % are inactive. When the tenant has materials, about 40 %
 * of the services get a recipe of 1 to 3 materials.
 *
 * Idempotent: a service whose description already exists in the tenant is
 * skipped. Random values come from a fixed seed, so every run gives the same
 * data. Never run this in production.
 */
import { Prisma } from '@prisma/client';
import { prisma, runSeed } from './shared';

type Work = { name: string; unit: 'm2' | 'ml' | 'h' | 'piece'; price: number; labour?: boolean };

/** By shared category name (data.seed.ts). Prices are per unit, excl. VAT. */
const WORKS: Record<string, Work[]> = {
  Painting: [
    { name: 'Peinture murale 2 couches', unit: 'm2', price: 18 },
    { name: 'Peinture plafond', unit: 'm2', price: 22 },
    { name: 'Laquage boiseries', unit: 'ml', price: 14 },
    { name: 'Enduit de lissage', unit: 'm2', price: 12 },
    { name: 'Main-d’œuvre peintre', unit: 'h', price: 45, labour: true },
  ],
  Tiling: [
    { name: 'Pose carrelage sol', unit: 'm2', price: 48 },
    { name: 'Pose faïence murale', unit: 'm2', price: 52 },
    { name: 'Plinthes carrelées', unit: 'ml', price: 16 },
    { name: 'Joints époxy', unit: 'm2', price: 11 },
    { name: 'Main-d’œuvre carreleur', unit: 'h', price: 48, labour: true },
  ],
  Plumbing: [
    { name: 'Pose WC suspendu', unit: 'piece', price: 420 },
    { name: 'Pose lavabo', unit: 'piece', price: 260 },
    { name: 'Tuyauterie multicouche', unit: 'ml', price: 28 },
    { name: 'Remplacement chauffe-eau', unit: 'piece', price: 690 },
    { name: 'Main-d’œuvre plombier', unit: 'h', price: 55, labour: true },
  ],
  Electricity: [
    { name: 'Point lumineux', unit: 'piece', price: 85 },
    { name: 'Prise de courant', unit: 'piece', price: 65 },
    { name: 'Câblage encastré', unit: 'ml', price: 19 },
    { name: 'Tableau électrique', unit: 'piece', price: 950 },
    { name: 'Main-d’œuvre électricien', unit: 'h', price: 55, labour: true },
  ],
  Masonry: [
    { name: 'Mur en blocs', unit: 'm2', price: 75 },
    { name: 'Chape ciment', unit: 'm2', price: 32 },
    { name: 'Ouverture de baie', unit: 'piece', price: 1450 },
    { name: 'Rejointoyage façade', unit: 'm2', price: 38 },
    { name: 'Main-d’œuvre maçon', unit: 'h', price: 50, labour: true },
  ],
  Carpentry: [
    { name: 'Pose porte intérieure', unit: 'piece', price: 320 },
    { name: 'Pose châssis', unit: 'piece', price: 780 },
    { name: 'Habillage escalier', unit: 'piece', price: 1900 },
    { name: 'Placard sur mesure', unit: 'ml', price: 410 },
    { name: 'Main-d’œuvre menuisier', unit: 'h', price: 52, labour: true },
  ],
  Roofing: [
    { name: 'Couverture tuiles', unit: 'm2', price: 95 },
    { name: 'Membrane EPDM', unit: 'm2', price: 68 },
    { name: 'Gouttière zinc', unit: 'ml', price: 54 },
    { name: 'Velux', unit: 'piece', price: 1150 },
    { name: 'Main-d’œuvre couvreur', unit: 'h', price: 58, labour: true },
  ],
  Insulation: [
    { name: 'Isolation laine de verre', unit: 'm2', price: 26 },
    { name: 'Isolation PIR toiture', unit: 'm2', price: 44 },
    { name: 'Isolation façade ETICS', unit: 'm2', price: 120 },
    { name: 'Pare-vapeur', unit: 'm2', price: 9 },
    { name: 'Main-d’œuvre isolation', unit: 'h', price: 46, labour: true },
  ],
  Flooring: [
    { name: 'Parquet contrecollé', unit: 'm2', price: 62 },
    { name: 'Sol vinyle clipsable', unit: 'm2', price: 35 },
    { name: 'Ragréage', unit: 'm2', price: 15 },
    { name: 'Plinthes bois', unit: 'ml', price: 12 },
    { name: 'Main-d’œuvre poseur de sol', unit: 'h', price: 44, labour: true },
  ],
  Demolition: [
    { name: 'Démolition cloison', unit: 'm2', price: 24 },
    { name: 'Dépose carrelage', unit: 'm2', price: 19 },
    { name: 'Évacuation gravats', unit: 'piece', price: 280 },
    { name: 'Décapage sol', unit: 'm2', price: 13 },
    { name: 'Main-d’œuvre démolition', unit: 'h', price: 40, labour: true },
  ],
};

/** Each work in 4 variants: the price moves a bit with the variant. */
const VARIANTS = [
  { label: 'standard', factor: 1 },
  { label: 'salle de bain', factor: 1.15 },
  { label: 'cuisine', factor: 1.1 },
  { label: 'premium', factor: 1.35 },
];

/** Small fixed-seed random (mulberry32): same data on every run. */
function randomFrom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seedTenant(tenant: { id: number; name: string }, categories: Map<string, number>) {
  const random = randomFrom(tenant.id * 7919);
  const existing = new Set(
    (await prisma.service.findMany({ where: { tenantId: tenant.id }, select: { description: true } })).map((s) => s.description),
  );
  const materials = await prisma.material.findMany({ where: { tenantId: tenant.id, isActive: true }, select: { id: true } });

  let created = 0;
  let recipes = 0;
  for (const [categoryName, works] of Object.entries(WORKS)) {
    const categoryId = categories.get(categoryName);
    if (!categoryId) continue;
    for (const work of works) {
      for (const variant of VARIANTS) {
        const description = `${work.name} — ${variant.label}`;
        if (existing.has(description)) continue;
        const price = work.price * variant.factor * (0.9 + random() * 0.2);
        const service = await prisma.service.create({
          data: {
            tenantId: tenant.id,
            categoryId,
            description,
            unit: work.unit,
            priceExclVat: new Prisma.Decimal(price.toFixed(2)),
            defaultVatRate: work.labour ? new Prisma.Decimal('6.00') : null,
            isActive: random() > 0.05,
          },
        });
        created++;

        if (materials.length > 0 && !work.labour && random() < 0.4) {
          const count = Math.min(materials.length, 1 + Math.floor(random() * 3));
          const picked = [...materials].sort(() => random() - 0.5).slice(0, count);
          await prisma.serviceMaterial.createMany({
            data: picked.map((m) => ({
              tenantId: tenant.id,
              serviceId: service.id,
              materialId: m.id,
              quantityPerUnit: new Prisma.Decimal((0.1 + random() * 4.9).toFixed(4)),
            })),
            skipDuplicates: true,
          });
          recipes++;
        }
      }
    }
  }
  console.log(`  #${tenant.id} ${tenant.name.padEnd(28)} ${created} new services, ${recipes} with a recipe`);
}

export async function seedServices() {
  const shared = await prisma.category.findMany({ where: { tenantId: null }, select: { id: true, name: true } });
  if (shared.length === 0) throw new Error('No shared categories — run `yarn seed:data` first');
  const categories = new Map(shared.map((c) => [c.name, c.id]));

  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { id: 'asc' } });
  for (const tenant of tenants) await seedTenant(tenant, categories);
}

if (require.main === module) {
  void runSeed('Seeding demo services for every tenant...', seedServices);
}
