import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { AppModule } from '../src/app.module';
import { TenantContextService } from '../src/common/cls/tenant-context.service';
import { TenantPrismaService } from '../src/common/prisma/tenant-prisma.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * doc/notes/Phaces/02-auth-users.md Tasks: "Test: tenant A cannot read
 * tenant B's rows, for 3 different tables." Runs against the real dev
 * database (not mocked) — this is what actually proves the Prisma extension
 * works, which a handler-level unit test (mocked repository) cannot.
 */
describe('Tenant isolation — the Prisma extension (real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cls: ClsService;
  let tenantContext: TenantContextService;
  let tenantPrisma: TenantPrismaService;
  let tenantAId: number;
  let tenantBId: number;
  const stamp = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    cls = app.get(ClsService);
    tenantContext = app.get(TenantContextService);
    tenantPrisma = app.get(TenantPrismaService);

    const tenantA = await prisma.tenant.create({
      data: { name: 'Isolation Test A', email: `iso-a-${stamp}@test.local` },
    });
    const tenantB = await prisma.tenant.create({
      data: { name: 'Isolation Test B', email: `iso-b-${stamp}@test.local` },
    });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;

    await cls.run(async () => {
      tenantContext.setTenantId(tenantAId);
      await tenantPrisma.db.user.create({
        data: {
          name: 'A user',
          email: `a-user-${stamp}@test.local`,
          roleId: 1,
        },
      });
      await tenantPrisma.db.userInvitation.create({
        data: {
          email: `a-invite-${stamp}@test.local`,
          name: 'A invite',
          roleId: 5,
          tokenHash: `a-hash-${stamp}`,
          invitedBy: (await tenantPrisma.db.user.findFirstOrThrow()).id,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
      await tenantPrisma.db.rolePermission.create({
        data: {
          roleId: 2,
          module: 'invoices',
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          scope: 'all',
        },
      });
    });

    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      await tenantPrisma.db.user.create({
        data: {
          name: 'B user',
          email: `b-user-${stamp}@test.local`,
          roleId: 1,
        },
      });
    });
  });

  afterAll(async () => {
    await prisma.rolePermission.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId] } },
    });
    await prisma.userInvitation.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId] } },
    });
    await prisma.user.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId] } },
    });
    await app.close();
  });

  it("users: tenant B sees none of tenant A's rows", async () => {
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      const users = await tenantPrisma.db.user.findMany({});
      expect(users.every((u) => u.tenantId === tenantBId)).toBe(true);
      expect(users.some((u) => u.email === `a-user-${stamp}@test.local`)).toBe(
        false,
      );
    });
  });

  it("users: tenant B cannot fetch tenant A's row by id", async () => {
    const aUser = await prisma.user.findFirst({
      where: { tenantId: tenantAId },
    });
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      const found = await tenantPrisma.db.user.findFirst({
        where: { id: aUser!.id },
      });
      expect(found).toBeNull();
    });
  });

  it("user_invitations: tenant B sees none of tenant A's open invitations", async () => {
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      const invitations = await tenantPrisma.db.userInvitation.findMany({});
      expect(invitations.every((i) => i.tenantId === tenantBId)).toBe(true);
    });
  });

  it("role_permissions: tenant B sees none of tenant A's overrides", async () => {
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      const overrides = await tenantPrisma.db.rolePermission.findMany({});
      expect(overrides.length).toBe(0);
    });
  });

  it('throws rather than running unscoped when no tenant is in context', async () => {
    await cls.run(async () => {
      await expect(tenantPrisma.db.user.findMany({})).rejects.toThrow(
        'no tenant in context',
      );
    });
  });
});
