import { Injectable } from '@nestjs/common';
import { OneTimeCode, OneTimeCodeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Exactly one of these three is set — same invariant as the `chk_code_one_owner` CHECK. */
export interface OneTimeCodeScope {
  tenantId?: number;
  userId?: number;
  adminUserId?: number;
}

/** The only place where the one-time-codes module talks to the database. */
@Injectable()
export class OneTimeCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
    codeHash: string,
    expiresAt: Date,
  ): Promise<OneTimeCode> {
    return this.prisma.oneTimeCode.create({
      data: { type, ...scope, codeHash, expiresAt },
    });
  }

  async deleteExpiredOlderThan(date: Date): Promise<number> {
    const { count } = await this.prisma.oneTimeCode.deleteMany({
      where: { expiresAt: { lt: date } },
    });
    return count;
  }

  findActive(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
  ): Promise<OneTimeCode | null> {
    return this.prisma.oneTimeCode.findFirst({
      where: {
        type,
        ...scope,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async consumePriorActive(
    type: OneTimeCodeType,
    scope: OneTimeCodeScope,
  ): Promise<void> {
    await this.prisma.oneTimeCode.updateMany({
      where: { type, ...scope, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  async incrementAttempt(id: number): Promise<void> {
    await this.prisma.oneTimeCode.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  /**
   * Takes one try off a code in a single statement: it only succeeds while
   * fewer than `maxAttempts` tries are used, so two simultaneous guesses can
   * never both slip under the limit.
   */
  async takeAttempt(id: number, maxAttempts: number): Promise<boolean> {
    const { count } = await this.prisma.oneTimeCode.updateMany({
      where: { id, attemptCount: { lt: maxAttempts } },
      data: { attemptCount: { increment: 1 } },
    });
    return count === 1;
  }

  async markConsumed(id: number): Promise<void> {
    await this.prisma.oneTimeCode.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
