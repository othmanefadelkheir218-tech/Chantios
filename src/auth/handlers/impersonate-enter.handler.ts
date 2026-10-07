import { BadRequestException, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { UsersService } from '../../users/users.service';
import { setImpersonationCookie } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';

/** The 7 seeded roles are fixed (prisma/seeds/data.seed.ts) — admin is id 1. */
const ADMIN_ROLE_ID = 1;

/**
 * `POST /api/admin/impersonate/:tenantId` — a scoped, short-lived tenant
 * session for support (doc/notes/Phaces/16-support-feedback.md). Finds the
 * tenant's own active `admin`-role user (the first one, if several); no
 * fallback to any other role.
 *
 * The audit row is written FIRST, before the cookie is issued — a request
 * that fails right after writing the row has still left a true record that
 * entry was attempted; a cookie set without a row would be the opposite and
 * worse mistake, an unaudited session. If the write throws, nothing here
 * catches it: the request fails loudly and no cookie is ever set.
 */
@Injectable()
export class ImpersonateEnterHandler {
  constructor(
    @InjectPinoLogger(ImpersonateEnterHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly tokens: TokenHelper,
    private readonly audit: AuditService,
  ) {}

  async execute(tenantId: number, actor: RequestActor, res: Response) {
    if (actor.adminUserId === null) {
      throw new BadRequestException('A platform admin session is required');
    }
    this.logger.info(
      `Admin ${actor.adminUserId} entering tenant ${tenantId} (impersonation)`,
    );

    const admin = await this.users.findFirstActiveByRole(
      tenantId,
      ADMIN_ROLE_ID,
    );
    if (!admin) {
      this.logger.warn(
        `Cannot impersonate tenant ${tenantId}: no active admin user`,
      );
      throw new BadRequestException(
        'This company has no active admin user to impersonate',
      );
    }

    await this.audit.write({
      tenantId,
      adminUserId: actor.adminUserId,
      action: 'impersonate_enter',
      entityType: 'tenant',
      entityId: tenantId,
      newValue: { impersonatedUserId: admin.id },
      ipAddress: actor.ip,
    });

    const accessToken = this.tokens.signAccessToken({
      sub: admin.id,
      tenantId,
      roleId: admin.roleId,
      email: admin.email,
      impersonatedBy: actor.adminUserId,
    });
    setImpersonationCookie(res, accessToken);

    this.logger.info(
      `Admin ${actor.adminUserId} is now impersonating tenant ${tenantId} as user ${admin.id}`,
    );
    return { tenant_id: tenantId, impersonated_user_id: admin.id };
  }
}
