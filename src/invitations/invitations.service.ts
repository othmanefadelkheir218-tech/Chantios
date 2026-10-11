import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateDirectMemberDto } from './dto/create-direct-member.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { FindInvitationsQueryDto } from './dto/find-invitations-query.dto';
import { AcceptInvitationHandler } from './handlers/accept-invitation.handler';
import { Prisma } from '@prisma/client';
import {
  CreateFirstAdminInvitationHandler,
  FirstAdminInvitationInput,
} from './handlers/create-first-admin-invitation.handler';
import { CreateDirectMemberHandler } from './handlers/create-direct-member.handler';
import { CreateInvitationHandler } from './handlers/create-invitation.handler';
import { FindInvitationsHandler } from './handlers/find-invitations.handler';
import { ResendInvitationHandler } from './handlers/resend-invitation.handler';
import { RevokeInvitationHandler } from './handlers/revoke-invitation.handler';
import { VerifyInvitationHandler } from './handlers/verify-invitation.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class InvitationsService {
  constructor(
    private readonly createInvitation: CreateInvitationHandler,
    private readonly findInvitations: FindInvitationsHandler,
    private readonly resendInvitation: ResendInvitationHandler,
    private readonly revokeInvitation: RevokeInvitationHandler,
    private readonly verifyInvitation: VerifyInvitationHandler,
    private readonly acceptInvitation: AcceptInvitationHandler,
    private readonly createFirstAdmin: CreateFirstAdminInvitationHandler,
    private readonly createDirectMember: CreateDirectMemberHandler,
  ) {}

  /** Step 18 — a company created by the super-admin: check the boss's email before anything is written. */
  assertFirstAdminEmailFree(email: string) {
    return this.createFirstAdmin.assertEmailFree(email);
  }

  /** Inside the caller's transaction (tenant + trial + this invitation). */
  createFirstAdminInvitation(
    input: FirstAdminInvitationInput,
    tx: Prisma.TransactionClient,
  ) {
    return this.createFirstAdmin.execute(input, tx);
  }

  /** After the commit. */
  sendFirstAdminInvitation(
    email: string,
    rawToken: string,
    companyName: string,
    locale: string,
  ) {
    return this.createFirstAdmin.sendEmail(
      email,
      rawToken,
      companyName,
      locale,
    );
  }

  create(dto: CreateInvitationDto, actor: AuthenticatedUser) {
    return this.createInvitation.execute(dto, actor);
  }

  /** A member added with no email sent (auth-tokens.md § 2b). */
  createDirect(dto: CreateDirectMemberDto, actor: AuthenticatedUser) {
    return this.createDirectMember.execute(dto, actor);
  }

  findAll(query: FindInvitationsQueryDto) {
    return this.findInvitations.execute(query);
  }

  resend(id: number, actor: AuthenticatedUser) {
    return this.resendInvitation.execute(id, actor);
  }

  revoke(id: number, actor: AuthenticatedUser) {
    return this.revokeInvitation.execute(id, actor);
  }

  verify(token: string) {
    return this.verifyInvitation.execute(token);
  }

  accept(dto: AcceptInvitationDto) {
    return this.acceptInvitation.execute(dto);
  }
}
