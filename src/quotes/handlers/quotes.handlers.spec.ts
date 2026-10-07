import { NotificationsService } from '../../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MarginsService } from '../../margins/margins.service';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { StockService } from '../../stock/stock.service';
import { TenantsService } from '../../tenants/tenants.service';
import { QuoteRepository } from '../repositories/quote.repository';
import { AcceptQuoteHandler } from './accept-quote.handler';
import { CreateQuoteHandler } from './create-quote.handler';
import { FindQuoteHandler } from './find-quote.handler';
import { FindQuotesHandler } from './find-quotes.handler';
import { FreezeQuotePdfHandler } from './freeze-quote-pdf.handler';
import { RefuseQuoteHandler } from './refuse-quote.handler';
import { SendQuoteHandler } from './send-quote.handler';
import { SetQuoteLinesHandler } from './set-quote-lines.handler';
import { UpdateQuoteHandler } from './update-quote.handler';

const FIXED_DATE = new Date('2026-10-06T10:00:00.000Z');
const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const client = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 1,
  isActive: true,
  email: 'client@test.local',
  ...over,
});

const tenant = (over: Record<string, unknown> = {}) => ({
  id: 1,
  defaultVatRate: new Prisma.Decimal('21.00'),
  defaultPaymentDays: 30,
  ...over,
});

const quote = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  clientId: 1,
  projectId: 20,
  number: 'QUO-2026-0001',
  status: 'draft',
  issueDate: FIXED_DATE,
  validUntil: null as Date | null,
  defaultVatRate: new Prisma.Decimal('21.00'),
  amountExclVat: new Prisma.Decimal('0'),
  vatAmount: new Prisma.Decimal('0'),
  amountInclVat: new Prisma.Decimal('0'),
  note: null,
  sentAt: null,
  acceptedAt: null,
  refusedAt: null,
  createdBy: 1,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  ...over,
});

const quoteLine = (over: Record<string, unknown> = {}) => ({
  id: 100,
  tenantId: 1,
  quoteId: 10,
  serviceId: 5,
  description: 'Painting',
  unit: 'm2',
  quantity: new Prisma.Decimal('10'),
  unitPriceExclVat: new Prisma.Decimal('12.00'),
  vatRate: new Prisma.Decimal('21.00'),
  totalExclVat: new Prisma.Decimal('120.00'),
  position: 0,
  ...over,
});

const notifications = { dispatch: jest.fn() };

describe('Quotes handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    replaceLines: jest.fn(),
    findLines: jest.fn(),
    setTotals: jest.fn(),
    setStatus: jest.fn(),
    sumAcceptedByProject: jest.fn(),
  };
  const clients = { findByIdRaw: jest.fn() };
  const projectsService = {
    findOne: jest.fn(),
    beginFromQuoteAcceptance: jest.fn(),
  };
  const tenantsService = { findOne: jest.fn() };
  const documentsService = { allocateNumber: jest.fn() };
  const stockService = { reserveForProject: jest.fn() };
  const margins = { checkProjectThresholds: jest.fn() };
  const audit = { write: jest.fn() };
  const freezeQuotePdf = {
    execute: jest.fn().mockResolvedValue({
      media: { id: 999, fileUrl: 'https://cdn.test/quote.pdf' },
      buffer: Buffer.from('pdf'),
    }),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  const txMock = {};
  const tenantPrisma = {
    db: { $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(txMock)) },
  };

  let createQuote: CreateQuoteHandler;
  let findQuotes: FindQuotesHandler;
  let findQuote: FindQuoteHandler;
  let updateQuote: UpdateQuoteHandler;
  let setLines: SetQuoteLinesHandler;
  let sendQuote: SendQuoteHandler;
  let acceptQuote: AcceptQuoteHandler;
  let refuseQuote: RefuseQuoteHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation(
      (cb: (tx: unknown) => unknown) => cb(txMock),
    );
    freezeQuotePdf.execute.mockResolvedValue({
      media: { id: 999, fileUrl: 'https://cdn.test/quote.pdf' },
      buffer: Buffer.from('pdf'),
    });
    const handlers = [
      CreateQuoteHandler,
      FindQuotesHandler,
      FindQuoteHandler,
      UpdateQuoteHandler,
      SetQuoteLinesHandler,
      SendQuoteHandler,
      AcceptQuoteHandler,
      RefuseQuoteHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        ...handlers,
        { provide: QuoteRepository, useValue: repo },
        { provide: ClientsService, useValue: clients },
        { provide: ProjectsService, useValue: projectsService },
        { provide: TenantsService, useValue: tenantsService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: StockService, useValue: stockService },
        { provide: AuditService, useValue: audit },
        { provide: MarginsService, useValue: margins },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: FreezeQuotePdfHandler, useValue: freezeQuotePdf },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createQuote = module.get(CreateQuoteHandler);
    findQuotes = module.get(FindQuotesHandler);
    findQuote = module.get(FindQuoteHandler);
    updateQuote = module.get(UpdateQuoteHandler);
    setLines = module.get(SetQuoteLinesHandler);
    sendQuote = module.get(SendQuoteHandler);
    acceptQuote = module.get(AcceptQuoteHandler);
    refuseQuote = module.get(RefuseQuoteHandler);
  });

  describe('CreateQuoteHandler', () => {
    const dto = {
      client_id: 1,
      project_id: 20,
      lines: [
        {
          service_id: 5,
          description: 'Labour',
          quantity: '10',
          unit_price_excl_vat: '100.00',
          vat_rate: '6.00',
          position: 0,
        },
        {
          service_id: 6,
          description: 'Supplies',
          quantity: '5',
          unit_price_excl_vat: '20.00',
          vat_rate: '21.00',
          position: 1,
        },
      ],
    };

    it('rejects an unknown/archived client', async () => {
      clients.findByIdRaw.mockResolvedValue(null);
      await expect(createQuote.execute(dto, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a zero quantity line', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      projectsService.findOne.mockResolvedValue({ id: 20 });
      await expect(
        createQuote.execute(
          { ...dto, lines: [{ ...dto.lines[0], quantity: '0' }] },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a quote and groups VAT per rate (6% and 21% rounded separately)', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      projectsService.findOne.mockResolvedValue({ id: 20 });
      tenantsService.findOne.mockResolvedValue(tenant());
      documentsService.allocateNumber.mockResolvedValue('QUO-2026-0001');
      repo.create.mockResolvedValue(quote());
      repo.findLines.mockResolvedValue([
        quoteLine({
          id: 1,
          vatRate: new Prisma.Decimal('6.00'),
          totalExclVat: new Prisma.Decimal('1000.00'),
        }),
        quoteLine({
          id: 2,
          vatRate: new Prisma.Decimal('21.00'),
          totalExclVat: new Prisma.Decimal('100.00'),
        }),
      ]);
      repo.setTotals.mockResolvedValue(
        quote({
          amountExclVat: new Prisma.Decimal('1100.00'),
          vatAmount: new Prisma.Decimal('81.00'),
          amountInclVat: new Prisma.Decimal('1181.00'),
        }),
      );

      const result = await createQuote.execute(dto, actor);

      expect(repo.setTotals).toHaveBeenCalledWith(
        10,
        {
          amountExclVat: '1100.00',
          vatAmount: '81.00',
          amountInclVat: '1181.00',
        },
        txMock,
      );
      expect(result.amountExclVat.toString()).toBe('1100');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('FindQuotesHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[quote()], 1]);
      const result = await findQuotes.execute({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
    });
  });

  describe('FindQuoteHandler', () => {
    it('rejects an unknown quote', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findQuote.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the quote with its lines', async () => {
      repo.findById.mockResolvedValue(quote());
      repo.findLines.mockResolvedValue([quoteLine()]);
      const result = await findQuote.execute(10);
      expect(result.lines).toHaveLength(1);
    });
  });

  describe('UpdateQuoteHandler', () => {
    it('rejects a non-draft quote', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      await expect(
        updateQuote.execute(10, { note: 'x' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates a draft quote', async () => {
      repo.findById.mockResolvedValue(quote());
      repo.update.mockResolvedValue(quote({ note: 'Updated' }));
      const result = await updateQuote.execute(10, { note: 'Updated' }, actor);
      expect(result.note).toBe('Updated');
    });
  });

  describe('SetQuoteLinesHandler', () => {
    const dto = {
      lines: [
        {
          service_id: 5,
          description: 'Painting',
          quantity: '10',
          unit_price_excl_vat: '12.00',
          vat_rate: '21.00',
          position: 0,
        },
      ],
    };

    it('rejects a non-draft quote', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      await expect(setLines.execute(10, dto, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.replaceLines).not.toHaveBeenCalled();
    });

    it('replaces lines and recomputes totals', async () => {
      repo.findById.mockResolvedValue(quote());
      repo.findLines.mockResolvedValue([
        quoteLine({ totalExclVat: new Prisma.Decimal('120.00') }),
      ]);
      repo.setTotals.mockResolvedValue(
        quote({
          amountExclVat: new Prisma.Decimal('120.00'),
          vatAmount: new Prisma.Decimal('25.20'),
          amountInclVat: new Prisma.Decimal('145.20'),
        }),
      );
      const result = await setLines.execute(10, dto, actor);
      expect(repo.replaceLines).toHaveBeenCalled();
      expect(result.amountInclVat.toString()).toBe('145.2');
    });
  });

  describe('SendQuoteHandler', () => {
    it('rejects a non-draft quote', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      await expect(sendQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a quote with zero lines', async () => {
      repo.findById.mockResolvedValue(quote());
      repo.findLines.mockResolvedValue([]);
      await expect(sendQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('sends a draft quote with lines', async () => {
      repo.findById.mockResolvedValue(quote());
      repo.findLines.mockResolvedValue([quoteLine()]);
      repo.setStatus.mockResolvedValue(
        quote({ status: 'sent', sentAt: FIXED_DATE }),
      );
      clients.findByIdRaw.mockResolvedValue({
        id: 1,
        email: 'client@test.local',
      });
      const result = await sendQuote.execute(10, actor);
      expect(result.status).toBe('sent');
      // the "please review" email goes to the client
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'client_quote_sent',
        expect.objectContaining({
          tenantId: 1,
          clientEmail: 'client@test.local',
        }),
      );
    });
  });

  describe('RefuseQuoteHandler', () => {
    it('rejects a quote that is not sent', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'draft' }));
      await expect(refuseQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses a sent quote', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      repo.setStatus.mockResolvedValue(
        quote({ status: 'refused', refusedAt: FIXED_DATE }),
      );
      const result = await refuseQuote.execute(10, actor);
      expect(result.status).toBe('refused');
      expect(repo.setStatus).toHaveBeenCalledWith(10, 'refused', {
        refusedAt: expect.any(Date) as Date,
      });
    });
  });

  describe('AcceptQuoteHandler', () => {
    it('rejects a quote that is not sent', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'draft' }));
      await expect(acceptQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired quote (valid_until passed)', async () => {
      repo.findById.mockResolvedValue(
        quote({ status: 'sent', validUntil: new Date('2020-01-01') }),
      );
      await expect(acceptQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(tenantPrisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a quote with zero lines', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      repo.findLines.mockResolvedValue([]);
      await expect(acceptQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(tenantPrisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('runs the chain in one transaction: quote, project, stock', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      repo.findLines.mockResolvedValue([quoteLine()]);
      repo.setStatus.mockResolvedValue(
        quote({ status: 'accepted', acceptedAt: FIXED_DATE }),
      );
      projectsService.beginFromQuoteAcceptance.mockResolvedValue({
        id: 20,
        status: 'in_progress',
      });
      stockService.reserveForProject.mockResolvedValue([]);

      const result = await acceptQuote.execute(10, actor);

      expect(repo.setStatus).toHaveBeenCalledWith(
        10,
        'accepted',
        { acceptedAt: expect.any(Date) as Date },
        txMock,
      );
      expect(projectsService.beginFromQuoteAcceptance).toHaveBeenCalledWith(
        20,
        actor,
        txMock,
      );
      expect(stockService.reserveForProject).toHaveBeenCalledWith(
        20,
        [{ serviceId: 5, quantity: expect.anything() as unknown }],
        actor,
        txMock,
      );
      expect(result.status).toBe('accepted');
      expect(audit.write).toHaveBeenCalledTimes(1);
      // the budget just grew: the 80 % / 95 % levels are re-checked (and may reset)
      expect(margins.checkProjectThresholds).toHaveBeenCalledWith(20, actor);
    });

    it('rolls back (nothing written) when the project step fails', async () => {
      repo.findById.mockResolvedValue(quote({ status: 'sent' }));
      repo.findLines.mockResolvedValue([quoteLine()]);
      repo.setStatus.mockResolvedValue(quote({ status: 'accepted' }));
      projectsService.beginFromQuoteAcceptance.mockRejectedValue(
        new BadRequestException('project not prospect/in_progress'),
      );

      await expect(acceptQuote.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
      // The real transaction client rolls back the DB writes performed
      // through `tx` once the callback throws — this only verifies the
      // chain never reaches the stock step after the project step fails,
      // and that the handler itself writes no audit log for a failed chain.
      expect(stockService.reserveForProject).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
      expect(margins.checkProjectThresholds).not.toHaveBeenCalled();
    });
  });
});
