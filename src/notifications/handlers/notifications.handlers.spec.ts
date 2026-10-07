import { callArg, containing } from '../../common/testing/spec-helpers';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { getLoggerToken } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { EmailService } from '../../email/email.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { PlatformEventsListener } from '../listeners/platform-events.listener';
import { NOTIFICATIONS_QUEUE } from '../notification.types';
import { NotificationsService } from '../notifications.service';
import { NotificationProcessor } from '../processors/notification.processor';
import { NotificationRepository } from '../repositories/notification.repository';
import { AppEventsService } from '../../common/events/app-events.service';
import { DispatchNotificationHandler } from './dispatch-notification.handler';
import { FindNotificationsHandler } from './find-notifications.handler';
import { MarkAllReadHandler } from './mark-all-read.handler';
import { MarkReadHandler } from './mark-read.handler';
import { UnreadCountHandler } from './unread-count.handler';

const NOW = new Date('2026-10-07T10:00:00Z');
const me = { userId: 5, tenantId: 1 };

const person = (id: number, roleName: string, roleId = id) => ({
  id,
  email: `u${id}@test.local`,
  name: `User ${id}`,
  roleId,
  roleName,
});

describe('Notifications handlers', () => {
  const repo = {
    createMany: jest.fn(),
    findManyForRecipient: jest.fn(),
    findById: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    countUnread: jest.fn(),
    findRecentRecipients: jest.fn(),
    deleteReadOlderThan: jest.fn(),
  };
  const queue = { add: jest.fn() };
  const gateway = { emit: jest.fn() };
  const users = { findActiveWithRole: jest.fn() };
  const roles = { findOverridesForRole: jest.fn() };
  const tenants = { findForNotifications: jest.fn() };
  const adminUsers = { findActiveRecipients: jest.fn() };
  const tenantContext = { setTenantId: jest.fn() };
  const cls = { run: jest.fn((fn: () => unknown) => fn()) };
  const email = { send: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let dispatch: DispatchNotificationHandler;
  let service: NotificationsService;
  let find: FindNotificationsHandler;
  let markRead: MarkReadHandler;
  let markAllRead: MarkAllReadHandler;
  let unread: UnreadCountHandler;
  let processor: NotificationProcessor;

  /** What createMany returns: one row per input, ids from 100. */
  const echoRows = () =>
    repo.createMany.mockImplementation((rows: Array<Record<string, unknown>>) =>
      Promise.resolve(
        rows.map((row, index) => ({
          id: 100 + index,
          tenantId: null,
          userId: null,
          adminUserId: null,
          isRead: false,
          createdAt: NOW,
          payload: {},
          ...row,
        })),
      ),
    );

  const queuedEmails = () =>
    queue.add.mock.calls.map(
      (call: unknown[]) =>
        call[1] as { to: string; subject: string; html: string },
    );

  beforeEach(async () => {
    jest.resetAllMocks();
    cls.run.mockImplementation((fn: () => unknown) => fn());
    queue.add.mockResolvedValue({});
    roles.findOverridesForRole.mockResolvedValue([]);
    tenants.findForNotifications.mockResolvedValue({
      id: 1,
      name: 'Dupont',
      locale: 'fr',
    });
    echoRows();

    const handlers = [
      DispatchNotificationHandler,
      FindNotificationsHandler,
      MarkReadHandler,
      NotificationsService,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        MarkAllReadHandler,
        UnreadCountHandler,
        NotificationProcessor,
        { provide: NotificationRepository, useValue: repo },
        { provide: getQueueToken(NOTIFICATIONS_QUEUE), useValue: queue },
        { provide: NotificationsGateway, useValue: gateway },
        { provide: UsersService, useValue: users },
        { provide: RolesService, useValue: roles },
        { provide: TenantsService, useValue: tenants },
        { provide: AdminUsersService, useValue: adminUsers },
        { provide: TenantContextService, useValue: tenantContext },
        { provide: ClsService, useValue: cls },
        { provide: EmailService, useValue: email },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    dispatch = module.get(DispatchNotificationHandler);
    service = module.get(NotificationsService);
    find = module.get(FindNotificationsHandler);
    markRead = module.get(MarkReadHandler);
    markAllRead = module.get(MarkAllReadHandler);
    unread = module.get(UnreadCountHandler);
    processor = module.get(NotificationProcessor);
  });

  describe('DispatchNotificationHandler — staff alerts', () => {
    beforeEach(() => {
      users.findActiveWithRole.mockResolvedValue([
        person(1, 'admin'),
        person(2, 'manager'),
        person(3, 'worker'),
      ]);
    });

    it('low_stock: one row + one socket event + one email for each of admin and manager', async () => {
      const created = await dispatch.execute('low_stock', {
        tenantId: 1,
        payload: { material_name: 'Paint', on_hand: '4', unit: 'L' },
      });

      expect(created).toBe(2);
      const rows = callArg<
        Array<{ tenantId: number; userId: number; type: string }>
      >(repo.createMany, 0, 0);
      expect(rows.map((r) => r.userId)).toEqual([1, 2]);
      expect(
        rows.every((r) => r.tenantId === 1 && r.type === 'low_stock'),
      ).toBe(true);
      expect(gateway.emit).toHaveBeenCalledTimes(2);
      const mails = queuedEmails();
      expect(mails.map((m) => m.to)).toEqual([
        'u1@test.local',
        'u2@test.local',
      ]);
      // the tenant's locale is French
      expect(mails[0].subject).toBe('Stock bas : Paint');
    });

    it('the tenant goes into the context before any tenant-scoped read', async () => {
      await dispatch.execute('low_stock', { tenantId: 1, payload: {} });
      expect(tenantContext.setTenantId).toHaveBeenCalledWith(1);
      expect(cls.run).toHaveBeenCalledTimes(1);
    });

    it('a billing alert skips the manager (no invoices access), unless an override gives it', async () => {
      await dispatch.execute('invoice_late', { tenantId: 1, payload: {} });
      expect(
        callArg<Array<{ userId: number }>>(repo.createMany, 0, 0).map(
          (r) => r.userId,
        ),
      ).toEqual([1]);

      repo.createMany.mockClear();
      roles.findOverridesForRole.mockImplementation((roleId: number) =>
        Promise.resolve(
          roleId === 2
            ? [
                {
                  module: 'invoices',
                  canView: true,
                  canCreate: false,
                  canEdit: false,
                  canDelete: false,
                  scope: 'all',
                },
              ]
            : [],
        ),
      );
      await dispatch.execute('invoice_late', { tenantId: 1, payload: {} });
      expect(
        callArg<Array<{ userId: number }>>(repo.createMany, 0, 0).map(
          (r) => r.userId,
        ),
      ).toEqual([1, 2]);
    });

    it('dedupe: someone who already got it inside the window is skipped', async () => {
      repo.findRecentRecipients.mockResolvedValue(new Set([1]));
      const created = await dispatch.execute('missing_report', {
        tenantId: 1,
        dedupeDays: 3,
        payload: { entity_id: 12, project_name: 'Site' },
      });
      expect(created).toBe(1);
      expect(
        callArg<Array<{ userId: number }>>(repo.createMany, 0, 0).map(
          (r) => r.userId,
        ),
      ).toEqual([2]);
      expect(repo.findRecentRecipients).toHaveBeenCalledWith(
        'missing_report',
        12,
        [1, 2],
        expect.any(Date),
      );
    });

    it('dedupe: everybody already told -> nothing written, nothing sent', async () => {
      repo.findRecentRecipients.mockResolvedValue(new Set([1, 2]));
      const created = await dispatch.execute('missing_report', {
        tenantId: 1,
        dedupeDays: 3,
        payload: { entity_id: 12 },
      });
      expect(created).toBe(0);
      expect(repo.createMany).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('without dedupeDays the history is never read', async () => {
      await dispatch.execute('missing_report', {
        tenantId: 1,
        payload: { entity_id: 12 },
      });
      expect(repo.findRecentRecipients).not.toHaveBeenCalled();
    });

    it('an inactive or unknown tenant -> dropped quietly', async () => {
      tenants.findForNotifications.mockResolvedValue(null);
      expect(await dispatch.execute('low_stock', { tenantId: 9 })).toBe(0);
      expect(repo.createMany).not.toHaveBeenCalled();
    });

    it('no tenant at all -> dropped (a tenant alert needs one)', async () => {
      expect(await dispatch.execute('low_stock', {})).toBe(0);
      expect(repo.createMany).not.toHaveBeenCalled();
    });
  });

  describe('DispatchNotificationHandler — named people', () => {
    it('task_assigned goes only to the listed users, never to the excluded one', async () => {
      users.findActiveWithRole.mockResolvedValue([person(7, 'worker')]);
      await dispatch.execute('task_assigned', {
        tenantId: 1,
        userIds: [7, 4],
        excludeUserIds: [4],
        payload: { task_title: 'Paint', project_name: 'Site' },
      });
      expect(users.findActiveWithRole).toHaveBeenCalledWith([7, 4]);
      expect(
        callArg<Array<{ userId: number }>>(repo.createMany, 0, 0).map(
          (r) => r.userId,
        ),
      ).toEqual([7]);
    });

    it('the sender of a message is not notified', async () => {
      users.findActiveWithRole.mockResolvedValue([
        person(1, 'admin'),
        person(2, 'manager'),
      ]);
      await dispatch.execute('new_message', {
        tenantId: 1,
        userIds: [1, 2],
        excludeUserIds: [1],
        payload: { sender_name: 'Sara', preview: 'hi' },
      });
      expect(
        callArg<Array<{ userId: number }>>(repo.createMany, 0, 0).map(
          (r) => r.userId,
        ),
      ).toEqual([2]);
    });

    it('an empty list of people -> nothing, and no query', async () => {
      expect(
        await dispatch.execute('end_of_day_reminder', {
          tenantId: 1,
          userIds: [],
        }),
      ).toBe(0);
      expect(users.findActiveWithRole).not.toHaveBeenCalled();
    });

    it('a duplicated id is asked once', async () => {
      users.findActiveWithRole.mockResolvedValue([person(7, 'worker')]);
      await dispatch.execute('task_starting', {
        tenantId: 1,
        userIds: [7, 7, 7],
        payload: {},
      });
      expect(users.findActiveWithRole).toHaveBeenCalledWith([7]);
    });
  });

  describe('DispatchNotificationHandler — platform alerts', () => {
    it('tenant_signed_up: one row per active admin user, tenant_id NULL, English email', async () => {
      adminUsers.findActiveRecipients.mockResolvedValue([
        { id: 1, email: 'a@platform.test' },
        { id: 2, email: 'b@platform.test' },
      ]);
      const created = await dispatch.execute('tenant_signed_up', {
        payload: { company_name: 'Dupont' },
      });
      expect(created).toBe(2);
      const rows = callArg<Array<Record<string, unknown>>>(
        repo.createMany,
        0,
        0,
      );
      expect(rows).toEqual([
        containing({ tenantId: null, adminUserId: 1 }),
        containing({ tenantId: null, adminUserId: 2 }),
      ]);
      // never a user_id on a platform row (the DB CHECK allows exactly one recipient)
      expect(rows.every((row) => !('userId' in row))).toBe(true);
      expect(queuedEmails()[0].subject).toBe('New company: Dupont');
      // the tenant is not looked up: a platform alert has none
      expect(tenants.findForNotifications).not.toHaveBeenCalled();
      expect(cls.run).not.toHaveBeenCalled();
    });

    it('no active admin user -> nothing', async () => {
      adminUsers.findActiveRecipients.mockResolvedValue([]);
      expect(await dispatch.execute('payment_failed', {})).toBe(0);
    });
  });

  describe('DispatchNotificationHandler — client emails', () => {
    it('email only: no row, no socket, in the TENANT locale', async () => {
      const created = await dispatch.execute('client_invoice_sent', {
        tenantId: 1,
        clientEmail: 'client@test.local',
        payload: { invoice_ref: 'F-1', amount: '120.00' },
      });
      expect(created).toBe(1);
      expect(repo.createMany).not.toHaveBeenCalled();
      expect(gateway.emit).not.toHaveBeenCalled();
      expect(queuedEmails()).toEqual([
        expect.objectContaining({
          to: 'client@test.local',
          subject: 'Facture F-1 de Dupont',
        }),
      ]);
    });

    it('an English tenant gets an English email', async () => {
      tenants.findForNotifications.mockResolvedValue({
        id: 1,
        name: 'Dupont',
        locale: 'en',
      });
      await dispatch.execute('client_invoice_sent', {
        tenantId: 1,
        clientEmail: 'client@test.local',
        payload: { invoice_ref: 'F-1', amount: '120.00' },
      });
      expect(queuedEmails()[0].subject).toBe('Invoice F-1 from Dupont');
    });

    it('no address -> nothing is sent', async () => {
      expect(await dispatch.execute('client_quote_sent', { tenantId: 1 })).toBe(
        0,
      );
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('a failing email never loses the in-app notification', () => {
    beforeEach(() => {
      users.findActiveWithRole.mockResolvedValue([person(1, 'admin')]);
    });

    it('the queue is down: the row is saved and the socket event is sent anyway', async () => {
      queue.add.mockRejectedValue(new Error('redis down'));
      const created = await dispatch.execute('low_stock', {
        tenantId: 1,
        payload: {},
      });
      expect(created).toBe(1);
      expect(repo.createMany).toHaveBeenCalledTimes(1);
      expect(gateway.emit).toHaveBeenCalledTimes(1);
    });

    it('the socket server throws: the row is saved and the email is still queued', async () => {
      gateway.emit.mockImplementation(() => {
        throw new Error('socket down');
      });
      const created = await dispatch.execute('low_stock', {
        tenantId: 1,
        payload: {},
      });
      expect(created).toBe(1);
      expect(queue.add).toHaveBeenCalledTimes(1);
    });

    it('the row is written BEFORE the socket event and the email job', async () => {
      const order: string[] = [];
      repo.createMany.mockImplementation((rows: unknown[]) => {
        order.push('row');
        return Promise.resolve(
          (rows as Array<Record<string, unknown>>).map((row) => ({
            id: 1,
            ...row,
          })),
        );
      });
      gateway.emit.mockImplementation(() => order.push('socket'));
      queue.add.mockImplementation(() => {
        order.push('email');
        return Promise.resolve({});
      });
      await dispatch.execute('low_stock', { tenantId: 1, payload: {} });
      expect(order).toEqual(['row', 'socket', 'email']);
    });

    it('the email is retried by the queue (3 attempts, backoff)', async () => {
      await dispatch.execute('low_stock', { tenantId: 1, payload: {} });
      expect(callArg<unknown>(queue.add, 0, 2)).toMatchObject({
        attempts: 3,
        backoff: { type: 'exponential' },
      });
    });
  });

  describe('NotificationsService.dispatch — the single entry point', () => {
    it('never throws: a failure is logged and swallowed', async () => {
      tenants.findForNotifications.mockRejectedValue(new Error('db down'));
      await expect(
        service.dispatch('low_stock', { tenantId: 1 }),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('passes the type and context to the handler', async () => {
      users.findActiveWithRole.mockResolvedValue([person(1, 'admin')]);
      await service.dispatch('low_stock', { tenantId: 1, payload: {} });
      expect(repo.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('NotificationProcessor', () => {
    it('sends the email of the job', async () => {
      await processor.process({
        data: { to: 'a@test.local', subject: 'S', html: '<p>x</p>' },
      } as never);
      expect(email.send).toHaveBeenCalledWith('a@test.local', 'S', '<p>x</p>');
    });

    it('a provider that is down makes the JOB fail (so the queue retries it)', async () => {
      email.send.mockRejectedValue(new Error('resend down'));
      await expect(
        processor.process({
          data: { to: 'a@test.local', subject: 'S', html: 'x' },
        } as never),
      ).rejects.toThrow('resend down');
    });
  });

  describe('reading and marking — own rows only', () => {
    it('lists with the filter and pagination', async () => {
      repo.findManyForRecipient.mockResolvedValue([[{ id: 1 }], 1]);
      const result = await find.execute(me, {
        page: 2,
        limit: 10,
        is_read: false,
      });
      expect(repo.findManyForRecipient).toHaveBeenCalledWith(me, false, 10, 10);
      expect(result).toEqual({
        data: [{ id: 1 }],
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
    });

    it('marks one of my notifications as read', async () => {
      repo.markRead.mockResolvedValue({ id: 3, isRead: true });
      expect(await markRead.execute(3, me)).toEqual({ id: 3, isRead: true });
      expect(repo.markRead).toHaveBeenCalledWith(3, me);
    });

    it("someone else's notification -> 403, and it is not changed", async () => {
      repo.markRead.mockResolvedValue(null);
      repo.findById.mockResolvedValue({ id: 3, userId: 99, tenantId: 1 });
      await expect(markRead.execute(3, me)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('an unknown notification -> 404', async () => {
      repo.markRead.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);
      await expect(markRead.execute(3, me)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('mark-all and the unread count act on the caller only', async () => {
      repo.markAllRead.mockResolvedValue(4);
      repo.countUnread.mockResolvedValue(2);
      expect(await markAllRead.execute(me)).toEqual({ updated: 4 });
      expect(await unread.execute(me)).toEqual({ unread: 2 });
      expect(repo.markAllRead).toHaveBeenCalledWith(me);
      expect(repo.countUnread).toHaveBeenCalledWith(me);
    });

    it('a platform admin reads their own rows through the same handlers', async () => {
      repo.countUnread.mockResolvedValue(1);
      await unread.execute({ adminUserId: 9 });
      expect(repo.countUnread).toHaveBeenCalledWith({ adminUserId: 9 });
    });

    it('the retention purge hands the tenant and the cut-off to the repository', async () => {
      repo.deleteReadOlderThan.mockResolvedValue(6);
      expect(await service.purgeReadBefore(1, NOW)).toBe(6);
      expect(repo.deleteReadOlderThan).toHaveBeenCalledWith(1, NOW);
    });
  });

  describe('PlatformEventsListener', () => {
    it('tenant.status_changed becomes a tenant_status_changed platform alert', async () => {
      const events = new AppEventsService();
      const dispatchSpy = jest
        .spyOn(service, 'dispatch')
        .mockResolvedValue(undefined);
      new PlatformEventsListener(events, service).onModuleInit();
      events.emit('tenant.status_changed', {
        tenantId: 4,
        companyName: 'Dupont',
        status: 'suspended',
      });
      await new Promise((resolve) => setImmediate(resolve));
      expect(dispatchSpy).toHaveBeenCalledWith('tenant_status_changed', {
        payload: {
          entity_id: 4,
          tenant_id: 4,
          company_name: 'Dupont',
          status: 'suspended',
        },
      });
    });

    it('a listener that fails never breaks the emitter', () => {
      const events = new AppEventsService();
      events.on('tenant.status_changed', () => {
        throw new Error('boom');
      });
      expect(() =>
        events.emit('tenant.status_changed', {
          tenantId: 1,
          companyName: 'x',
          status: 'banned',
        }),
      ).not.toThrow();
    });
  });
});
