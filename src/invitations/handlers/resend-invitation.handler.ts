import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { env } from '../../config/env.config';
import { EmailService } from '../../email/email.service';
import {
  EmailLocale,
  inviteEmployeeTemplate,
} from '../../email/templates/invite-employee.template';
import { PrismaService } from '../../prisma/prisma.service';
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_LIFETIME_MS,
} from '../helpers/invitation-token.helper';
import { toInvitationEntity } from '../helpers/invitation.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/** `POST /api/invitations/:id/resend` — admin only. A fresh token, same row. */
@Injectable()
export class ResendInvitationHandler {
  constructor(
    @InjectPinoLogger(ResendInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Resending invitation ${id}`);

    const invitation = await this.invitations.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation was already accepted');
    }

    const rawToken = generateInvitationToken();
    const updated = await this.invitations.updateToken(
      id,
      hashInvitationToken(rawToken),
      new Date(Date.now() + INVITATION_LIFETIME_MS),
    );

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: actor.tenantId },
    });
    const acceptUrl = `${env.APP_URL}/invitations/accept?token=${rawToken}`;
    const { subject, html } = inviteEmployeeTemplate(
      tenant?.name ?? 'ChantierOS',
      acceptUrl,
      (tenant?.locale as EmailLocale) ?? 'en',
    );
    await this.email.send(updated.email, subject, html);

    this.logger.info(`Invitation resent: ${id}`);
    return toInvitationEntity(updated);
  }
}
