import { UserInvitation } from '@prisma/client';

/** What may leave the module. Never carries `token_hash`. */
export function toInvitationEntity(invitation: UserInvitation) {
  return {
    id: invitation.id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    name: invitation.name,
    roleId: invitation.roleId,
    invitedBy: invitation.invitedBy,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
  };
}
