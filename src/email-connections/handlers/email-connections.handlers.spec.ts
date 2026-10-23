import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { AppEventsService } from '../../common/events/app-events.service';
import { decryptSecret } from '../../common/helpers/crypto.helper';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import * as google from '../helpers/gmail-oauth.helper';
import { forwardLocalPart, slugLocalPart } from '../helpers/inbox.helper';
import { UserEventsListener } from '../listeners/user-events.listener';
import { EmailInboxRepository } from '../repositories/email-inbox.repository';
import { DisconnectInboxHandler } from './disconnect-inbox.handler';
import { FinishGmailConnectHandler } from './finish-gmail-connect.handler';
import { MarkInboxBrokenHandler } from './mark-inbox-broken.handler';
import { SendThroughInboxHandler } from './send-through-inbox.handler';
import { SetCompanyAddressHandler } from './set-company-address.handler';

jest.mock('../helpers/gmail-oauth.helper', () => {
  const actual = jest.requireActual<typeof google>(
    '../helpers/gmail-oauth.helper',
  );
  return {
    ...actual,
    exchangeCode: jest.fn(),
    revokeToken: jest.fn(),
    getAccessToken: jest.fn(),
    sendRawEmail: jest.fn(),
  };
});
const mocked = google as jest.Mocked<typeof google>;

const roleNames: Record<number, string> = { 1: 'admin', 2: 'manager' };
const actor = (userId: number, roleId: number) => ({
  userId,
  roleId,
  tenantId: 1,
  email: null,
});

const inbox = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  kind: 'gmail',
  ownerUserId: 2,
  gmailAddress: 'manager@gmail.com',
  refreshTokenEncrypted: null,
  status: 'active',
  addresses: [{ id: 9, localPart: 'test-alpha.k2m9x7qpwz', isPrimary: true }],
  ...over,
});

describe('inbox.helper', () => {
  it('builds a safe local part from a company name', () => {
    expect(slugLocalPart('Maçonnerie Dubois & Fils')).toBe(
      'maconnerie-dubois-fils',
    );
    expect(slugLocalPart('reply-co')).toBe('co-reply-co');
    expect(slugLocalPart('A')).toMatch(/^company-/);
  });

  it('gives each Gmail its own random forward address', () => {
    const a = forwardLocalPart('test-alpha');
    expect(a).toMatch(/^test-alpha\.[a-z2-9]{10}$/);
    expect(forwardLocalPart('test-alpha')).not.toBe(a);
  });
});

describe('Email connections handlers', () => {
  const inboxes = {
    findById: jest.fn(),
    findCompanyInbox: jest.fn(),
    createCompanyInbox: jest.fn(),
    findAddressForRouting: jest.fn(),
    demotePrimary: jest.fn(),
    promote: jest.fn(),
    addAddress: jest.fn(),
    updateStatus: jest.fn(),
    wipeToken: jest.fn(),
    findForUser: jest.fn(),
    findGmailForOwner: jest.fn(),
    createGmailInbox: jest.fn(),
    setToken: jest.fn(),
    touchUsed: jest.fn(),
  };
  const roles = {
    findRoleById: jest.fn((id: number) =>
      Promise.resolve({ id, name: roleNames[id] }),
    ),
    findOverridesForRole: jest.fn(() => Promise.resolve([])),
  };
  const audit = { write: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const tenants = { findForNotifications: jest.fn() };
  const users = { findByIdRaw: jest.fn(), findActiveInTenant: jest.fn() };
  const email = { sendThreaded: jest.fn() };
  const events = { on: jest.fn() };
  const cls = { run: jest.fn((fn: () => unknown) => fn()) };
  const tenantContext = { setTenantId: jest.fn() };
  const jwt = { verifyAsync: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  let setCompany: SetCompanyAddressHandler;
  let disconnect: DisconnectInboxHandler;
  let finish: FinishGmailConnectHandler;
  let send: SendThroughInboxHandler;
  let listener: UserEventsListener;

  beforeEach(async () => {
    jest.clearAllMocks();
    cls.run.mockImplementation((fn: () => unknown) => fn());
    tenants.findForNotifications.mockResolvedValue({
      id: 1,
      name: 'TEST Alpha',
      locale: 'fr',
    });
    const handlers = [
      SetCompanyAddressHandler,
      DisconnectInboxHandler,
      FinishGmailConnectHandler,
      SendThroughInboxHandler,
      MarkInboxBrokenHandler,
      UserEventsListener,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: EmailInboxRepository, useValue: inboxes },
        { provide: RolesService, useValue: roles },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
        { provide: TenantsService, useValue: tenants },
        { provide: UsersService, useValue: users },
        { provide: EmailService, useValue: email },
        { provide: AppEventsService, useValue: events },
        { provide: ClsService, useValue: cls },
        { provide: TenantContextService, useValue: tenantContext },
        { provide: JwtService, useValue: jwt },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();
    setCompany = module.get(SetCompanyAddressHandler);
    disconnect = module.get(DisconnectInboxHandler);
    finish = module.get(FinishGmailConnectHandler);
    send = module.get(SendThroughInboxHandler);
    listener = module.get(UserEventsListener);
  });

  describe('SetCompanyAddressHandler', () => {
    const company = {
      id: 1,
      tenantId: 1,
      kind: 'company',
      status: 'active',
      addresses: [{ id: 3, localPart: 'old-name', isPrimary: true }],
    };

    it('a name of another company → 409', async () => {
      inboxes.findCompanyInbox.mockResolvedValue(company);
      inboxes.findAddressForRouting.mockResolvedValue({
        id: 7,
        inboxId: 55,
        isPrimary: true,
      });
      await expect(
        setCompany.execute({ local_part: 'taken' }, actor(1, 1)),
      ).rejects.toThrow(ConflictException);
    });

    it('a new name becomes primary, the old one is kept', async () => {
      inboxes.findCompanyInbox.mockResolvedValue(company);
      inboxes.findAddressForRouting.mockResolvedValue(null);
      inboxes.findById.mockResolvedValue({
        ...company,
        addresses: [
          { id: 3, localPart: 'old-name', isPrimary: false },
          { id: 4, localPart: 'test-alpha', isPrimary: true },
        ],
      });
      const result = await setCompany.execute(
        { local_part: 'test-alpha' },
        actor(1, 1),
      );
      expect(inboxes.demotePrimary).toHaveBeenCalledWith(1);
      expect(inboxes.addAddress).toHaveBeenCalledWith(1, 1, 'test-alpha', true);
      expect(result.address).toMatch(/^test-alpha@/);
      expect(result.oldAddresses[0]).toMatch(/^old-name@/);
    });

    it('the first call creates the company inbox', async () => {
      inboxes.findCompanyInbox.mockResolvedValue(null);
      inboxes.createCompanyInbox.mockResolvedValue({ id: 1, kind: 'company' });
      inboxes.findAddressForRouting.mockResolvedValue(null);
      inboxes.findById.mockResolvedValue(company);
      await setCompany.execute({ local_part: 'test-alpha' }, actor(1, 1));
      expect(inboxes.createCompanyInbox).toHaveBeenCalledWith(1);
    });
  });

  describe('DisconnectInboxHandler', () => {
    it('another user without settings edit → 403', async () => {
      inboxes.findById.mockResolvedValue(inbox({ ownerUserId: 1 }));
      await expect(disconnect.execute(2, actor(2, 2))).rejects.toThrow(
        ForbiddenException,
      );
      expect(inboxes.updateStatus).not.toHaveBeenCalled();
    });

    it('the admin removes anyone’s Gmail; the token is wiped', async () => {
      inboxes.findById.mockResolvedValue(inbox());
      await disconnect.execute(2, actor(1, 1));
      expect(inboxes.updateStatus).toHaveBeenCalledWith(2, 'removed');
      expect(inboxes.wipeToken).toHaveBeenCalledWith(2);
    });

    it('the company inbox cannot be removed; an unknown one is 404', async () => {
      inboxes.findById.mockResolvedValueOnce(inbox({ kind: 'company' }));
      await expect(disconnect.execute(1, actor(1, 1))).rejects.toThrow(
        BadRequestException,
      );
      inboxes.findById.mockResolvedValueOnce(null);
      await expect(disconnect.execute(9, actor(1, 1))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UserEventsListener (D3)', () => {
    it('a deactivated user loses every Gmail inbox, in the tenant context', async () => {
      inboxes.findForUser.mockResolvedValue([inbox(), inbox({ id: 3 })]);
      await listener.onUserDeactivated(1, 2);
      expect(tenantContext.setTenantId).toHaveBeenCalledWith(1);
      expect(inboxes.updateStatus).toHaveBeenCalledWith(2, 'removed');
      expect(inboxes.updateStatus).toHaveBeenCalledWith(3, 'removed');
    });
  });

  describe('FinishGmailConnectHandler', () => {
    beforeEach(() => {
      jwt.verifyAsync.mockResolvedValue({ tenantId: 1, userId: 2, nonce: 'n' });
      users.findActiveInTenant.mockResolvedValue({ id: 2 });
      inboxes.findGmailForOwner.mockResolvedValue(null);
      inboxes.findCompanyInbox.mockResolvedValue(null);
    });

    it('a bad state → error redirect, Google never called', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('expired'));
      const url = await finish.execute('code', 'bad', undefined);
      expect(url).toContain('gmail=error&reason=invalid_state');
      expect(mocked.exchangeCode).not.toHaveBeenCalled();
    });

    it('the "send" box left unchecked → refused, token revoked, nothing saved', async () => {
      mocked.exchangeCode.mockResolvedValue({
        refreshToken: 'rt',
        email: 'manager@gmail.com',
        scopes: 'openid email',
      });
      mocked.revokeToken.mockResolvedValue(true);
      const url = await finish.execute('code', 'state', undefined);
      expect(url).toContain('reason=send_permission_missing');
      expect(mocked.revokeToken).toHaveBeenCalledWith('rt');
      expect(inboxes.createGmailInbox).not.toHaveBeenCalled();
    });

    it('connected: the refresh token is stored encrypted, with a forward address', async () => {
      mocked.exchangeCode.mockResolvedValue({
        refreshToken: 'rt-secret',
        email: 'manager@gmail.com',
        scopes: `openid email ${google.GMAIL_SEND_SCOPE}`,
      });
      inboxes.createGmailInbox.mockResolvedValue({ id: 2 });
      const url = await finish.execute('code', 'state', undefined);
      expect(url).toMatch(/\/fr\/settings\/email\?gmail=connected$/);
      const saved = (
        inboxes.createGmailInbox.mock.calls[0] as [
          { refreshTokenEncrypted: string; localPart: string },
        ]
      )[0];
      expect(saved.refreshTokenEncrypted).not.toContain('rt-secret');
      expect(decryptSecret(saved.refreshTokenEncrypted)).toBe('rt-secret');
      expect(saved.localPart).toMatch(/^test-alpha\.[a-z2-9]{10}$/);
    });

    it('the same Gmail again = a reconnect of the same inbox', async () => {
      mocked.exchangeCode.mockResolvedValue({
        refreshToken: 'rt2',
        email: 'manager@gmail.com',
        scopes: google.GMAIL_SEND_SCOPE,
      });
      inboxes.findGmailForOwner.mockResolvedValue(inbox());
      await finish.execute('code', 'state', undefined);
      expect(inboxes.setToken).toHaveBeenCalled();
      expect(inboxes.createGmailInbox).not.toHaveBeenCalled();
    });
  });

  describe('SendThroughInboxHandler', () => {
    const outbound = {
      inboxId: 2,
      to: ['eya@gmail.com'],
      subject: 'Devis cuisine',
      isReply: false,
      subjectCode: 'K7Q2M9',
      replyToken: 'tok',
      text: 'Bonjour',
      references: [],
      attachments: [],
    };

    it('company inbox: Resend, company name, reply token in Reply-To', async () => {
      inboxes.findById.mockResolvedValue({
        id: 1,
        tenantId: 1,
        kind: 'company',
        status: 'active',
        addresses: [{ localPart: 'test-alpha', isPrimary: true }],
      });
      email.sendThreaded.mockResolvedValue({ resendEmailId: 'rs' });
      const sent = await send.execute({
        ...outbound,
        inboxId: 1,
        isReply: true,
        references: ['<c1@x>'],
      });
      const call = (
        email.sendThreaded.mock.calls[0] as [Record<string, unknown>]
      )[0];
      expect(call).toMatchObject({
        fromName: 'TEST Alpha',
        subject: 'Re: Devis cuisine',
        inReplyTo: '<c1@x>',
        references: ['<c1@x>'],
      });
      expect(call.replyTo).toMatch(/^reply-tok@/);
      expect(sent.transport).toBe('resend');
    });

    it('Gmail: the subject ends with the code, no Reply-To', async () => {
      inboxes.findById.mockResolvedValue(
        inbox({ refreshTokenEncrypted: 'v1.x.y.z' }),
      );
      jest
        .spyOn(
          jest.requireActual<{ decryptSecret: typeof decryptSecret }>(
            '../../common/helpers/crypto.helper',
          ),
          'decryptSecret',
        )
        .mockReturnValue('rt');
      mocked.getAccessToken.mockResolvedValue('at');
      mocked.sendRawEmail.mockResolvedValue({ id: 'g1', threadId: 't1' });
      const sent = await send.execute(outbound);
      const raw = mocked.sendRawEmail.mock.calls[0][1];
      expect(raw).toContain('Subject: Devis cuisine [#K7Q2M9]');
      expect(raw).not.toContain('Reply-To');
      expect(sent).toMatchObject({ transport: 'gmail', gmailMessageId: 'g1' });
    });

    it("Gmail reply to the client's email: their subject, no code, threaded", async () => {
      inboxes.findById.mockResolvedValue(
        inbox({ refreshTokenEncrypted: 'v1.x.y.z' }),
      );
      jest
        .spyOn(
          jest.requireActual<{ decryptSecret: typeof decryptSecret }>(
            '../../common/helpers/crypto.helper',
          ),
          'decryptSecret',
        )
        .mockReturnValue('rt');
      mocked.getAccessToken.mockResolvedValue('at');
      mocked.sendRawEmail.mockResolvedValue({ id: 'g2', threadId: 't2' });
      const sent = await send.execute({
        ...outbound,
        isReply: true,
        references: ['<c1@mail.gmail.com>'],
      });
      const raw = mocked.sendRawEmail.mock.calls[0][1];
      expect(raw).toContain('Subject: Re: Devis cuisine\r\n');
      expect(raw).not.toContain('[#K7Q2M9]');
      expect(raw).toContain('In-Reply-To: <c1@mail.gmail.com>');
      expect(sent.subject).toBe('Re: Devis cuisine');
    });

    it('Gmail reply in a thread WE started: the code stays, threaded', async () => {
      inboxes.findById.mockResolvedValue(
        inbox({ refreshTokenEncrypted: 'v1.x.y.z' }),
      );
      jest
        .spyOn(
          jest.requireActual<{ decryptSecret: typeof decryptSecret }>(
            '../../common/helpers/crypto.helper',
          ),
          'decryptSecret',
        )
        .mockReturnValue('rt');
      mocked.getAccessToken.mockResolvedValue('at');
      mocked.sendRawEmail.mockResolvedValue({ id: 'g3', threadId: 't3' });
      const sent = await send.execute({
        ...outbound,
        isReply: true,
        threadHasCode: true,
        references: ['<c1@mail.gmail.com>'],
      });
      const raw = mocked.sendRawEmail.mock.calls[0][1];
      expect(raw).toContain('Subject: Re: Devis cuisine [#K7Q2M9]\r\n');
      expect(raw).toContain('In-Reply-To: <c1@mail.gmail.com>');
      expect(sent.subject).toBe('Re: Devis cuisine [#K7Q2M9]');
    });

    it('Gmail access gone → 409, inbox disconnected + alert, nothing sent elsewhere', async () => {
      inboxes.findById.mockResolvedValue(
        inbox({ refreshTokenEncrypted: 'v1.x.y.z' }),
      );
      jest
        .spyOn(
          jest.requireActual<{ decryptSecret: typeof decryptSecret }>(
            '../../common/helpers/crypto.helper',
          ),
          'decryptSecret',
        )
        .mockReturnValue('rt');
      mocked.getAccessToken.mockRejectedValue(
        new google.GmailAccessLostError('invalid_grant'),
      );
      users.findByIdRaw.mockResolvedValue({ name: 'Manager' });
      await expect(send.execute(outbound)).rejects.toThrow(ConflictException);
      expect(inboxes.updateStatus).toHaveBeenCalledWith(
        2,
        'disconnected',
        'invalid_grant',
      );
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'email_mailbox_disconnected',
        expect.objectContaining({ userIds: [2] }),
      );
      expect(email.sendThreaded).not.toHaveBeenCalled();
    });

    it('a disconnected Gmail → 409 at once', async () => {
      inboxes.findById.mockResolvedValue(inbox({ status: 'disconnected' }));
      await expect(send.execute(outbound)).rejects.toThrow(ConflictException);
      expect(mocked.getAccessToken).not.toHaveBeenCalled();
    });
  });
});
