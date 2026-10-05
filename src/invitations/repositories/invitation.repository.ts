import { Injectable } from '@nestjs/common';
import { Prisma, UserInvitation } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the invitations module talks to the database. */
@Injectable()
export class InvitationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  create(data: Prisma.UserInvitationCreateInput): Promise<UserInvitation> {
    return this.tenantPrisma.db.userInvitation.create({ data });
  }

  findById(id: number): Promise<UserInvitation | null> {
    return this.tenantPrisma.db.userInvitation.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.UserInvitationWhereInput,
    skip: number,
    take: number,
  ): Promise<[UserInvitation[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.userInvitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.userInvitation.count({ where }),
    ]);
  }

  /**
   * NOT tenant-filtered, on purpose — used by `findByHash` (verify/accept are
   * `@Public()`, the tenant is not known yet: the token IS how it's found)
   * and by `findOpenByEmailAnywhere` (open invitations are unique app-wide,
   * same reason as `users.email` — doc/notes/auth-tokens.md).
   */
  findByHash(tokenHash: string): Promise<UserInvitation | null> {
    return this.prisma.userInvitation.findUnique({ where: { tokenHash } });
  }

  findOpenByEmailAnywhere(email: string): Promise<UserInvitation | null> {
    return this.prisma.userInvitation.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  updateToken(
    id: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<UserInvitation> {
    return this.tenantPrisma.db.userInvitation.update({
      where: { id },
      data: { tokenHash, expiresAt },
    });
  }

  /** Called right after `TenantContextService.setTenantId()` on accept — the
   * row's own id is already known, so the raw client works just as well and
   * keeps this one call simple. */
  markAccepted(id: number): Promise<UserInvitation> {
    return this.prisma.userInvitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }

  async delete(id: number): Promise<void> {
    await this.tenantPrisma.db.userInvitation.delete({ where: { id } });
  }
}
