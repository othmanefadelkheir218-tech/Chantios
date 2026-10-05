import { Injectable } from '@nestjs/common';
import { PermissionModule, Prisma, Role, RolePermission } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface PermissionOverrideData {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: RolePermission['scope'];
}

/**
 * The only place where the roles module talks to the database. Covers both
 * `roles` (one of the 8 skip-listed platform tables — seeded, shared by
 * every tenant, read through the raw client) and `role_permissions`
 * (tenant-owned overrides, read through the tenant-scoped client).
 */
@Injectable()
export class RoleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  findAllRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({ orderBy: { id: 'asc' } });
  }

  findRoleById(id: number): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  /** Every override row for the current tenant (all 7 roles, all modules set). */
  findAllOverrides(): Promise<RolePermission[]> {
    return this.tenantPrisma.db.rolePermission.findMany({
      orderBy: [{ roleId: 'asc' }, { module: 'asc' }],
    });
  }

  /** Every override row for one role, this tenant — used by `PermissionGuard`. */
  findOverridesForRole(roleId: number): Promise<RolePermission[]> {
    return this.tenantPrisma.db.rolePermission.findMany({ where: { roleId } });
  }

  findOverride(
    roleId: number,
    module: PermissionModule,
  ): Promise<RolePermission | null> {
    return this.tenantPrisma.db.rolePermission.findFirst({
      where: { roleId, module },
    });
  }

  async upsertOverride(
    roleId: number,
    module: PermissionModule,
    data: PermissionOverrideData,
  ): Promise<RolePermission> {
    const existing = await this.findOverride(roleId, module);
    if (existing) {
      return this.tenantPrisma.db.rolePermission.update({
        where: { id: existing.id },
        data,
      });
    }
    // `tenantId` is always overwritten by the tenant extension at create
    // time (common/prisma/tenant-extension.ts), so it's safe to omit here —
    // the cast only satisfies a type that can't know that at compile time.
    return this.tenantPrisma.db.rolePermission.create({
      data: {
        roleId,
        module,
        ...data,
      } as Prisma.RolePermissionUncheckedCreateInput,
    });
  }

  async removeOverride(
    roleId: number,
    module: PermissionModule,
  ): Promise<void> {
    await this.tenantPrisma.db.rolePermission.deleteMany({
      where: { roleId, module },
    });
  }
}
