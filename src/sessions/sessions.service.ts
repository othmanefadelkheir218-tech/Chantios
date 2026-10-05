import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

export interface IssueSessionInput {
  userId?: number;
  adminUserId?: number;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

/**
 * The `refresh_tokens` table, shared by every module that needs to issue or
 * kill a session: `auth` (login, refresh, logout, mobile login, admin login),
 * `users` (deactivate an employee), `tenants` (suspend/ban a tenant) and
 * `admin-users` (deactivate a platform admin). Kept as its own leaf module —
 * same reason `src/stripe/` sits outside `subscriptions`/`plans` — so none of
 * those four modules has to import another just for this.
 */
@Injectable()
export class SessionsService {
  constructor(
    @InjectPinoLogger(SessionsService.name)
    private readonly logger: PinoLogger,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  issue(input: IssueSessionInput): Promise<RefreshToken> {
    return this.refreshTokens.create({
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent ?? undefined,
      ipAddress: input.ipAddress ?? undefined,
      ...(input.userId !== undefined && {
        user: { connect: { id: input.userId } },
      }),
      ...(input.adminUserId !== undefined && {
        adminUser: { connect: { id: input.adminUserId } },
      }),
    });
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokens.findByHash(tokenHash);
  }

  revoke(id: number): Promise<RefreshToken> {
    return this.refreshTokens.revoke(id);
  }

  async revokeAllForUser(userId: number): Promise<number> {
    const count = await this.refreshTokens.revokeAllForUser(userId);
    this.logger.info(`Revoked ${count} session(s) for user ${userId}`);
    return count;
  }

  async revokeAllForAdmin(adminUserId: number): Promise<number> {
    const count = await this.refreshTokens.revokeAllForAdmin(adminUserId);
    this.logger.info(`Revoked ${count} session(s) for admin ${adminUserId}`);
    return count;
  }

  listLiveForUser(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokens.listLiveForUser(userId);
  }

  findLiveForUser(id: number, userId: number): Promise<RefreshToken | null> {
    return this.refreshTokens.findLiveById(id, userId);
  }

  async deleteExpiredOlderThan(date: Date): Promise<number> {
    return this.refreshTokens.deleteExpiredOlderThan(date);
  }
}
