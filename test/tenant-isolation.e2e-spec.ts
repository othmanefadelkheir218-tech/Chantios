import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import { prismaClientOptions } from '../src/config/prisma.config';
import {
  applyTenantExtension,
  TENANT_EXTENSION_SKIP_LIST,
} from '../src/common/prisma/tenant-extension';
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
        } as Prisma.UserUncheckedCreateInput,
      });
      await tenantPrisma.db.userInvitation.create({
        data: {
          email: `a-invite-${stamp}@test.local`,
          name: 'A invite',
          roleId: 5,
          tokenHash: `a-hash-${stamp}`,
          invitedBy: (await tenantPrisma.db.user.findFirstOrThrow()).id,
          expiresAt: new Date(Date.now() + 86_400_000),
        } as Prisma.UserInvitationUncheckedCreateInput,
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
        } as Prisma.RolePermissionUncheckedCreateInput,
      });
    });

    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      await tenantPrisma.db.user.create({
        data: {
          name: 'B user',
          email: `b-user-${stamp}@test.local`,
          roleId: 1,
        } as Prisma.UserUncheckedCreateInput,
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

  it("users: findUnique / findUniqueOrThrow cannot reach another tenant's row", async () => {
    const aUser = await prisma.user.findFirstOrThrow({
      where: { tenantId: tenantAId },
    });
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      expect(
        await tenantPrisma.db.user.findUnique({ where: { id: aUser.id } }),
      ).toBeNull();
      await expect(
        tenantPrisma.db.user.findUniqueOrThrow({ where: { id: aUser.id } }),
      ).rejects.toThrow();
    });
  });

  it("users: tenant B cannot update or delete tenant A's row", async () => {
    const aUser = await prisma.user.findFirstOrThrow({
      where: { tenantId: tenantAId },
    });
    await cls.run(async () => {
      tenantContext.setTenantId(tenantBId);
      const updated = await tenantPrisma.db.user.updateMany({
        where: { id: aUser.id },
        data: { name: 'HACKED' },
      });
      expect(updated.count).toBe(0);
      await expect(
        tenantPrisma.db.user.update({
          where: { id: aUser.id },
          data: { name: 'HACKED' },
        }),
      ).rejects.toThrow();
      await expect(
        tenantPrisma.db.user.delete({ where: { id: aUser.id } }),
      ).rejects.toThrow();
      const deleted = await tenantPrisma.db.user.deleteMany({
        where: { id: aUser.id },
      });
      expect(deleted.count).toBe(0);
    });
    const still = await prisma.user.findUniqueOrThrow({
      where: { id: aUser.id },
    });
    expect(still.name).toBe('A user');
  });

  describe('every tenant-scoped table (all models in the schema)', () => {
    type Delegate = {
      findMany: (args?: object) => Promise<{ tenantId: number | null }[]>;
      count: (args?: object) => Promise<number>;
    };
    const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
    const skip = TENANT_EXTENSION_SKIP_LIST as readonly string[];
    const models = Prisma.dmmf.datamodel.models
      .map((m) => m.name)
      .filter((name) => !skip.includes(name));

    it('covers the whole schema: 52 models = 8 skip-listed + the rest scoped', () => {
      expect(Prisma.dmmf.datamodel.models.length).toBe(52);
      expect(models.length).toBe(44);
    });

    it('every scoped model returns only the current tenant, and nothing for an unknown tenant', async () => {
      const raw = prisma as unknown as Record<string, Delegate>;
      const scoped = tenantPrisma.db as unknown as Record<string, Delegate>;
      const withData: string[] = [];
      const failures: string[] = [];

      for (const model of models) {
        const key = lcFirst(model);
        const rows = await raw[key].findMany({});
        const tenantsInTable = new Set(
          rows.map((r) => r.tenantId).filter((x): x is number => x !== null),
        );

        // 1. an unknown tenant sees nothing, whatever the table holds
        await cls.run(async () => {
          tenantContext.setTenantId(999_999_999);
          const found = await scoped[key].findMany({});
          const total = await scoped[key].count({});
          if (found.length !== 0 || total !== 0)
            failures.push(`${model}: unknown tenant saw rows`);
        });

        // 2. each real tenant sees exactly its own rows
        for (const tenantId of tenantsInTable) {
          await cls.run(async () => {
            tenantContext.setTenantId(tenantId);
            const found = await scoped[key].findMany({});
            const total = await scoped[key].count({});
            const expected = rows.filter((r) => r.tenantId === tenantId).length;
            if (
              found.some((r) => r.tenantId !== tenantId) ||
              found.length !== expected ||
              total !== expected
            ) {
              failures.push(`${model}: tenant ${tenantId} saw a wrong row set`);
            }
          });
        }
        if (tenantsInTable.size >= 2) withData.push(model);
      }

      console.log(
        `Isolation checked on ${models.length} tables; ` +
          `${withData.length} had rows from 2+ tenants: ${withData.join(', ')}`,
      );
      expect(failures).toEqual([]);
      expect(withData.length).toBeGreaterThanOrEqual(2);
    });

    it('the SQL of every read and delete on every scoped table carries the tenant filter', async () => {
      const logged = new PrismaClient({
        ...prismaClientOptions,
        log: [{ emit: 'event', level: 'query' }],
      });
      const queries: string[] = [];
      (
        logged as unknown as {
          $on: (e: 'query', cb: (q: { query: string }) => void) => void;
        }
      ).$on('query', (q) => queries.push(q.query));
      const scoped = applyTenantExtension(
        logged,
        tenantContext,
      ) as unknown as Record<
        string,
        Record<string, (args: object) => Promise<unknown>>
      >;
      const missing: string[] = [];

      await cls.run(async () => {
        tenantContext.setTenantId(tenantAId);
        for (const model of models) {
          const key = lcFirst(model);
          const hasId = Prisma.dmmf.datamodel.models
            .find((m) => m.name === model)!
            .fields.some((f) => f.name === 'id');
          const calls: [string, object][] = [
            ['findMany', {}],
            ['findFirst', {}],
            ['count', {}],
          ];
          if (hasId) {
            // id -1 never exists, so these delete nothing.
            calls.push(['findUnique', { where: { id: -1 } }]);
            calls.push(['deleteMany', { where: { id: -1 } }]);
          }
          for (const [op, args] of calls) {
            queries.length = 0;
            await scoped[key][op](args);
            const sql = queries.filter((q) => /^(SELECT|DELETE)/.test(q));
            if (
              sql.length === 0 ||
              !sql.every((q) => /"tenant_id" = \$\d+/.test(q))
            ) {
              missing.push(`${model}.${op}`);
            }
          }
        }
      });
      await logged.$disconnect();
      expect(missing).toEqual([]);
    });

    it('a scoped query with no tenant in context throws, on every scoped table', async () => {
      const scoped = tenantPrisma.db as unknown as Record<string, Delegate>;
      await cls.run(async () => {
        for (const model of models) {
          await expect(scoped[lcFirst(model)].findMany({})).rejects.toThrow(
            'no tenant in context',
          );
        }
      });
    });
  });
});
