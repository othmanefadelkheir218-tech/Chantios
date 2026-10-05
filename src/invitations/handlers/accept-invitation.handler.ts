import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { hashPassword } from '../../common/helpers/password.helper';
import { UsersService } from '../../users/users.service';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { hashInvitationToken } from '../helpers/invitation-token.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/**
 * `POST /api/invitations/accept` — `@Public()`. Creates the `users` row NOW,
 * not at invite time. The tenant is unknown until the token resolves it, so
 * this is the one legitimate caller of `TenantContextService.setTenantId()`
 * outside registration (doc/notes/technical/build-order.md § 1b).
 */
@Injectable()
export class AcceptInvitationHandler {
  constructor(
    @InjectPinoLogger(AcceptInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly users: UsersService,
    private readonly tenantContext: TenantContextService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: AcceptInvitationDto) {
    const invitation = await this.invitations.findByHash(
      hashInvitationToken(dto.token),
    );
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date()
    ) {
      this.logger.warn(
        'Cannot accept invitation: invalid, used or expired token',
      );
      throw new BadRequestException(
        'This invitation link is invalid or expired',
      );
    }

    this.tenantContext.setTenantId(invitation.tenantId);

    const passwordHash = await hashPassword(dto.password);
    // Scalar FKs (`roleId`, not `role: { connect }`), not mixed with a
    // relation style: the tenant extension injects `tenantId` as a scalar
    // too (common/prisma/tenant-extension.ts), and Prisma's create() rejects
    // a payload that mixes checked (relation) and unchecked (scalar) styles
    // for different foreign keys in the same call.
    const user = await this.users.create({
      name: invitation.name,
      email: invitation.email,
      passwordHash,
      roleId: invitation.roleId,
    } as unknown as Prisma.UserCreateInput);

    await this.invitations.markAccepted(invitation.id);
    await this.audit.write({
      tenantId: invitation.tenantId,
      userId: user.id,
      action: 'accept_invitation',
      entityType: 'user',
      entityId: user.id,
      newValue: { id: user.id, email: user.email, roleId: user.roleId },
      ipAddress: null,
    });
    this.logger.info(
      `Invitation accepted: user ${user.id} created for tenant ${invitation.tenantId}`,
    );
    return { accepted: true, user_id: user.id };
  }
}
