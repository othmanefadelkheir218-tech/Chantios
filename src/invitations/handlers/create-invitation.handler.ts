import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  EmailLocale,
  inviteEmployeeTemplate,
} from '../../email/templates/invite-employee.template';
import { EmailService } from '../../email/email.service';
import { env } from '../../config/env.config';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_LIFETIME_MS,
} from '../helpers/invitation-token.helper';
import { toInvitationEntity } from '../helpers/invitation.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/**
 * `POST /api/invitations` — admin only. Refuses an email already in use
 * anywhere (`users.email` is unique app-wide), or an open invitation at
 * another company. Re-inviting the same email at the SAME company replaces
 * the old row (doc/notes/auth-tokens.md).
 */
@Injectable()
export class CreateInvitationHandler {
  constructor(
    @InjectPinoLogger(CreateInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly users: UsersService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
    // `tenants.locale` for the email template — tenants is skip-listed, so
    // the raw client is the normal (only) way to read it.
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateInvitationDto, actor: AuthenticatedUser) {
    const email = dto.email.toLowerCase();
    this.logger.info(`Inviting ${email} (role ${dto.role_id})`);

    if (await this.users.findByEmail(email)) {
      this.logger.warn(`Cannot invite ${email}: already a user somewhere`);
      throw new ConflictException(`Email ${email} is already used`);
    }

    const existing = await this.invitations.findOpenByEmailAnywhere(email);
    if (existing && existing.tenantId !== actor.tenantId) {
      this.logger.warn(
        `Cannot invite ${email}: open invitation at another company`,
      );
      throw new ConflictException(
        `Email ${email} already has an open invitation at another company`,
      );
    }
    if (existing) {
      this.logger.info(`Re-inviting ${email}: replacing the old invitation`);
      await this.invitations.delete(existing.id);
    }

    const rawToken = generateInvitationToken();
    const invitation = await this.invitations.create({
      email,
      name: dto.name,
      roleId: dto.role_id,
      tokenHash: hashInvitationToken(rawToken),
      invitedBy: actor.userId,
      expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS),
    } as unknown as Prisma.UserInvitationCreateInput);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: actor.tenantId },
    });
    const acceptUrl = `${env.APP_URL}/invitations/accept?token=${rawToken}`;
    const { subject, html } = inviteEmployeeTemplate(
      tenant?.name ?? 'ChantierOS',
      acceptUrl,
      (tenant?.locale as EmailLocale) ?? 'en',
    );
    await this.email.send(email, subject, html);

    const entity = toInvitationEntity(invitation);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'user_invitation',
      entityId: invitation.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Invitation sent: ${invitation.id} (${email})`);
    return entity;
  }
}
