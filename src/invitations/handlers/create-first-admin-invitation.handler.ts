import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  EmailLocale,
  inviteEmployeeTemplate,
} from '../../email/templates/invite-employee.template';
import { UsersService } from '../../users/users.service';
import { assertEmailFreeForInvitation } from '../helpers/invitation-email.helper';
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_LIFETIME_MS,
  toAcceptUrl,
} from '../helpers/invitation-token.helper';
import { toInvitationEntity } from '../helpers/invitation.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

export type FirstAdminInvitationInput = {
  tenantId: number;
  roleId: number;
  name: string;
  email: string;
  adminUserId: number | null;
  ip: string | null;
};

/**
 * The first `admin` of a company the super-admin creates
 * (doc/notes/subscription-plans.md § what a brand-new company gets). The row
 * carries `invited_by_admin_user_id`, never `invited_by`. It runs inside the
 * caller's transaction; the email goes out after the commit (`sendEmail`).
 */
@Injectable()
export class CreateFirstAdminInvitationHandler {
  constructor(
    @InjectPinoLogger(CreateFirstAdminInvitationHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly users: UsersService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  /** 409 when the email is already a user or has an open invitation anywhere. Call before the transaction. */
  async assertEmailFree(email: string): Promise<void> {
    try {
      await assertEmailFreeForInvitation(email.toLowerCase(), null, {
        findUserByEmail: (value) => this.users.findByEmail(value),
        findOpenInvitationAnywhere: (value) =>
          this.invitations.findOpenByEmailAnywhere(value),
      });
    } catch (error) {
      this.logger.warn(
        `Cannot invite first admin ${email}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async execute(
    input: FirstAdminInvitationInput,
    tx: Prisma.TransactionClient,
  ) {
    const email = input.email.toLowerCase();
    this.logger.info(
      `Inviting the first admin ${email} of tenant ${input.tenantId}`,
    );

    const rawToken = generateInvitationToken();
    const invitation = await this.invitations.createInTransaction(
      {
        tenantId: input.tenantId,
        email,
        name: input.name,
        roleId: input.roleId,
        tokenHash: hashInvitationToken(rawToken),
        invitedByAdminUserId: input.adminUserId,
        expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS),
      },
      tx,
    );

    const entity = toInvitationEntity(invitation);
    await this.audit.write(
      {
        tenantId: input.tenantId,
        adminUserId: input.adminUserId,
        action: 'create',
        entityType: 'user_invitation',
        entityId: invitation.id,
        newValue: entity,
        ipAddress: input.ip,
      },
      tx,
    );
    return { invitation: entity, rawToken };
  }

  /** The normal invitation email — same template as an employee invitation. */
  async sendEmail(
    email: string,
    rawToken: string,
    companyName: string,
    locale: string,
  ): Promise<void> {
    const { subject, html } = inviteEmployeeTemplate(
      companyName,
      toAcceptUrl(rawToken),
      locale as EmailLocale,
    );
    await this.email.send(email, subject, html);
    this.logger.info(`First-admin invitation email sent to ${email}`);
  }
}
