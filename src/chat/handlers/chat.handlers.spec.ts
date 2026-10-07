import { callArg, containing } from '../../common/testing/spec-helpers';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TokenHelper } from '../../auth/helpers/token.helper';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import { ClientsService } from '../../clients/clients.service';
import { UsersService } from '../../users/users.service';
import { ChatGateway } from '../gateways/chat.gateway';
import {
  conversationRoom,
  isMemberOf,
  readCookie,
} from '../helpers/chat-access.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { MessageRepository } from '../repositories/message.repository';
import { AddMemberHandler } from './add-member.handler';
import { AdminFindSupportMessagesHandler } from './admin-find-support-messages.handler';
import { AdminJoinSupportHandler } from './admin-join-support.handler';
import { AdminSendSupportMessageHandler } from './admin-send-support-message.handler';
import { ArchiveConversationHandler } from './archive-conversation.handler';
import { CheckAccessHandler } from './check-access.handler';
import { CreateConversationHandler } from './create-conversation.handler';
import { EnsureProjectConversationHandler } from './ensure-project-conversation.handler';
import { FindConversationsHandler } from './find-conversations.handler';
import { FindMessagesHandler } from './find-messages.handler';
import { MarkReadHandler } from './mark-read.handler';
import { SendMessageHandler } from './send-message.handler';
import { UnreadCountHandler } from './unread-count.handler';

const FIXED = new Date('2026-10-06T00:00:00Z');
const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'a@test.local' };
const adminActor = { adminUserId: 9, ip: '10.0.0.1' };

const member = (over: Record<string, unknown> = {}) => ({
  userId: null,
  clientId: null,
  adminUserId: null,
  joinedAt: FIXED,
  ...over,
});

const conversation = (over: Record<string, unknown> = {}) => ({
  id: 30,
  tenantId: 1,
  type: 'internal',
  projectId: null,
  supportTicketId: null,
  isArchived: false,
  createdAt: FIXED,
  members: [member({ userId: 1 }), member({ userId: 2 })],
  ...over,
});

const message = (over: Record<string, unknown> = {}) => ({
  id: 100,
  tenantId: 1,
  conversationId: 30,
  senderType: 'employee',
  senderId: 1,
  content: 'hello',
  isArchived: false,
  createdAt: FIXED,
  ...over,
});

describe('chat-access.helper', () => {
  it('a member matches only on the SAME id in the SAME column', () => {
    const members = [
      member({ userId: 5 }),
      member({ clientId: 5 }),
      member({ adminUserId: 7 }),
    ];
    expect(isMemberOf(members, { userId: 5 })).toBe(true);
    expect(isMemberOf(members, { clientId: 5 })).toBe(true);
    expect(isMemberOf(members, { adminUserId: 7 })).toBe(true);
    // user 7 is NOT admin 7, and client 7 is not user 7
    expect(isMemberOf(members, { userId: 7 })).toBe(false);
    expect(isMemberOf(members, { clientId: 7 })).toBe(false);
    expect(isMemberOf(members, { adminUserId: 5 })).toBe(false);
    expect(isMemberOf([], { userId: 5 })).toBe(false);
  });

  it('builds one room name per conversation', () => {
    expect(conversationRoom(30)).toBe('conversation:30');
  });

  it('reads one cookie out of a raw header', () => {
    expect(readCookie('a=1; access_token=abc.def; b=2', 'access_token')).toBe(
      'abc.def',
    );
    expect(readCookie('a=1', 'access_token')).toBeUndefined();
    expect(readCookie(undefined, 'access_token')).toBeUndefined();
  });
});

describe('Chat handlers', () => {
  const conversations = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findByProject: jest.fn(),
    setArchived: jest.fn(),
    addMember: jest.fn(),
    findByTicketForAdmin: jest.fn(),
    findSupportByIdForAdmin: jest.fn(),
    addAdminMemberForAdmin: jest.fn(),
  };
  const messages = {
    create: jest.fn(),
    findMany: jest.fn(),
    findManyForAdmin: jest.fn(),
    createForAdmin: jest.fn(),
  };
  const reads = {
    markReadForUser: jest.fn(),
    countUnread: jest.fn(),
    countUnreadByConversation: jest.fn(),
  };
  const tx = { marker: 'tx' };
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const users = { findActiveInTenant: jest.fn(), findByIdRaw: jest.fn() };
  const clients = { findByIdRaw: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const projects = { findOne: jest.fn() };
  const media = { attachToEntity: jest.fn(), findByEntityIds: jest.fn() };
  const audit = { write: jest.fn() };
  const gateway = { emitNewMessage: jest.fn(), emitMessageRead: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let access: CheckAccessHandler;
  let create: CreateConversationHandler;
  let find: FindConversationsHandler;
  let findMessages: FindMessagesHandler;
  let send: SendMessageHandler;
  let markRead: MarkReadHandler;
  let unread: UnreadCountHandler;
  let archive: ArchiveConversationHandler;
  let addMember: AddMemberHandler;
  let ensure: EnsureProjectConversationHandler;
  let adminFind: AdminFindSupportMessagesHandler;
  let adminSend: AdminSendSupportMessageHandler;
  let adminJoin: AdminJoinSupportHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    media.findByEntityIds.mockResolvedValue(new Map());
    const handlers = [
      CheckAccessHandler,
      CreateConversationHandler,
      FindConversationsHandler,
      FindMessagesHandler,
      SendMessageHandler,
      MarkReadHandler,
      UnreadCountHandler,
      ArchiveConversationHandler,
      AddMemberHandler,
      EnsureProjectConversationHandler,
      AdminFindSupportMessagesHandler,
      AdminSendSupportMessageHandler,
      AdminJoinSupportHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        { provide: ClientsService, useValue: clients },
        ...handlers,
        { provide: ConversationRepository, useValue: conversations },
        { provide: MessageRepository, useValue: messages },
        { provide: MessageReadRepository, useValue: reads },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: UsersService, useValue: users },
        { provide: ProjectsService, useValue: projects },
        { provide: MediaService, useValue: media },
        { provide: AuditService, useValue: audit },
        { provide: ChatGateway, useValue: gateway },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    access = module.get(CheckAccessHandler);
    create = module.get(CreateConversationHandler);
    find = module.get(FindConversationsHandler);
    findMessages = module.get(FindMessagesHandler);
    send = module.get(SendMessageHandler);
    markRead = module.get(MarkReadHandler);
    unread = module.get(UnreadCountHandler);
    archive = module.get(ArchiveConversationHandler);
    addMember = module.get(AddMemberHandler);
    ensure = module.get(EnsureProjectConversationHandler);
    adminFind = module.get(AdminFindSupportMessagesHandler);
    adminSend = module.get(AdminSendSupportMessageHandler);
    adminJoin = module.get(AdminJoinSupportHandler);
  });

  describe('CheckAccessHandler — the one membership check', () => {
    it('a member gets the conversation', async () => {
      conversations.findById.mockResolvedValue(conversation());
      const result = await access.assertMember(30, { userId: 1 });
      expect(result.id).toBe(30);
    });

    it('a same-tenant non-member -> 403', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(access.assertMember(30, { userId: 99 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("another tenant's conversation (the scoped read finds nothing) -> 404", async () => {
      conversations.findById.mockResolvedValue(null);
      await expect(access.assertMember(30, { userId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('CreateConversationHandler', () => {
    const body = { type: 'internal' as const, member_user_ids: [2, 3] };

    it('creator + 2 members = 3 member rows, in one transaction', async () => {
      users.findActiveInTenant.mockResolvedValue({ id: 2 });
      conversations.create.mockResolvedValue(
        conversation({
          members: [
            member({ userId: 1 }),
            member({ userId: 2 }),
            member({ userId: 3 }),
          ],
        }),
      );
      const result = await create.execute(body, actor);
      expect(conversations.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1, type: 'internal' }),
        [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
        tx,
      );
      expect(result.members).toHaveLength(3);
    });

    it('lists the creator once even if they name themselves', async () => {
      users.findActiveInTenant.mockResolvedValue({ id: 2 });
      conversations.create.mockResolvedValue(conversation());
      await create.execute({ ...body, member_user_ids: [1, 2, 2] }, actor);
      expect(conversations.create).toHaveBeenCalledWith(
        expect.anything(),
        [{ userId: 1 }, { userId: 2 }],
        tx,
      );
    });

    it('a member from ANOTHER tenant is refused, nothing written', async () => {
      users.findActiveInTenant.mockResolvedValueOnce({ id: 2 });
      users.findActiveInTenant.mockResolvedValueOnce(null); // user 3: not in this tenant
      await expect(create.execute(body, actor)).rejects.toThrow(
        /not an active user of this company/,
      );
      expect(conversations.create).not.toHaveBeenCalled();
    });

    it('an unknown project is refused', async () => {
      users.findActiveInTenant.mockResolvedValue({ id: 2 });
      projects.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        create.execute({ ...body, project_id: 99 }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('FindConversationsHandler', () => {
    it('lists only conversations the caller is in, hiding archived ones', async () => {
      conversations.findMany.mockResolvedValue([[conversation()], 1]);
      await find.execute({ page: 1, limit: 20 }, actor);
      expect(conversations.findMany).toHaveBeenCalledWith(
        { members: { some: { userId: 1 } }, isArchived: false },
        0,
        20,
      );
    });

    it('?archived=true shows the archived ones', async () => {
      conversations.findMany.mockResolvedValue([[], 0]);
      await find.execute({ page: 1, limit: 20, archived: true }, actor);
      expect(conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ isArchived: true }),
        0,
        20,
      );
    });
  });

  describe('FindMessagesHandler', () => {
    it('a non-member cannot read messages -> 403', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(
        findMessages.execute(
          30,
          { page: 1, limit: 20 },
          { ...actor, userId: 99 },
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(messages.findMany).not.toHaveBeenCalled();
    });

    it('returns the page with the files of ALL its messages from one query', async () => {
      conversations.findById.mockResolvedValue(conversation());
      messages.findMany.mockResolvedValue([
        [message({ id: 101 }), message({ id: 100 })],
        2,
      ]);
      media.findByEntityIds.mockResolvedValue(
        new Map([
          [
            101,
            [
              {
                id: 7,
                fileName: 'a.png',
                fileUrl: 'u',
                fileType: 'image/png',
                fileSize: 10,
              },
            ],
          ],
        ]),
      );
      const result = await findMessages.execute(
        30,
        { page: 1, limit: 20 },
        actor,
      );
      expect(media.findByEntityIds).toHaveBeenCalledTimes(1);
      expect(media.findByEntityIds).toHaveBeenCalledWith('message', [101, 100]);
      expect(result.data[0].attachments).toHaveLength(1);
      expect(result.data[1].attachments).toEqual([]);
    });
  });

  describe('SendMessageHandler', () => {
    it('writes the message with the conversation tenant, links the files in the same tx, emits', async () => {
      conversations.findById.mockResolvedValue(conversation());
      messages.create.mockResolvedValue(message());
      const result = await send.execute(
        30,
        { content: '  hello  ', media_ids: [7, 8] },
        actor,
      );
      expect(messages.create).toHaveBeenCalledWith(
        {
          tenantId: 1,
          conversationId: 30,
          senderType: 'employee',
          senderId: 1,
          content: 'hello',
        },
        tx,
      );
      expect(media.attachToEntity).toHaveBeenCalledWith(
        [7, 8],
        'message',
        100,
        actor,
        tx,
      );
      expect(gateway.emitNewMessage).toHaveBeenCalledWith(30, result);
    });

    it('tells the OTHER employees of the thread (new_message), never the sender', async () => {
      conversations.findById.mockResolvedValue(
        conversation({
          members: [
            member({ userId: 1 }),
            member({ userId: 2 }),
            member({ userId: 3 }),
          ],
        }),
      );
      messages.create.mockResolvedValue(message());
      users.findByIdRaw.mockResolvedValue({ id: 1, name: 'Sara' });
      await send.execute(30, { content: 'hello team' }, actor);
      expect(notifications.dispatch).toHaveBeenCalledTimes(1);
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'new_message',
        expect.objectContaining({
          tenantId: 1,
          userIds: [2, 3],
          payload: containing({
            entity_id: 30,
            sender_name: 'Sara',
            preview: 'hello team',
          }),
        }),
      );
    });

    it('a project_client thread also emails the client (client_portal_message)', async () => {
      conversations.findById.mockResolvedValue(
        conversation({
          type: 'project_client',
          members: [member({ userId: 1 }), member({ clientId: 8 })],
        }),
      );
      messages.create.mockResolvedValue(message());
      users.findByIdRaw.mockResolvedValue({ id: 1, name: 'Sara' });
      clients.findByIdRaw.mockResolvedValue({
        id: 8,
        email: 'client@test.local',
      });
      await send.execute(30, { content: 'a reply' }, actor);
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'client_portal_message',
        expect.objectContaining({
          tenantId: 1,
          clientEmail: 'client@test.local',
          payload: { preview: 'a reply' },
        }),
      );
    });

    it('a long message is cut to a preview', async () => {
      conversations.findById.mockResolvedValue(conversation());
      messages.create.mockResolvedValue(message());
      users.findByIdRaw.mockResolvedValue({ id: 1, name: 'Sara' });
      await send.execute(30, { content: 'x'.repeat(500) }, actor);
      const context = callArg<{ payload: { preview: string } }>(
        notifications.dispatch,
        0,
        1,
      );
      expect(context.payload.preview.length).toBeLessThanOrEqual(123);
    });

    it('a bad attachment rolls the message back: nothing is emitted', async () => {
      conversations.findById.mockResolvedValue(conversation());
      messages.create.mockResolvedValue(message());
      media.attachToEntity.mockRejectedValue(new BadRequestException('bad'));
      await expect(
        send.execute(30, { content: 'hi', media_ids: [7] }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(gateway.emitNewMessage).not.toHaveBeenCalled();
    });

    it('a non-member cannot send -> 403', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(
        send.execute(30, { content: 'hi' }, { ...actor, userId: 99 }),
      ).rejects.toThrow(ForbiddenException);
      expect(messages.create).not.toHaveBeenCalled();
    });

    it('an archived conversation takes no message', async () => {
      conversations.findById.mockResolvedValue(
        conversation({ isArchived: true }),
      );
      await expect(send.execute(30, { content: 'hi' }, actor)).rejects.toThrow(
        /archived/,
      );
    });

    it('a blank message is refused', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(send.execute(30, { content: '   ' }, actor)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('MarkReadHandler / UnreadCountHandler', () => {
    it('opening marks the unread ones, announces each, and reports 0 unread', async () => {
      conversations.findById.mockResolvedValue(conversation());
      reads.markReadForUser.mockResolvedValue([101, 102]);
      reads.countUnread.mockResolvedValue(0);
      const result = await markRead.execute(30, actor);
      expect(reads.markReadForUser).toHaveBeenCalledWith(30, 1, 1);
      expect(gateway.emitMessageRead).toHaveBeenCalledTimes(2);
      expect(gateway.emitMessageRead).toHaveBeenCalledWith(30, 101, {
        type: 'employee',
        id: 1,
      });
      expect(result).toEqual({ conversationId: 30, marked: 2, unread: 0 });
    });

    it('opening again marks nothing and announces nothing', async () => {
      conversations.findById.mockResolvedValue(conversation());
      reads.markReadForUser.mockResolvedValue([]);
      reads.countUnread.mockResolvedValue(0);
      const result = await markRead.execute(30, actor);
      expect(result.marked).toBe(0);
      expect(gateway.emitMessageRead).not.toHaveBeenCalled();
    });

    it('a non-member cannot mark read', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(
        markRead.execute(30, { ...actor, userId: 99 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('the unread count is per conversation, with a total', async () => {
      reads.countUnreadByConversation.mockResolvedValue([
        { conversationId: 30, unread: 2 },
        { conversationId: 31, unread: 1 },
      ]);
      const result = await unread.execute(actor);
      expect(result.total).toBe(3);
      expect(result.conversations).toHaveLength(2);
    });
  });

  describe('ArchiveConversationHandler', () => {
    it('archives, never deletes', async () => {
      conversations.findById.mockResolvedValue(conversation());
      conversations.setArchived.mockResolvedValue(
        conversation({ isArchived: true }),
      );
      const result = await archive.execute(30, actor);
      expect(conversations.setArchived).toHaveBeenCalledWith(30, true);
      expect(result.isArchived).toBe(true);
    });

    it('a non-member cannot archive', async () => {
      conversations.findById.mockResolvedValue(conversation());
      await expect(
        archive.execute(30, { ...actor, userId: 99 }),
      ).rejects.toThrow(ForbiddenException);
      expect(conversations.setArchived).not.toHaveBeenCalled();
    });
  });

  describe('AddMemberHandler', () => {
    it('adds an active user of this tenant to an internal conversation', async () => {
      conversations.findById.mockResolvedValue(conversation());
      users.findActiveInTenant.mockResolvedValue({ id: 5 });
      conversations.addMember.mockResolvedValue(true);
      await addMember.execute(30, { user_id: 5 }, actor);
      expect(conversations.addMember).toHaveBeenCalledWith(30, 1, {
        userId: 5,
      });
    });

    it('a user of another tenant is refused', async () => {
      conversations.findById.mockResolvedValue(conversation());
      users.findActiveInTenant.mockResolvedValue(null);
      await expect(
        addMember.execute(30, { user_id: 5 }, actor),
      ).rejects.toThrow(/not an active user/);
      expect(conversations.addMember).not.toHaveBeenCalled();
    });

    it('only an internal conversation takes new members', async () => {
      conversations.findById.mockResolvedValue(
        conversation({ type: 'project_client', projectId: 12 }),
      );
      await expect(
        addMember.execute(30, { user_id: 5 }, actor),
      ).rejects.toThrow(/internal/);
    });

    it('adding the same person twice -> 409', async () => {
      conversations.findById.mockResolvedValue(conversation());
      users.findActiveInTenant.mockResolvedValue({ id: 2 });
      conversations.addMember.mockResolvedValue(false);
      await expect(
        addMember.execute(30, { user_id: 2 }, actor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('EnsureProjectConversationHandler — idempotent', () => {
    const project = { id: 12, clientId: 4, managerId: 6 };

    it('creates the thread with the client, the caller and the manager', async () => {
      projects.findOne.mockResolvedValue(project);
      conversations.findByProject.mockResolvedValue(null);
      users.findActiveInTenant.mockResolvedValue({ id: 6 });
      conversations.create.mockResolvedValue(
        conversation({
          type: 'project_client',
          projectId: 12,
          members: [
            member({ clientId: 4 }),
            member({ userId: 1 }),
            member({ userId: 6 }),
          ],
        }),
      );
      const result = await ensure.execute(12, actor);
      expect(conversations.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'project_client', projectId: 12 }),
        [{ clientId: 4 }, { userId: 1 }, { userId: 6 }],
        tx,
      );
      expect(result.created).toBe(true);
    });

    it('called a second time it reuses the thread and creates nothing', async () => {
      projects.findOne.mockResolvedValue(project);
      conversations.findByProject.mockResolvedValue(
        conversation({ type: 'project_client', projectId: 12 }),
      );
      conversations.addMember.mockResolvedValue(false);
      const result = await ensure.execute(12, actor);
      expect(conversations.create).not.toHaveBeenCalled();
      expect(result.created).toBe(false);
      expect(result.conversation.id).toBe(30);
    });

    it('a lost race answers with the thread that won', async () => {
      projects.findOne.mockResolvedValue({ ...project, managerId: null });
      conversations.findByProject
        .mockResolvedValueOnce(null) // nothing yet...
        .mockResolvedValueOnce(
          conversation({ type: 'project_client', projectId: 12 }),
        ) // ...but the unique index let someone else win
        .mockResolvedValue(
          conversation({ type: 'project_client', projectId: 12 }),
        );
      conversations.create.mockRejectedValue(new Error('unique violation'));
      conversations.addMember.mockResolvedValue(true);
      const result = await ensure.execute(12, actor);
      expect(result.created).toBe(false);
    });

    it('a genuine failure (nobody won) is not swallowed', async () => {
      projects.findOne.mockResolvedValue({ ...project, managerId: null });
      conversations.findByProject.mockResolvedValue(null);
      conversations.create.mockRejectedValue(new Error('db down'));
      await expect(ensure.execute(12, actor)).rejects.toThrow('db down');
    });

    it('an unknown project -> 404', async () => {
      projects.findOne.mockRejectedValue(new NotFoundException());
      await expect(ensure.execute(99, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('the platform admin cross-tenant door', () => {
    const supportConversation = conversation({
      type: 'support',
      supportTicketId: 55,
      members: [member({ userId: 1 })],
    });

    it('reads a support thread through the explicit method, with the tenant, and ALWAYS audits', async () => {
      conversations.findByTicketForAdmin.mockResolvedValue(supportConversation);
      messages.findManyForAdmin.mockResolvedValue([[message()], 1]);
      const result = await adminFind.execute(
        55,
        { tenant_id: 1, page: 1, limit: 20 },
        adminActor,
      );
      expect(conversations.findByTicketForAdmin).toHaveBeenCalledWith(55, 1);
      expect(messages.findManyForAdmin).toHaveBeenCalledWith(30, 1, 0, 20);
      expect(result.data).toHaveLength(1);
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          adminUserId: 9,
          action: 'support_read',
          entityType: 'conversation',
          entityId: 30,
          ipAddress: '10.0.0.1',
        }),
      );
    });

    it('the ticket of ANOTHER tenant finds nothing, so nothing is read or audited as a read', async () => {
      conversations.findByTicketForAdmin.mockResolvedValue(null);
      await expect(
        adminFind.execute(55, { tenant_id: 2, page: 1, limit: 20 }, adminActor),
      ).rejects.toThrow(NotFoundException);
      expect(messages.findManyForAdmin).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('a request with no platform admin session is refused', async () => {
      await expect(
        adminFind.execute(
          55,
          { tenant_id: 1, page: 1, limit: 20 },
          { adminUserId: null, ip: null },
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(conversations.findByTicketForAdmin).not.toHaveBeenCalled();
    });

    it('a reply: sender admin, the conversation tenant, the admin becomes a member, audited, emitted', async () => {
      conversations.findByTicketForAdmin.mockResolvedValue(supportConversation);
      messages.createForAdmin.mockResolvedValue(
        message({ senderType: 'admin', senderId: 9, content: 'on it' }),
      );
      await adminSend.execute(55, 1, { content: ' on it ' }, adminActor);
      expect(conversations.addAdminMemberForAdmin).toHaveBeenCalledWith(
        30,
        1,
        9,
      );
      expect(messages.createForAdmin).toHaveBeenCalledWith({
        tenantId: 1,
        conversationId: 30,
        senderType: 'admin',
        senderId: 9,
        content: 'on it',
      });
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'support_reply', adminUserId: 9 }),
      );
      expect(gateway.emitNewMessage).toHaveBeenCalledTimes(1);
      // the tenant's own people (not the platform admin) are told: support_reply
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'support_reply',
        expect.objectContaining({
          tenantId: 1,
          userIds: expect.any(Array) as unknown[],
          payload: containing({
            entity_id: 30,
            preview: 'on it',
          }),
        }),
      );
    });

    it('a reply on an archived thread, or to another tenant, is refused', async () => {
      conversations.findByTicketForAdmin.mockResolvedValueOnce(
        conversation({ ...supportConversation, isArchived: true }),
      );
      await expect(
        adminSend.execute(55, 1, { content: 'x' }, adminActor),
      ).rejects.toThrow(/archived/);
      conversations.findByTicketForAdmin.mockResolvedValueOnce(null);
      await expect(
        adminSend.execute(55, 2, { content: 'x' }, adminActor),
      ).rejects.toThrow(NotFoundException);
      expect(messages.createForAdmin).not.toHaveBeenCalled();
    });

    it('joining the live room is a cross-tenant read too: the tenant is checked and it is audited', async () => {
      conversations.findSupportByIdForAdmin.mockResolvedValue(
        supportConversation,
      );
      await adminJoin.execute(30, 1, 9, '10.0.0.1');
      expect(conversations.findSupportByIdForAdmin).toHaveBeenCalledWith(30, 1);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'support_join', adminUserId: 9 }),
      );

      conversations.findSupportByIdForAdmin.mockResolvedValue(null);
      await expect(adminJoin.execute(30, 2, 9, null)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('ChatGateway', () => {
  const tokens = {
    verifyAccessToken: jest.fn(),
    verifyAdminAccessToken: jest.fn(),
  };
  const tenantContext = { setTenantId: jest.fn(), setUserId: jest.fn() };
  const cls = {
    run: jest.fn((fn: () => Promise<unknown>) => fn()),
  };
  const access = { assertMember: jest.fn() };
  const adminJoin = { execute: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
  let gateway: ChatGateway;

  const socket = (over: Record<string, unknown> = {}) =>
    ({
      id: 's1',
      handshake: {
        auth: {},
        headers: { cookie: 'access_token=tok' },
        address: '1.2.3.4',
      },
      data: {},
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      ...over,
    }) as never;

  beforeEach(async () => {
    jest.resetAllMocks();
    cls.run.mockImplementation((fn: () => Promise<unknown>) => fn());
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: { dispatch: jest.fn() } },
        ChatGateway,
        { provide: TokenHelper, useValue: tokens },
        { provide: ClsService, useValue: cls },
        { provide: TenantContextService, useValue: tenantContext },
        { provide: CheckAccessHandler, useValue: access },
        { provide: AdminJoinSupportHandler, useValue: adminJoin },
        { provide: getLoggerToken(ChatGateway.name), useValue: logger },
      ],
    }).compile();
    gateway = module.get(ChatGateway);
  });

  it('a socket with no valid token is disconnected at the handshake', () => {
    tokens.verifyAccessToken.mockImplementation(() => {
      throw new Error('bad');
    });
    const client = socket();
    gateway.handleConnection(client);
    expect(
      (client as unknown as { disconnect: jest.Mock }).disconnect,
    ).toHaveBeenCalledWith(true);
  });

  it('a socket with no token at all is disconnected', () => {
    const client = socket({
      handshake: { auth: {}, headers: {}, address: 'x' },
    });
    gateway.handleConnection(client);
    expect(
      (client as unknown as { disconnect: jest.Mock }).disconnect,
    ).toHaveBeenCalled();
  });

  it('a member joins: the tenant is put in context and the SAME access check runs', async () => {
    tokens.verifyAccessToken.mockReturnValue({ sub: 1, tenantId: 4 });
    access.assertMember.mockResolvedValue({ id: 30 });
    const client = socket();
    gateway.handleConnection(client);

    const ack = await gateway.join(client, { conversation_id: 30 });

    expect(ack).toEqual({ ok: true });
    expect(tenantContext.setTenantId).toHaveBeenCalledWith(4);
    expect(access.assertMember).toHaveBeenCalledWith(30, { userId: 1 });
    expect(
      (client as unknown as { join: jest.Mock }).join,
    ).toHaveBeenCalledWith('conversation:30');
  });

  it('a NON-member join is refused and never enters the room', async () => {
    tokens.verifyAccessToken.mockReturnValue({ sub: 99, tenantId: 4 });
    access.assertMember.mockRejectedValue(
      new ForbiddenException('You are not a member of this conversation'),
    );
    const client = socket();
    gateway.handleConnection(client);

    const ack = await gateway.join(client, { conversation_id: 30 });

    expect(ack).toMatchObject({ ok: false, status: 403 });
    expect(
      (client as unknown as { join: jest.Mock }).join,
    ).not.toHaveBeenCalled();
  });

  it('a join with no conversation_id is refused', async () => {
    tokens.verifyAccessToken.mockReturnValue({ sub: 1, tenantId: 4 });
    const client = socket();
    gateway.handleConnection(client);
    expect(await gateway.join(client, {})).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(await gateway.join(client, { conversation_id: 'x' })).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('an admin join needs a tenant_id and goes through the audited admin handler', async () => {
    tokens.verifyAdminAccessToken.mockReturnValue({ sub: 9 });
    adminJoin.execute.mockResolvedValue({ id: 30 });
    const client = socket({
      handshake: {
        auth: { role: 'admin', token: 'admintok' },
        headers: {},
        address: '9.9.9.9',
      },
    });
    gateway.handleConnection(client);

    expect(await gateway.join(client, { conversation_id: 30 })).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(
      await gateway.join(client, { conversation_id: 30, tenant_id: 4 }),
    ).toEqual({ ok: true });
    expect(adminJoin.execute).toHaveBeenCalledWith(30, 4, 9, '9.9.9.9');
    expect(access.assertMember).not.toHaveBeenCalled();
  });

  it('the socket speaks snake_case like the HTTP API (the interceptor only wraps HTTP)', () => {
    const emit = jest.fn();
    (gateway as unknown as { server: unknown }).server = {
      to: jest.fn().mockReturnValue({ emit }),
    };
    gateway.emitNewMessage(30, {
      id: 1,
      conversationId: 30,
      senderType: 'employee',
      attachments: [{ id: 7, fileName: 'a.png', fileUrl: 'u' }],
    });
    expect(emit).toHaveBeenCalledWith('new_message', {
      id: 1,
      conversation_id: 30,
      sender_type: 'employee',
      attachments: [{ id: 7, file_name: 'a.png', file_url: 'u' }],
    });
  });

  it('emits new_message and message_read to the conversation room only', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as unknown as { server: unknown }).server = { to };
    gateway.emitNewMessage(30, { id: 1 });
    expect(to).toHaveBeenCalledWith('conversation:30');
    expect(emit).toHaveBeenCalledWith('new_message', { id: 1 });
    gateway.emitMessageRead(30, 5, { type: 'employee', id: 2 });
    expect(emit).toHaveBeenCalledWith('message_read', {
      conversation_id: 30,
      message_id: 5,
      reader: { type: 'employee', id: 2 },
    });
  });
});
