import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { FindInvitationsQueryDto } from './dto/find-invitations-query.dto';
import { AcceptInvitationHandler } from './handlers/accept-invitation.handler';
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
  ) {}

  create(dto: CreateInvitationDto, actor: AuthenticatedUser) {
    return this.createInvitation.execute(dto, actor);
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
