import { ConflictException } from '@nestjs/common';
import { UserInvitation } from '@prisma/client';

type EmailLookups = {
  findUserByEmail: (email: string) => Promise<unknown>;
  findOpenInvitationAnywhere: (email: string) => Promise<UserInvitation | null>;
};

/**
 * "An email belongs to one company only" (doc/notes/auth-tokens.md §
 * user_invitations): refused if a user already has it anywhere, or if an open
 * invitation exists at another company. Returns the open invitation of the
 * SAME company (the caller replaces it), or `null`.
 *
 * `tenantId = null` — the company does not exist yet (super-admin creates
 * it): any open invitation is a conflict.
 */
export async function assertEmailFreeForInvitation(
  email: string,
  tenantId: number | null,
  lookups: EmailLookups,
): Promise<UserInvitation | null> {
  if (await lookups.findUserByEmail(email)) {
    throw new ConflictException(`Email ${email} is already used`);
  }
  const existing = await lookups.findOpenInvitationAnywhere(email);
  if (existing && existing.tenantId !== tenantId) {
    throw new ConflictException(
      `Email ${email} already has an open invitation at another company`,
    );
  }
  return existing;
}
