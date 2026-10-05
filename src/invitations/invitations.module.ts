import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AcceptInvitationHandler } from './handlers/accept-invitation.handler';
import { CreateInvitationHandler } from './handlers/create-invitation.handler';
import { FindInvitationsHandler } from './handlers/find-invitations.handler';
import { ResendInvitationHandler } from './handlers/resend-invitation.handler';
import { RevokeInvitationHandler } from './handlers/revoke-invitation.handler';
import { VerifyInvitationHandler } from './handlers/verify-invitation.handler';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationRepository } from './repositories/invitation.repository';

@Module({
  imports: [AuditModule, EmailModule, UsersModule],
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    InvitationRepository,
    CreateInvitationHandler,
    FindInvitationsHandler,
    ResendInvitationHandler,
    RevokeInvitationHandler,
    VerifyInvitationHandler,
    AcceptInvitationHandler,
  ],
  exports: [InvitationsService],
})
export class InvitationsModule {}
