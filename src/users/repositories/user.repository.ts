import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the users module talks to the database. */
@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * `tx` — step 02 registration runs this inside its own transaction, on the
   * raw (unextended) client; `tenantId` must then be set explicitly in
   * `data`, same reason as `findByEmail` below.
   */
  create(
    data: Prisma.UserCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    if (tx) return tx.user.create({ data });
    return this.tenantPrisma.db.user.create({ data });
  }

  /**
   * NOT tenant-filtered, on purpose: login (dashboard and mobile) has no
   * company field, so the tenant is unknown at this point — `users.email`
   * is unique app-wide precisely so this lookup works. Uses the raw client,
   * bypassing the tenant extension entirely (doc/notes/auth-tokens.md).
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.tenantPrisma.db.user.findFirst({ where: { id } });
  }

  /**
   * NOT tenant-filtered — for flows that resolve a user by the id inside a
   * JWT before (or without) a tenant ever being set in context: refresh,
   * change-password. Safe: a primary-key lookup, not a list, and the id
   * comes from a token this app itself signed, not from user input.
   */
  findByIdUnscoped(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Active users of the CURRENT tenant with their role name — what the
   * notifications module needs to pick recipients. `ids` narrows it to named
   * users (a worker's task, the members of a conversation).
   */
  findActiveWithRole(ids?: number[]) {
    return this.tenantPrisma.db.user.findMany({
      where: { isActive: true, ...(ids && { id: { in: ids } }) },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        role: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findMany(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
  ): Promise<[User[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.user.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.tenantPrisma.db.user.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<User> {
    return this.tenantPrisma.db.user.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * NOT tenant-filtered, same reason as `findByEmail`: `forgot-password` and
   * `reset-password` are `@Public()` and resolve `id` through that unscoped
   * lookup — there is no tenant in context to scope this write against.
   * Safe because it targets one row by primary key, not a list.
   */
  setPasswordHash(id: number, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /** Admin-initiated, inside an authenticated+tenant-known request — tenant-scoped. */
  setMobilePin(id: number, mobilePinHash: string): Promise<User> {
    return this.tenantPrisma.db.user.update({
      where: { id },
      data: { mobilePinHash, failedPinCount: 0 },
    });
  }

  /** NOT tenant-filtered — same reason as `setPasswordHash` above (`@Public()` verify-email). */
  setEmailVerified(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  /**
   * Billing renewal (step 14) runs outside any request, with no tenant in
   * `nestjs-cls` — it names the tenant explicitly and uses the raw client.
   */
  countActiveByRole(tenantId: number, roleId: number): Promise<number> {
    return this.prisma.user.count({
      where: { tenantId, roleId, isActive: true },
    });
  }

  /**
   * The tenant's own active user of this role, first by id — used by
   * impersonation (step 16) to find the `admin`-role user to act as. Same
   * unscoped-by-design reasoning as `countActiveByRole`: the admin route runs
   * with no tenant in `nestjs-cls`.
   */
  findFirstActiveByRole(
    tenantId: number,
    roleId: number,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, roleId, isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * The `max_managers` billing dimension (step 14): active users with any
   * role OTHER than `roleId` (the worker role). Same unscoped-by-design
   * reasoning as `countActiveByRole` above — the renewal job runs outside
   * any request, with no tenant in `nestjs-cls`.
   */
  countActiveExcludingRole(tenantId: number, roleId: number): Promise<number> {
    return this.prisma.user.count({
      where: { tenantId, isActive: true, roleId: { not: roleId } },
    });
  }

  /** NOT tenant-filtered — `mobile-login` is `@Public()`, same reason as `findByEmail`. */
  async bumpFailedPin(id: number): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { failedPinCount: { increment: 1 } },
      select: { failedPinCount: true },
    });
    return user.failedPinCount;
  }

  async resetFailedPin(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { failedPinCount: 0 },
    });
  }
}
