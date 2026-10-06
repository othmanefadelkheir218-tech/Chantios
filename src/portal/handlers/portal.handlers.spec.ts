import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ChatService } from '../../chat/chat.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { InvoicesService } from '../../invoices/invoices.service';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import { QuotesService } from '../../quotes/quotes.service';
import { ReportsService } from '../../reports/reports.service';
import { TenantsService } from '../../tenants/tenants.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { PortalTokenGuard } from '../guards/portal-token.guard';
import {
  buildPortalUrl,
  expiryFromNow,
  generateRawToken,
  hashToken,
  isTokenUsable,
  PORTAL_EXPIRED_MESSAGE,
} from '../helpers/portal.helper';
import {
  toPortalInvoice,
  toPortalMessage,
  toPortalOverview,
  toPortalQuote,
} from '../helpers/portal-view.helper';
import { PortalTokenRepository } from '../repositories/portal-token.repository';
import { PortalTrackingRepository } from '../repositories/portal-tracking.repository';
import { ExpireTokensHandler } from './expire-tokens.handler';
import { FindPortalLinkHandler } from './find-portal-link.handler';
import { FindTrackingHandler } from './find-tracking.handler';
import { GenerateTokenHandler } from './generate-token.handler';
import { PortalAcceptQuoteHandler } from './portal-accept-quote.handler';
import { PortalDocumentHandler } from './portal-document.handler';
import { PortalInvoicesHandler } from './portal-invoices.handler';
import { PortalMessagesHandler } from './portal-messages.handler';
import { PortalOverviewHandler } from './portal-overview.handler';
import { PortalQuotesHandler } from './portal-quotes.handler';
import { PortalRefuseQuoteHandler } from './portal-refuse-quote.handler';
import { PortalSendMessageHandler } from './portal-send-message.handler';
import { RevokeTokenHandler } from './revoke-token.handler';
import { TrackEventHandler } from './track-event.handler';

const d = (n: string | number) => new Prisma.Decimal(n);
const FIXED = new Date('2026-10-06T00:00:00Z');
const FUTURE = new Date(Date.now() + 30 * 24 * 3600 * 1000);
const PAST = new Date(Date.now() - 24 * 3600 * 1000);
const staff = { userId: 1, tenantId: 1, roleId: 1, email: 'a@test.local' };
const portal: PortalContextData = {
  tokenId: 5,
  tenantId: 1,
  projectId: 12,
  clientId: 4,
  expiresAt: FUTURE,
  ip: '1.2.3.4',
};

const tokenRow = (over: Record<string, unknown> = {}) => ({
  id: 5,
  tenantId: 1,
  clientId: 4,
  projectId: 12,
  tokenHash: 'h',
  isActive: true,
  expiresAt: FUTURE,
  createdBy: 1,
  createdAt: FIXED,
  ...over,
});

// A quote row carrying EVERY column, including the ones a client must never see.
const quote = (over: Record<string, unknown> = {}) => ({
  id: 30,
  tenantId: 1,
  clientId: 4,
  projectId: 12,
  number: 'QUO-2026-0001',
  status: 'sent',
  issueDate: FIXED,
  validUntil: null,
  defaultVatRate: d(21),
  amountExclVat: d(1000),
  vatAmount: d(210),
  amountInclVat: d(1210),
  note: 'INTERNAL: client is difficult, add 10%',
  sentAt: FIXED,
  acceptedAt: null,
  refusedAt: null,
  createdBy: 9,
  createdAt: FIXED,
  updatedAt: FIXED,
  lines: [
    {
      id: 1,
      tenantId: 1,
      quoteId: 30,
      serviceId: 77,
      description: 'Painting',
      unit: 'm2',
      quantity: d(20),
      unitPriceExclVat: d(50),
      vatRate: d(21),
      totalExclVat: d(1000),
      position: 1,
    },
  ],
  ...over,
});

const invoice = (over: Record<string, unknown> = {}) => ({
  id: 40,
  tenantId: 1,
  clientId: 4,
  projectId: 12,
  quoteId: 30,
  number: 'INV-2026-0001',
  status: 'sent',
  issueDate: FIXED,
  dueDate: FIXED,
  defaultVatRate: d(21),
  amountExclVat: d(1000),
  vatAmount: d(210),
  amountInclVat: d(1210),
  note: 'INTERNAL note',
  sentAt: FIXED,
  reminderCount: 2,
  lastReminderAt: FIXED,
  createdBy: 9,
  createdAt: FIXED,
  updatedAt: FIXED,
  ...over,
});

describe('portal.helper', () => {
  it('a token is random, 43 URL-safe characters, and only its sha256 is the stored form', () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).not.toContain(a);
    expect(hashToken(a)).toBe(hashToken(a));
  });

  it('the URL is PORTAL_BASE_URL (already ending in /portal) + the token', () => {
    expect(buildPortalUrl('abc')).toMatch(/\/portal\/abc$/);
  });

  it('a token is usable only if active AND not expired', () => {
    expect(isTokenUsable({ isActive: true, expiresAt: FUTURE })).toBe(true);
    expect(isTokenUsable({ isActive: false, expiresAt: FUTURE })).toBe(false);
    expect(isTokenUsable({ isActive: true, expiresAt: PAST })).toBe(false);
  });

  it('expiry is a date a number of days ahead', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(expiryFromNow(90, now).toISOString()).toBe(
      '2026-04-01T00:00:00.000Z',
    );
  });
});

describe('portal-view.helper — the allow-list', () => {
  /** Every key, at any depth, of a payload. */
  const keysOf = (value: unknown, found = new Set<string>()): Set<string> => {
    if (Array.isArray(value)) value.forEach((v) => keysOf(v, found));
    else if (
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value instanceof Prisma.Decimal)
    ) {
      for (const [k, v] of Object.entries(value)) {
        found.add(k);
        keysOf(v, found);
      }
    }
    return found;
  };
  const FORBIDDEN = [
    'tenant_id',
    'created_by',
    'service_id',
    'note',
    'client_id',
    'project_id',
    'user_id',
    'sender_id',
    'margin',
    'cost',
    'supplier',
    'subcontractor',
    'hourly_rate',
    'reminder_count',
    'last_reminder_at',
    'default_vat_rate',
    'quote_id',
    'manager_id',
    'purchase_price',
    'stock',
  ];
  const assertClean = (payload: unknown) => {
    const keys = keysOf(payload);
    for (const forbidden of FORBIDDEN) expect(keys.has(forbidden)).toBe(false);
    expect(JSON.stringify(payload)).not.toContain('INTERNAL');
  };

  it('a quote shows its lines and totals, none of the internal columns', () => {
    const out = toPortalQuote(quote() as never, [{ id: 8, fileName: 'q.pdf' }]);
    assertClean(out);
    expect(out.lines[0]).toEqual({
      description: 'Painting',
      unit: 'm2',
      quantity: d(20),
      unit_price_excl_vat: d(50),
      vat_rate: d(21),
      total_excl_vat: d(1000),
    });
    expect(out.documents).toEqual([{ id: 8, file_name: 'q.pdf' }]);
  });

  it('can_respond: a sent quote that has not expired — and nothing else', () => {
    expect(toPortalQuote(quote() as never).can_respond).toBe(true);
    expect(
      toPortalQuote(quote({ status: 'accepted' }) as never).can_respond,
    ).toBe(false);
    expect(
      toPortalQuote(quote({ validUntil: PAST }) as never).can_respond,
    ).toBe(false);
  });

  it('an invoice carries its balance; a late one carries the late label', () => {
    const late = toPortalInvoice(invoice() as never, {
      amountPaid: d(200),
      balanceDue: d(1010),
      isLate: true,
    });
    assertClean(late);
    expect(late).toMatchObject({
      is_late: true,
      label: 'late',
      balance_due: d(1010),
    });
    const onTime = toPortalInvoice(invoice() as never, {
      amountPaid: d(0),
      balanceDue: d(1210),
      isLate: false,
    });
    expect(onTime.label).toBeNull();
  });

  it('a message shows "company" or "you" — never an employee id or name', () => {
    const fromStaff = toPortalMessage({
      id: 1,
      senderType: 'employee',
      content: 'On our way',
      createdAt: FIXED,
      attachments: [],
    });
    expect(fromStaff.from).toBe('company');
    expect(
      toPortalMessage({
        id: 2,
        senderType: 'admin',
        content: 'x',
        createdAt: FIXED,
        attachments: [],
      }).from,
    ).toBe('company');
    expect(
      toPortalMessage({
        id: 3,
        senderType: 'client',
        content: 'x',
        createdAt: FIXED,
        attachments: [],
      }).from,
    ).toBe('you');
    assertClean(fromStaff);
  });

  it('the overview is built field by field', () => {
    const out = toPortalOverview({
      companyName: 'Dupont',
      project: {
        name: 'Bathroom',
        status: 'in_progress',
        city: 'Brussels',
        startDate: null,
        endDate: null,
      },
      progress: { progressPct: 40, reportDate: FIXED },
      photos: [{ id: 1, fileName: 'a.jpg', fileUrl: 'u', createdAt: FIXED }],
      quotes: { total: 2, open: 1 },
      invoices: { total: 1, late: 0 },
      linkExpiresAt: FUTURE,
    });
    assertClean(out);
    // the project block is exactly these fields: its internal `description` and `manager_id` are not in it
    expect(Object.keys(out.project).sort()).toEqual(
      ['city', 'end_date', 'name', 'start_date', 'status'].sort(),
    );
    expect(Object.keys(out).sort()).toEqual(
      [
        'company_name',
        'invoices',
        'link_expires_at',
        'photos',
        'progress',
        'project',
        'quotes',
      ].sort(),
    );
  });
});

describe('PortalTokenGuard — the three checks, then the tenant into CLS', () => {
  const tokens = { findByHash: jest.fn() };
  const tenantContext = { setTenantId: jest.fn() };
  let guard: PortalTokenGuard;

  const ctx = (token: unknown, ip = '9.9.9.9') => {
    const req: Record<string, unknown> = { params: { token }, ip };
    return {
      req,
      context: {
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext,
    };
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PortalTokenGuard,
        { provide: PortalTokenRepository, useValue: tokens },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    }).compile();
    guard = module.get(PortalTokenGuard);
  });

  it('a valid token: looked up by HASH, the TENANT goes into CLS, the context is set', async () => {
    tokens.findByHash.mockResolvedValue(tokenRow({ tenantId: 7 }));
    const { context, req } = ctx('raw-token');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(tokens.findByHash).toHaveBeenCalledWith(hashToken('raw-token'));
    expect(tenantContext.setTenantId).toHaveBeenCalledWith(7);
    expect(req.portal).toMatchObject({
      tenantId: 7,
      projectId: 12,
      clientId: 4,
      tokenId: 5,
      ip: '9.9.9.9',
    });
  });

  it('the raw token itself is never used as a lookup key', async () => {
    tokens.findByHash.mockResolvedValue(tokenRow());
    await guard.canActivate(ctx('raw-token').context);
    expect(tokens.findByHash).not.toHaveBeenCalledWith('raw-token');
  });

  it.each([
    ['an unknown token', null],
    ['a revoked (inactive) token', tokenRow({ isActive: false })],
    ['an expired token', tokenRow({ expiresAt: PAST })],
  ])(
    '%s -> the SAME 403 and the SAME message, and no tenant is set',
    async (_name, row) => {
      tokens.findByHash.mockResolvedValue(row);
      const error = await guard
        .canActivate(ctx('x').context)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toBe(
        PORTAL_EXPIRED_MESSAGE,
      );
      expect(tenantContext.setTenantId).not.toHaveBeenCalled();
    },
  );

  it('an empty or missing token gets the same answer, without touching the database', async () => {
    for (const bad of [undefined, '', 42]) {
      await expect(guard.canActivate(ctx(bad).context)).rejects.toThrow(
        PORTAL_EXPIRED_MESSAGE,
      );
    }
    expect(tokens.findByHash).not.toHaveBeenCalled();
  });
});

describe('Portal handlers', () => {
  const tokens = {
    create: jest.fn(),
    findLatestByProject: jest.fn(),
    deactivateByProject: jest.fn(),
    deactivateExpired: jest.fn(),
  };
  const tracking = {
    create: jest.fn(),
    countByType: jest.fn(),
    findRecentByProject: jest.fn(),
  };
  const tx = { marker: 'tx' };
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const projects = { findOne: jest.fn() };
  const chat = {
    ensureProjectConversation: jest.fn(),
    listClientMessages: jest.fn(),
    sendClientMessage: jest.fn(),
  };
  const quotes = {
    findByProjectAndStatuses: jest.fn(),
    findByIdRaw: jest.fn(),
    accept: jest.fn(),
    refuse: jest.fn(),
  };
  const invoices = {
    findByProjectWithBalance: jest.fn(),
    findByIdRaw: jest.fn(),
  };
  const reports = { progress: jest.fn(), photos: jest.fn() };
  const tenants = { findOne: jest.fn() };
  const media = { findByEntityIds: jest.fn(), findOne: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let generate: GenerateTokenHandler;
  let revoke: RevokeTokenHandler;
  let link: FindPortalLinkHandler;
  let findTracking: FindTrackingHandler;
  let overview: PortalOverviewHandler;
  let listQuotes: PortalQuotesHandler;
  let listInvoices: PortalInvoicesHandler;
  let accept: PortalAcceptQuoteHandler;
  let refuse: PortalRefuseQuoteHandler;
  let messages: PortalMessagesHandler;
  let send: PortalSendMessageHandler;
  let document: PortalDocumentHandler;
  let track: TrackEventHandler;
  let expire: ExpireTokensHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    media.findByEntityIds.mockResolvedValue(new Map());
    const handlers = [
      GenerateTokenHandler,
      RevokeTokenHandler,
      FindPortalLinkHandler,
      FindTrackingHandler,
      PortalOverviewHandler,
      PortalQuotesHandler,
      PortalInvoicesHandler,
      PortalAcceptQuoteHandler,
      PortalRefuseQuoteHandler,
      PortalMessagesHandler,
      PortalSendMessageHandler,
      PortalDocumentHandler,
      TrackEventHandler,
      ExpireTokensHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: PortalTokenRepository, useValue: tokens },
        { provide: PortalTrackingRepository, useValue: tracking },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: ProjectsService, useValue: projects },
        { provide: ChatService, useValue: chat },
        { provide: QuotesService, useValue: quotes },
        { provide: InvoicesService, useValue: invoices },
        { provide: ReportsService, useValue: reports },
        { provide: TenantsService, useValue: tenants },
        { provide: MediaService, useValue: media },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    generate = module.get(GenerateTokenHandler);
    revoke = module.get(RevokeTokenHandler);
    link = module.get(FindPortalLinkHandler);
    findTracking = module.get(FindTrackingHandler);
    overview = module.get(PortalOverviewHandler);
    listQuotes = module.get(PortalQuotesHandler);
    listInvoices = module.get(PortalInvoicesHandler);
    accept = module.get(PortalAcceptQuoteHandler);
    refuse = module.get(PortalRefuseQuoteHandler);
    messages = module.get(PortalMessagesHandler);
    send = module.get(PortalSendMessageHandler);
    document = module.get(PortalDocumentHandler);
    track = module.get(TrackEventHandler);
    expire = module.get(ExpireTokensHandler);

    projects.findOne.mockResolvedValue({
      id: 12,
      clientId: 4,
      name: 'Bathroom',
      status: 'prospect',
      city: null,
      startDate: null,
      endDate: null,
    });
  });

  describe('GenerateTokenHandler', () => {
    it('stores ONLY the hash, returns the raw token once, replaces the old link in the same tx, opens the thread', async () => {
      tokens.deactivateByProject.mockResolvedValue(1);
      tokens.create.mockImplementation((data: { expiresAt: Date }) =>
        Promise.resolve(tokenRow({ id: 9, expiresAt: data.expiresAt })),
      );

      const result = await generate.execute(12, {}, staff);

      const [data, usedTx] = tokens.create.mock.calls[0] as [
        Record<string, unknown>,
        unknown,
      ];
      expect(usedTx).toBe(tx);
      expect(data.tokenHash).toBe(hashToken(result.token));
      expect(Object.values(data)).not.toContain(result.token); // the raw token is stored nowhere
      expect(data).toMatchObject({
        tenantId: 1,
        clientId: 4,
        projectId: 12,
        createdBy: 1,
      });
      expect(tokens.deactivateByProject).toHaveBeenCalledWith(12, tx);
      expect(chat.ensureProjectConversation).toHaveBeenCalledWith(12, staff);
      expect(result.url).toMatch(new RegExp(`/portal/${result.token}$`));
      expect(result.replacedPreviousLink).toBe(true);
    });

    it('expires in 90 days by default, or in expires_in_days', async () => {
      tokens.deactivateByProject.mockResolvedValue(0);
      tokens.create.mockImplementation((data: { expiresAt: Date }) =>
        Promise.resolve(tokenRow({ expiresAt: data.expiresAt })),
      );
      const days = (r: { expiresAt: Date }) =>
        Math.round((r.expiresAt.getTime() - Date.now()) / 86400000);
      expect(days(await generate.execute(12, {}, staff))).toBe(90);
      expect(
        days(await generate.execute(12, { expires_in_days: 7 }, staff)),
      ).toBe(7);
    });

    it('the audit row never contains the token or its hash', async () => {
      tokens.deactivateByProject.mockResolvedValue(0);
      tokens.create.mockImplementation((data: { expiresAt: Date }) =>
        Promise.resolve(tokenRow({ expiresAt: data.expiresAt })),
      );
      const result = await generate.execute(12, {}, staff);
      const logged = JSON.stringify(audit.write.mock.calls);
      expect(logged).not.toContain(result.token);
      expect(logged).not.toContain(hashToken(result.token));
    });

    it("another tenant's project is a 404, nothing created", async () => {
      projects.findOne.mockRejectedValue(new NotFoundException());
      await expect(generate.execute(99, {}, staff)).rejects.toThrow(
        NotFoundException,
      );
      expect(tokens.create).not.toHaveBeenCalled();
      expect(chat.ensureProjectConversation).not.toHaveBeenCalled();
    });
  });

  describe('RevokeTokenHandler / FindPortalLinkHandler', () => {
    it('revoke deactivates the project link at once', async () => {
      tokens.deactivateByProject.mockResolvedValue(1);
      await expect(revoke.execute(12, staff)).resolves.toEqual({
        revoked: true,
      });
    });

    it('revoke with no active link -> 404', async () => {
      tokens.deactivateByProject.mockResolvedValue(0);
      await expect(revoke.execute(12, staff)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('the status never contains the token', async () => {
      tokens.findLatestByProject.mockResolvedValue(tokenRow());
      const result = await link.execute(12);
      expect(result).toEqual({
        active: true,
        expiresAt: FUTURE,
        createdAt: FIXED,
      });
      expect(Object.keys(result)).not.toContain('token');
      expect(JSON.stringify(result)).not.toContain('tokenHash');
    });

    it('an expired or revoked link reads as not active; no link at all too', async () => {
      tokens.findLatestByProject.mockResolvedValue(
        tokenRow({ expiresAt: PAST }),
      );
      expect((await link.execute(12)).active).toBe(false);
      tokens.findLatestByProject.mockResolvedValue(null);
      expect(await link.execute(12)).toEqual({
        active: false,
        expiresAt: null,
        createdAt: null,
      });
    });
  });

  describe('PortalOverviewHandler / TrackEventHandler', () => {
    beforeEach(() => {
      tenants.findOne.mockResolvedValue({ name: 'Dupont' });
      reports.progress.mockResolvedValue({
        progressPct: 40,
        reportDate: FIXED,
      });
      reports.photos.mockResolvedValue([]);
      quotes.findByProjectAndStatuses.mockResolvedValue([
        quote(),
        quote({ id: 31, status: 'accepted' }),
      ]);
      invoices.findByProjectWithBalance.mockResolvedValue([
        {
          invoice: invoice(),
          balance: { amountPaid: d(0), balanceDue: d(1210), isLate: true },
        },
      ]);
    });

    it('opening it writes a view event and returns the allow-listed overview', async () => {
      tracking.create.mockResolvedValue({});
      const out = await overview.execute(portal);
      expect(tracking.create).toHaveBeenCalledWith({
        tenantId: 1,
        portalTokenId: 5,
        eventType: 'view',
        ipAddress: '1.2.3.4',
      });
      expect(out.company_name).toBe('Dupont');
      expect(out.progress.progress_pct).toBe(40);
      expect(out.quotes).toEqual({ total: 2, open: 1 });
      expect(out.invoices).toEqual({ total: 1, late: 1 });
    });

    it('two opens = two view rows', async () => {
      tracking.create.mockResolvedValue({});
      await overview.execute(portal);
      await overview.execute(portal);
      expect(tracking.create).toHaveBeenCalledTimes(2);
    });

    it('a tracking failure never breaks the client request', async () => {
      tracking.create.mockRejectedValue(new Error('db'));
      await expect(track.execute(portal, 'view')).resolves.toBeUndefined();
      await expect(overview.execute(portal)).resolves.toBeDefined();
    });
  });

  describe('lists: only what the client may see', () => {
    it('quotes are asked for sent + accepted ONLY, for this project', async () => {
      quotes.findByProjectAndStatuses.mockResolvedValue([quote()]);
      const out = await listQuotes.execute(portal);
      expect(quotes.findByProjectAndStatuses).toHaveBeenCalledWith(12, [
        'sent',
        'accepted',
      ]);
      expect(out.data).toHaveLength(1);
    });

    it('invoices are asked for sent + partially_paid + paid ONLY (never draft, never cancelled)', async () => {
      invoices.findByProjectWithBalance.mockResolvedValue([]);
      await listInvoices.execute(portal);
      expect(invoices.findByProjectWithBalance).toHaveBeenCalledWith(12, [
        'sent',
        'partially_paid',
        'paid',
      ]);
    });
  });

  describe('PortalAcceptQuoteHandler / PortalRefuseQuoteHandler — the SAME handlers staff use', () => {
    it('accept calls QuotesService.accept as { userId: null, tenantId } — no second implementation', async () => {
      quotes.findByIdRaw.mockResolvedValue(quote());
      quotes.accept.mockResolvedValue({});
      quotes.findByProjectAndStatuses.mockResolvedValue([
        quote({ status: 'accepted' }),
      ]);
      const out = await accept.execute(portal, 30);
      expect(quotes.accept).toHaveBeenCalledWith(30, {
        userId: null,
        tenantId: 1,
      });
      expect(out.status).toBe('accepted');
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'portal_accept',
          entityId: 30,
          newValue: { clientId: 4, portalTokenId: 5 },
        }),
      );
    });

    it('a quote of ANOTHER project is a 404 and accept is never called', async () => {
      quotes.findByIdRaw.mockResolvedValue(quote({ projectId: 99 }));
      await expect(accept.execute(portal, 30)).rejects.toThrow(
        NotFoundException,
      );
      expect(quotes.accept).not.toHaveBeenCalled();
    });

    it('an unknown quote, a draft and a refused one are all a plain 404', async () => {
      quotes.findByIdRaw.mockResolvedValueOnce(null);
      await expect(accept.execute(portal, 1)).rejects.toThrow(
        NotFoundException,
      );
      quotes.findByIdRaw.mockResolvedValueOnce(quote({ status: 'draft' }));
      await expect(accept.execute(portal, 30)).rejects.toThrow(
        NotFoundException,
      );
      quotes.findByIdRaw.mockResolvedValueOnce(quote({ status: 'refused' }));
      await expect(accept.execute(portal, 30)).rejects.toThrow(
        NotFoundException,
      );
      expect(quotes.accept).not.toHaveBeenCalled();
    });

    it("the staff handler's own refusals (expired, wrong status) reach the client untouched", async () => {
      quotes.findByIdRaw.mockResolvedValue(quote({ status: 'accepted' }));
      quotes.accept.mockRejectedValue(
        new BadRequestException('Cannot accept a quote from status accepted'),
      );
      await expect(accept.execute(portal, 30)).rejects.toThrow(/Cannot accept/);
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('refuse calls QuotesService.refuse; another project is a 404', async () => {
      quotes.findByIdRaw.mockResolvedValueOnce(quote());
      quotes.refuse.mockResolvedValue({});
      await expect(refuse.execute(portal, 30)).resolves.toEqual({
        id: 30,
        status: 'refused',
      });
      expect(quotes.refuse).toHaveBeenCalledWith(30, {
        userId: null,
        tenantId: 1,
      });

      quotes.findByIdRaw.mockResolvedValueOnce(quote({ projectId: 99 }));
      await expect(refuse.execute(portal, 30)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PortalDocumentHandler', () => {
    const file = (over: Record<string, unknown> = {}) => ({
      id: 8,
      entityType: 'quote',
      entityId: 30,
      fileUrl: 'https://cdn/x.pdf',
      ...over,
    });

    it('serves the PDF of a visible quote of THIS project, and writes a download event', async () => {
      media.findOne.mockResolvedValue(file());
      quotes.findByIdRaw.mockResolvedValue(quote());
      tracking.create.mockResolvedValue({});
      await expect(document.execute(portal, 8)).resolves.toBe(
        'https://cdn/x.pdf',
      );
      expect(tracking.create).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'download' }),
      );
    });

    it('serves the PDF of a visible invoice of this project', async () => {
      media.findOne.mockResolvedValue(
        file({ entityType: 'invoice', entityId: 40 }),
      );
      invoices.findByIdRaw.mockResolvedValue(invoice());
      tracking.create.mockResolvedValue({});
      await expect(document.execute(portal, 8)).resolves.toBe(
        'https://cdn/x.pdf',
      );
    });

    it.each([
      [
        'a quote of another project',
        file(),
        () => quotes.findByIdRaw.mockResolvedValue(quote({ projectId: 99 })),
      ],
      [
        'the PDF of a draft quote',
        file(),
        () => quotes.findByIdRaw.mockResolvedValue(quote({ status: 'draft' })),
      ],
      [
        'the PDF of a cancelled invoice',
        file({ entityType: 'invoice', entityId: 40 }),
        () =>
          invoices.findByIdRaw.mockResolvedValue(
            invoice({ status: 'cancelled' }),
          ),
      ],
      [
        'an invoice of another project',
        file({ entityType: 'invoice', entityId: 40 }),
        () =>
          invoices.findByIdRaw.mockResolvedValue(invoice({ projectId: 99 })),
      ],
      [
        'a purchase-invoice document',
        file({ entityType: 'purchase_invoice', entityId: 3 }),
        () => undefined,
      ],
      [
        'a chat attachment',
        file({ entityType: 'message', entityId: 3 }),
        () => undefined,
      ],
    ])('%s -> 404, no download event', async (_name, row, arrange) => {
      media.findOne.mockResolvedValue(row);
      arrange();
      await expect(document.execute(portal, 8)).rejects.toThrow(
        NotFoundException,
      );
      expect(tracking.create).not.toHaveBeenCalled();
    });

    it('an unknown or foreign media id is a 404', async () => {
      media.findOne.mockRejectedValue(new NotFoundException());
      await expect(document.execute(portal, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('messages', () => {
    it('the client reads the thread: the token client, the allow-list, no employee id', async () => {
      chat.listClientMessages.mockResolvedValue({
        data: [
          {
            id: 1,
            senderType: 'employee',
            senderId: 42,
            content: 'Hello',
            createdAt: FIXED,
            attachments: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      const out = await messages.execute(portal, { page: 1, limit: 20 });
      expect(chat.listClientMessages).toHaveBeenCalledWith(12, 4, 1, {
        page: 1,
        limit: 20,
      });
      expect(out.data[0]).toMatchObject({ from: 'company', content: 'Hello' });
      expect(JSON.stringify(out)).not.toContain('42');
    });

    it('the client writes: the sender is the TOKEN client (never the body)', async () => {
      chat.sendClientMessage.mockResolvedValue({
        id: 2,
        senderType: 'client',
        senderId: 4,
        content: 'Hi',
        createdAt: FIXED,
        attachments: [],
      });
      const out = await send.execute(portal, { content: 'Hi' });
      expect(chat.sendClientMessage).toHaveBeenCalledWith(12, 4, 'Hi');
      expect(out.from).toBe('you');
    });
  });

  describe('FindTrackingHandler / ExpireTokensHandler', () => {
    it('"opened 3 times, downloaded once"', async () => {
      tracking.countByType.mockImplementation((_p: number, type: string) =>
        Promise.resolve(type === 'view' ? 3 : 1),
      );
      tracking.findRecentByProject.mockResolvedValue([
        { eventType: 'download', createdAt: new Date('2026-10-06T10:00:00Z') },
        { eventType: 'view', createdAt: new Date('2026-10-06T09:00:00Z') },
      ]);
      const out = await findTracking.execute(12);
      expect(out).toMatchObject({
        views: 3,
        downloads: 1,
        lastOpenedAt: new Date('2026-10-06T09:00:00Z'),
      });
      expect(JSON.stringify(out)).not.toContain('ip');
    });

    it('the daily expiry marks past-date links inactive and reports how many', async () => {
      tokens.deactivateExpired.mockResolvedValue(3);
      await expect(expire.execute()).resolves.toEqual({ expired: 3 });
    });
  });
});
