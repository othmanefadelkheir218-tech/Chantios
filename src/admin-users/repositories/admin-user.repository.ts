import { Injectable } from '@nestjs/common';
import { AdminUser, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the admin-users module talks to the database. */
@Injectable()
export class AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AdminUserCreateInput): Promise<AdminUser> {
    return this.prisma.adminUser.create({ data });
  }

  async findMany(
    where: Prisma.AdminUserWhereInput,
    skip: number,
    take: number,
  ): Promise<[AdminUser[], number]> {
    return this.prisma.$transaction([
      this.prisma.adminUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.adminUser.count({ where }),
    ]);
  }

  findById(id: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }

  update(id: string, data: Prisma.AdminUserUpdateInput): Promise<AdminUser> {
    return this.prisma.adminUser.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<AdminUser> {
    return this.prisma.adminUser.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
