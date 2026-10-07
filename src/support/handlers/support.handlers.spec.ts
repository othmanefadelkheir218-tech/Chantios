import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { containing } from '../../common/testing/spec-helpers';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { AssignTicketHandler } from './assign-ticket.handler';
import { CloseTicketHandler } from './close-ticket.handler';
import { CreateTicketHandler } from './create-ticket.handler';
import { FindTicketHandler } from './find-ticket.handler';
import { SetStatusHandler } from './set-status.handler';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

const actor: AuthenticatedUser = {
  userId: 1,
  tenantId: 7,
  roleId: 1,
  email: 'admin@tenant.test',
};
const adminActor = { adminUserId: 9, ip: '10.0.0.1' };

const ticket = (over: Record<string, unknown> = {}) => ({
  id: 3,
  tenantId: 7,
  openedBy: 1,
  subject: 'Invoices stuck in draft',
  category: 'bug',
  priority: 'normal',
  status: 'open',
  assignedAdminId: null,
  closedAt: null,
  createdAt: new Date('2026-10-07T00:00:00Z'),
  updatedAt: new Date('2026-10-07T00:00:00Z'),
  ...over,
});

describe('CreateTicketHandler — step 16', () => {
  const tickets = { create: jest.fn() };
  const roles = { findRoleById: jest.fn() };
  const chat = { createSupportConversation: jest.fn() };
  const tx = { marker: 'tx' };
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const audit = { write: jest.fn() };
  const tenants = { findOne: jest.fn() };
  const notifications = { dispatch: jest.fn() };

  const handler = () =>
    new CreateTicketHandler(
      logger as never,
      tickets as never,
      roles as never,
      chat as never,
      tenantPrisma as never,
      audit as never,
      tenants as never,
      notifications as never,
    );

  const dto = {
    subject: 'Invoices stuck in draft',
    category: 'bug' as const,
    message: '  Hello, we have a problem  ',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    tenants.findOne.mockResolvedValue({ id: 7, name: 'Dupont' });
  });

  it('a non-admin role is rejected with 403, nothing written', async () => {
    roles.findRoleById.mockResolvedValue({ name: 'manager' });
    await expect(handler().execute(dto, actor)).rejects.toThrow(
      ForbiddenException,
    );
    expect(tickets.create).not.toHaveBeenCalled();
    expect(chat.createSupportConversation).not.toHaveBeenCalled();
    expect(audit.write).not.toHaveBeenCalled();
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('an admin: one transaction creates the ticket row THEN the conversation, in the SAME tx', async () => {
    roles.findRoleById.mockResolvedValue({ name: 'admin' });
    tickets.create.mockResolvedValue(ticket());
    chat.createSupportConversation.mockResolvedValue({
      conversation: { id: 55 },
      message: { id: 100 },
    });

    const result = await handler().execute(dto, actor);

    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 7,
        openedBy: 1,
        subject: dto.subject,
        category: 'bug',
        priority: 'normal',
      }),
      tx,
    );
    expect(chat.createSupportConversation).toHaveBeenCalledWith(
      3, // the ticket id just created
      [{ userId: 1 }],
      'Hello, we have a problem', // trimmed
      actor,
      tx,
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 3, conversationId: 55 }),
    );
  });

  it('writes ONE audit row for the whole operation, after commit', async () => {
    roles.findRoleById.mockResolvedValue({ name: 'admin' });
    tickets.create.mockResolvedValue(ticket());
    chat.createSupportConversation.mockResolvedValue({
      conversation: { id: 55 },
      message: { id: 100 },
    });
    await handler().execute(dto, actor);
    expect(audit.write).toHaveBeenCalledTimes(1);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 7,
        userId: 1,
        action: 'create',
        entityType: 'support_ticket',
        entityId: 3,
      }),
    );
  });

  it('dispatches the support_ticket_opened platform alert with the company name and subject', async () => {
    roles.findRoleById.mockResolvedValue({ name: 'admin' });
    tickets.create.mockResolvedValue(ticket());
    chat.createSupportConversation.mockResolvedValue({
      conversation: { id: 55 },
      message: { id: 100 },
    });
    await handler().execute(dto, actor);
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'support_ticket_opened',
      expect.objectContaining({
        payload: containing({
          tenant_id: 7,
          company_name: 'Dupont',
          subject: dto.subject,
        }),
      }),
    );
  });

  it('defaults priority to normal when not given', async () => {
    roles.findRoleById.mockResolvedValue({ name: 'admin' });
    tickets.create.mockResolvedValue(ticket());
    chat.createSupportConversation.mockResolvedValue({
      conversation: { id: 55 },
      message: { id: 100 },
    });
    await handler().execute(dto, actor);
    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'normal' }),
      tx,
    );
  });
});

describe('FindTicketHandler — tenant-scoped, carries conversation id', () => {
  const tickets = { findById: jest.fn() };
  const chat = { findSupportConversationByTicket: jest.fn() };
  const handler = () =>
    new FindTicketHandler(logger as never, tickets as never, chat as never);

  beforeEach(() => jest.resetAllMocks());

  it("another tenant's ticket (scoped read finds nothing) -> 404", async () => {
    tickets.findById.mockResolvedValue(null);
    await expect(handler().execute(3)).rejects.toThrow(NotFoundException);
  });

  it('returns the ticket with its conversation id', async () => {
    tickets.findById.mockResolvedValue(ticket());
    chat.findSupportConversationByTicket.mockResolvedValue({ id: 55 });
    const result = await handler().execute(3);
    expect(result).toEqual(
      expect.objectContaining({ id: 3, conversationId: 55 }),
    );
  });
});

describe('SetStatusHandler — platform admin, any tenant', () => {
  const tickets = { findByIdForAdmin: jest.fn(), setStatus: jest.fn() };
  const audit = { write: jest.fn() };
  const handler = () =>
    new SetStatusHandler(logger as never, tickets as never, audit as never);

  beforeEach(() => jest.resetAllMocks());

  it('unknown ticket -> 404', async () => {
    tickets.findByIdForAdmin.mockResolvedValue(null);
    await expect(
      handler().execute(3, { status: 'in_progress' }, adminActor),
    ).rejects.toThrow(NotFoundException);
  });

  it("updates the status and audits with the TICKET's own tenant id", async () => {
    tickets.findByIdForAdmin.mockResolvedValue(ticket({ status: 'open' }));
    tickets.setStatus.mockResolvedValue(ticket({ status: 'in_progress' }));
    await handler().execute(3, { status: 'in_progress' }, adminActor);
    expect(tickets.setStatus).toHaveBeenCalledWith(3, 'in_progress');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 7, // the ticket's tenant, not from a route param
        adminUserId: 9,
        action: 'update_status',
        entityType: 'support_ticket',
        entityId: 3,
        oldValue: { status: 'open' },
        newValue: { status: 'in_progress' },
      }),
    );
  });
});

describe('AssignTicketHandler — sets assigned_admin_id AND joins the conversation', () => {
  const tickets = { findByIdForAdmin: jest.fn(), assign: jest.fn() };
  const chat = { addAdminToSupportConversation: jest.fn() };
  const audit = { write: jest.fn() };
  const handler = () =>
    new AssignTicketHandler(
      logger as never,
      tickets as never,
      chat as never,
      audit as never,
    );

  beforeEach(() => jest.resetAllMocks());

  it('unknown ticket -> 404, nothing assigned', async () => {
    tickets.findByIdForAdmin.mockResolvedValue(null);
    await expect(
      handler().execute(3, { assigned_admin_id: 9 }, adminActor),
    ).rejects.toThrow(NotFoundException);
    expect(chat.addAdminToSupportConversation).not.toHaveBeenCalled();
  });

  it('assigns, adds the admin to the conversation, audits with old/new value', async () => {
    tickets.findByIdForAdmin.mockResolvedValue(
      ticket({ assignedAdminId: null }),
    );
    tickets.assign.mockResolvedValue(ticket({ assignedAdminId: 9 }));
    await handler().execute(3, { assigned_admin_id: 9 }, adminActor);
    expect(tickets.assign).toHaveBeenCalledWith(3, 9);
    expect(chat.addAdminToSupportConversation).toHaveBeenCalledWith(3, 7, 9);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 7,
        action: 'assign',
        oldValue: { assignedAdminId: null },
        newValue: { assignedAdminId: 9 },
      }),
    );
  });
});

describe('CloseTicketHandler — closed, never deleted', () => {
  const tickets = { findByIdForAdmin: jest.fn(), close: jest.fn() };
  const audit = { write: jest.fn() };
  const handler = () =>
    new CloseTicketHandler(logger as never, tickets as never, audit as never);

  beforeEach(() => jest.resetAllMocks());

  it('unknown ticket -> 404', async () => {
    tickets.findByIdForAdmin.mockResolvedValue(null);
    await expect(handler().execute(3, adminActor)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sets status closed and closed_at, audits', async () => {
    tickets.findByIdForAdmin.mockResolvedValue(
      ticket({ status: 'in_progress' }),
    );
    tickets.close.mockResolvedValue(
      ticket({ status: 'closed', closedAt: new Date('2026-10-07T12:00:00Z') }),
    );
    const result = await handler().execute(3, adminActor);
    expect(tickets.close).toHaveBeenCalledWith(3, expect.any(Date));
    expect(result.status).toBe('closed');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 7,
        action: 'close',
        oldValue: { status: 'in_progress' },
      }),
    );
  });
});
