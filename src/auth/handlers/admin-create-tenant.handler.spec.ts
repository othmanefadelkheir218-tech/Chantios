import { BadRequestException, ConflictException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import type { InvitationsService } from '../../invitations/invitations.service';
import type { PlansService } from '../../plans/plans.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import type { TenantsService } from '../../tenants/tenants.service';
import { AdminCreateTenantHandler } from './admin-create-tenant.handler';

// Step 18 — a company created by the super-admin gets the same start as a sign-up.

describe('AdminCreateTenantHandler — step 18', () => {
  const logger = { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger;
  const tx = { tx: true };
  const prisma = {
    $transaction: jest.fn((cb: (client: unknown) => unknown) => cb(tx)),
  };
  const tenants = { create: jest.fn(), checkVatNumber: jest.fn() };
  const subscriptions = { create: jest.fn() };
  const plans = { findDefault: jest.fn() };
  const invitations = {
    assertFirstAdminEmailFree: jest.fn(),
    createFirstAdminInvitation: jest.fn(),
    sendFirstAdminInvitation: jest.fn(),
  };
  const handler = new AdminCreateTenantHandler(
    logger,
    prisma as unknown as PrismaService,
    tenants as unknown as TenantsService,
    subscriptions as unknown as SubscriptionsService,
    plans as unknown as PlansService,
    invitations as unknown as InvitationsService,
  );
  const actor = { adminUserId: 4, ip: '1.2.3.4' };
  const dto = {
    name: 'Bravo Bouw',
    email: 'info@bravo.be',
    locale: 'nl',
    country: 'BE',
    owner_name: 'Bram Boss',
    owner_email: 'Bram@Bravo.be',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    plans.findDefault.mockResolvedValue({ id: 2 });
    tenants.create.mockResolvedValue({
      id: 30,
      name: 'Bravo Bouw',
      locale: 'nl',
    });
    invitations.createFirstAdminInvitation.mockResolvedValue({
      invitation: { id: 77 },
      rawToken: 'raw-token',
    });
  });

  it('creates tenant + trial + first-admin invitation in one transaction, then sends the email', async () => {
    const result = await handler.execute(dto, actor);

    expect(invitations.assertFirstAdminEmailFree).toHaveBeenCalledWith(
      'bram@bravo.be',
    );
    expect(tenants.create).toHaveBeenCalledWith(
      {
        name: 'Bravo Bouw',
        email: 'info@bravo.be',
        locale: 'nl',
        country: 'BE',
      },
      actor,
      tx,
    );
    expect(subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 30, planId: 2, status: 'trialing' }),
      tx,
    );
    expect(invitations.createFirstAdminInvitation).toHaveBeenCalledWith(
      {
        tenantId: 30,
        roleId: 1,
        name: 'Bram Boss',
        email: 'bram@bravo.be',
        adminUserId: 4,
        ip: '1.2.3.4',
      },
      tx,
    );
    expect(invitations.sendFirstAdminInvitation).toHaveBeenCalledWith(
      'bram@bravo.be',
      'raw-token',
      'Bravo Bouw',
      'nl',
    );
    expect(result).toMatchObject({ id: 30, ownerInvitation: { id: 77 } });
  });

  it('owner email already used -> 409, nothing created', async () => {
    invitations.assertFirstAdminEmailFree.mockRejectedValueOnce(
      new ConflictException('Email bram@bravo.be is already used'),
    );
    await expect(handler.execute(dto, actor)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(invitations.sendFirstAdminInvitation).not.toHaveBeenCalled();
  });

  it('no default plan -> 400, nothing created', async () => {
    plans.findDefault.mockResolvedValue(null);
    await expect(handler.execute(dto, actor)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('a failure inside the transaction sends no email', async () => {
    subscriptions.create.mockRejectedValueOnce(new Error('db down'));
    await expect(handler.execute(dto, actor)).rejects.toThrow('db down');
    expect(invitations.sendFirstAdminInvitation).not.toHaveBeenCalled();
  });
});
