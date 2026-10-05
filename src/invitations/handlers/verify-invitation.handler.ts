import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { hashInvitationToken } from '../helpers/invitation-token.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/** `GET /api/invitations/verify/:token` — `@Public()`. For the accept form. */
@Injectable()
export class VerifyInvitationHandler {
  constructor(
    @InjectPinoLogger(VerifyInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(token: string) {
    const invitation = await this.invitations.findByHash(
      hashInvitationToken(token),
    );
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date()
    ) {
      this.logger.warn('Invitation token invalid, used or expired');
      throw new BadRequestException(
        'This invitation link is invalid or expired',
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invitation.tenantId },
    });
    return {
      name: invitation.name,
      email: invitation.email,
      company: tenant?.name,
    };
  }
}
