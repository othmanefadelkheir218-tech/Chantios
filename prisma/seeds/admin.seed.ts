/**
 * Seed: the super-admin. Nothing else.
 *
 *   yarn seed:admin
 *
 * `admin_users` has no public endpoint ("internal only"), so without this
 * nobody could ever create the first admin.
 *
 * Email and password come from `.env` (dev mode — no random password):
 *   SEED_ADMIN_EMAIL     required
 *   SEED_ADMIN_PASSWORD  required, min 12 chars
 *
 * `.env` is the source of truth: the admin is created if missing, and its
 * password is re-synced from `.env` on every run.
 */
import { hashSecret, prisma, runSeed } from './shared';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — add it to your .env`);
  return value;
}

export async function seedSuperAdmin() {
  const email = requiredEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('SEED_ADMIN_PASSWORD');

  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
  }

  const passwordHash = await hashSecret(password);
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash, isActive: true },
    });
    console.log(`  admin_users   ${email} updated (password from .env)`);
  } else {
    await prisma.adminUser.create({
      data: { email, name: 'Super Admin', passwordHash, role: 'super_admin' },
    });
    console.log(`  admin_users   ${email} created (password from .env)`);
  }
}

if (require.main === module) {
  void runSeed('Seeding the super-admin...', seedSuperAdmin);
}
