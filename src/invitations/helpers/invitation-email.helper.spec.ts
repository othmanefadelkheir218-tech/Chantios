import { ConflictException } from '@nestjs/common';
import { UserInvitation } from '@prisma/client';
import { assertEmailFreeForInvitation } from './invitation-email.helper';

const openAt = (tenantId: number) => ({ id: 5, tenantId }) as UserInvitation;

const lookups = (user: unknown, open: UserInvitation | null) => ({
  findUserByEmail: jest.fn().mockResolvedValue(user),
  findOpenInvitationAnywhere: jest.fn().mockResolvedValue(open),
});

describe('assertEmailFreeForInvitation — an email belongs to one company only', () => {
  it('refuses an email that is already a user', async () => {
    await expect(
      assertEmailFreeForInvitation('a@b.be', 1, lookups({ id: 1 }, null)),
    ).rejects.toThrow(ConflictException);
  });

  it('refuses an open invitation at another company', async () => {
    await expect(
      assertEmailFreeForInvitation('a@b.be', 1, lookups(null, openAt(2))),
    ).rejects.toThrow('another company');
  });

  it('returns the open invitation of the same company (to replace)', async () => {
    await expect(
      assertEmailFreeForInvitation('a@b.be', 1, lookups(null, openAt(1))),
    ).resolves.toEqual(openAt(1));
  });

  it('a company not created yet (null): any open invitation is a conflict', async () => {
    await expect(
      assertEmailFreeForInvitation('a@b.be', null, lookups(null, openAt(1))),
    ).rejects.toThrow(ConflictException);
    await expect(
      assertEmailFreeForInvitation('a@b.be', null, lookups(null, null)),
    ).resolves.toBeNull();
  });
});
