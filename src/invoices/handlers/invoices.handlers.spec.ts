import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { QuotesService } from '../../quotes/quotes.service';
import { TenantsService } from '../../tenants/tenants.service';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { CancelInvoiceHandler } from './cancel-invoice.handler';
import { CreateInvoiceHandler } from './create-invoice.handler';
import { FindInvoiceHandler } from './find-invoice.handler';
import { FindInvoicesHandler } from './find-invoices.handler';
import { FindPaymentsHandler } from './find-payments.handler';
import { InvoiceCoverageHandler } from './invoice-coverage.handler';
import { LateInvoicesHandler } from './late-invoices.handler';
import { RecordPaymentHandler } from './record-payment.handler';
import { SendInvoiceHandler } from './send-invoice.handler';
import { SendReminderHandler } from './send-reminder.handler';
import { SetInvoiceLinesHandler } from './set-invoice-lines.handler';
import { UpdateInvoiceHandler } from './update-invoice.handler';

const FIXED_DATE = new Date('2026-10-06T10:00:00.000Z');
const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const client = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 1,
  isActive: true,
  ...over,
});

const tenant = (over: Record<string, unknown> = {}) => ({
  id: 1,
  defaultVatRate: new Prisma.Decimal('21.00'),
  defaultPaymentDays: 30,
  ...over,
});

const invoice = (over: Record<string, unknown> = {}) => ({
  id: 50,
  tenantId: 1,
  clientId: 1,
  projectId: 20,
  quoteId: null,
  number: 'INV-2026-0001',
  status: 'draft',
  issueDate: FIXED_DATE,
  dueDate: new Date('2026-11-05T00:00:00.000Z'),
  defaultVatRate: new Prisma.Decimal('21.00'),
  amountExclVat: new Prisma.Decimal('1000.00'),
  vatAmount: new Prisma.Decimal('210.00'),
  amountInclVat: new Prisma.Decimal('1210.00'),
  note: null,
  sentAt: null,
  reminderCount: 0,
  lastReminderAt: null,
  createdBy: 1,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  ...over,
});

const invoiceLine = (over: Record<string, unknown> = {}) => ({
  id: 500,
  tenantId: 1,
  invoiceId: 50,
  serviceId: 5,
  description: 'Deposit',
  unit: null,
  quantity: new Prisma.Decimal('1'),
  unitPriceExclVat: new Prisma.Decimal('1000.00'),
  vatRate: new Prisma.Decimal('21.00'),
  totalExclVat: new Prisma.Decimal('1000.00'),
  position: 0,
  ...over,
});

const payment = (over: Record<string, unknown> = {}) => ({
  id: 900,
  tenantId: 1,
  invoiceId: 50,
  amount: new Prisma.Decimal('1210.00'),
  method: 'transfer',
  reference: null,
  paymentDate: FIXED_DATE,
  createdBy: 1,
  createdAt: FIXED_DATE,
  ...over,
});

describe('Invoices handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findManyLate: jest.fn(),
    update: jest.fn(),
    replaceLines: jest.fn(),
    findLines: jest.fn(),
    setTotals: jest.fn(),
    setStatus: jest.fn(),
    bumpReminder: jest.fn(),
    findWithBalance: jest.fn(),
    findLate: jest.fn(),
    sumByProject: jest.fn(),
  };
  const paymentsRepo = {
    create: jest.fn(),
    findByInvoice: jest.fn(),
    sumByInvoice: jest.fn(),
  };
  const clients = { findByIdRaw: jest.fn() };
  const projectsService = { findOne: jest.fn() };
  const quotesService = { findOne: jest.fn(), sumAcceptedByProject: jest.fn() };
  const tenantsService = { findOne: jest.fn() };
  const documentsService = { allocateNumber: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  const txMock = {};
  const tenantPrisma = {
    db: { $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(txMock)) },
  };

  let createInvoice: CreateInvoiceHandler;
  let findInvoices: FindInvoicesHandler;
  let findInvoice: FindInvoiceHandler;
  let updateInvoice: UpdateInvoiceHandler;
  let setLines: SetInvoiceLinesHandler;
  let sendInvoice: SendInvoiceHandler;
  let cancelInvoice: CancelInvoiceHandler;
  let recordPayment: RecordPaymentHandler;
  let findPayments: FindPaymentsHandler;
  let sendReminder: SendReminderHandler;
  let lateInvoices: LateInvoicesHandler;
  let invoiceCoverage: InvoiceCoverageHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation(
      (cb: (tx: unknown) => unknown) => cb(txMock),
    );
    const handlers = [
      CreateInvoiceHandler,
      FindInvoicesHandler,
      FindInvoiceHandler,
      UpdateInvoiceHandler,
      SetInvoiceLinesHandler,
      SendInvoiceHandler,
      CancelInvoiceHandler,
      RecordPaymentHandler,
      FindPaymentsHandler,
      SendReminderHandler,
      LateInvoicesHandler,
      InvoiceCoverageHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: InvoiceRepository, useValue: repo },
        { provide: PaymentRepository, useValue: paymentsRepo },
        { provide: ClientsService, useValue: clients },
        { provide: ProjectsService, useValue: projectsService },
        { provide: QuotesService, useValue: quotesService },
        { provide: TenantsService, useValue: tenantsService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: AuditService, useValue: audit },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createInvoice = module.get(CreateInvoiceHandler);
    findInvoices = module.get(FindInvoicesHandler);
    findInvoice = module.get(FindInvoiceHandler);
    updateInvoice = module.get(UpdateInvoiceHandler);
    setLines = module.get(SetInvoiceLinesHandler);
    sendInvoice = module.get(SendInvoiceHandler);
    cancelInvoice = module.get(CancelInvoiceHandler);
    recordPayment = module.get(RecordPaymentHandler);
    findPayments = module.get(FindPaymentsHandler);
    sendReminder = module.get(SendReminderHandler);
    lateInvoices = module.get(LateInvoicesHandler);
    invoiceCoverage = module.get(InvoiceCoverageHandler);
  });

  describe('CreateInvoiceHandler', () => {
    const dto = {
      client_id: 1,
      project_id: 20,
      lines: [
        {
          service_id: 5,
          description: 'Deposit',
          quantity: '1',
          unit_price_excl_vat: '1000.00',
          vat_rate: '21.00',
          position: 0,
        },
      ],
    };

    it('rejects an unknown/archived client', async () => {
      clients.findByIdRaw.mockResolvedValue(null);
      await expect(createInvoice.execute(dto, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('defaults due_date to issue_date + tenants.default_payment_days', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      projectsService.findOne.mockResolvedValue({ id: 20 });
      tenantsService.findOne.mockResolvedValue(
        tenant({ defaultPaymentDays: 30 }),
      );
      documentsService.allocateNumber.mockResolvedValue('INV-2026-0001');
      let captured: { dueDate: Date; issueDate: Date } | undefined;
      repo.create.mockImplementation(
        (data: { dueDate: Date; issueDate: Date }) => {
          captured = data;
          return Promise.resolve(invoice());
        },
      );
      repo.findLines.mockResolvedValue([invoiceLine()]);
      repo.setTotals.mockResolvedValue(invoice());

      await createInvoice.execute({ ...dto }, actor);

      expect(captured).toBeDefined();
      const diffDays =
        (captured!.dueDate.getTime() - captured!.issueDate.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(Math.round(diffDays)).toBe(30);
    });

    it('validates an optional quote_id through QuotesService', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      projectsService.findOne.mockResolvedValue({ id: 20 });
      quotesService.findOne.mockResolvedValue({ id: 7 });
      tenantsService.findOne.mockResolvedValue(tenant());
      documentsService.allocateNumber.mockResolvedValue('INV-2026-0001');
      repo.create.mockResolvedValue(invoice({ quoteId: 7 }));
      repo.findLines.mockResolvedValue([invoiceLine()]);
      repo.setTotals.mockResolvedValue(invoice({ quoteId: 7 }));

      await createInvoice.execute({ ...dto, quote_id: 7 }, actor);
      expect(quotesService.findOne).toHaveBeenCalledWith(7);
    });
  });

  describe('FindInvoicesHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[invoice()], 1]);
      const result = await findInvoices.execute({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
    });

    it('filters by late through the view, paginating in memory', async () => {
      repo.findManyLate.mockResolvedValue([invoice(), invoice({ id: 51 })]);
      const result = await findInvoices.execute({
        page: 1,
        limit: 1,
        late: true,
      });
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(repo.findMany).not.toHaveBeenCalled();
    });
  });

  describe('FindInvoiceHandler', () => {
    it('rejects an unknown invoice', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findInvoice.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the invoice with lines and live balance', async () => {
      repo.findById.mockResolvedValue(invoice());
      repo.findLines.mockResolvedValue([invoiceLine()]);
      repo.findWithBalance.mockResolvedValue({
        invoiceId: 50,
        tenantId: 1,
        amountInclVat: new Prisma.Decimal('1210.00'),
        amountPaid: new Prisma.Decimal('0'),
        balanceDue: new Prisma.Decimal('1210.00'),
        isLate: false,
      });
      const result = await findInvoice.execute(50);
      expect(result.lines).toHaveLength(1);
      expect(result.balance?.isLate).toBe(false);
    });
  });

  describe('UpdateInvoiceHandler', () => {
    it('rejects a non-draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      await expect(
        updateInvoice.execute(50, { note: 'x' }, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates a draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice());
      repo.update.mockResolvedValue(invoice({ note: 'Updated' }));
      const result = await updateInvoice.execute(
        50,
        { note: 'Updated' },
        actor,
      );
      expect(result.note).toBe('Updated');
    });
  });

  describe('SetInvoiceLinesHandler', () => {
    const dto = {
      lines: [
        {
          description: 'Deposit',
          quantity: '1',
          unit_price_excl_vat: '1000.00',
          vat_rate: '21.00',
          position: 0,
        },
      ],
    };

    it('rejects a non-draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      await expect(setLines.execute(50, dto, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.replaceLines).not.toHaveBeenCalled();
    });

    it('replaces lines and recomputes totals', async () => {
      repo.findById.mockResolvedValue(invoice());
      repo.findLines.mockResolvedValue([invoiceLine()]);
      repo.setTotals.mockResolvedValue(invoice());
      const result = await setLines.execute(50, dto, actor);
      expect(repo.replaceLines).toHaveBeenCalled();
      expect(result.id).toBe(50);
    });
  });

  describe('SendInvoiceHandler', () => {
    it('rejects a non-draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      await expect(sendInvoice.execute(50, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects with no active client', async () => {
      repo.findById.mockResolvedValue(invoice());
      clients.findByIdRaw.mockResolvedValue(client({ isActive: false }));
      await expect(sendInvoice.execute(50, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invoice with zero lines', async () => {
      repo.findById.mockResolvedValue(invoice());
      clients.findByIdRaw.mockResolvedValue(client());
      repo.findLines.mockResolvedValue([]);
      await expect(sendInvoice.execute(50, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('sends a draft invoice with lines and an active client', async () => {
      repo.findById.mockResolvedValue(invoice());
      clients.findByIdRaw.mockResolvedValue(client());
      repo.findLines.mockResolvedValue([invoiceLine()]);
      repo.setStatus.mockResolvedValue(
        invoice({ status: 'sent', sentAt: FIXED_DATE }),
      );
      const result = await sendInvoice.execute(50, actor);
      expect(result.status).toBe('sent');
    });
  });

  describe('CancelInvoiceHandler', () => {
    it('rejects an already-cancelled invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'cancelled' }));
      await expect(cancelInvoice.execute(50, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('cancels an invoice, keeping its number', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      repo.setStatus.mockResolvedValue(invoice({ status: 'cancelled' }));
      const result = await cancelInvoice.execute(50, actor);
      expect(result.status).toBe('cancelled');
      expect(result.number).toBe('INV-2026-0001');
      expect(repo.setStatus).toHaveBeenCalledWith(50, 'cancelled');
    });
  });

  describe('RecordPaymentHandler', () => {
    const dto = { amount: '1210.00', method: 'transfer' as const };

    it('rejects a non-positive amount', async () => {
      await expect(
        recordPayment.execute(50, { ...dto, amount: '0' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(paymentsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects a payment on a draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'draft' }));
      await expect(recordPayment.execute(50, dto, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a payment on a cancelled invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'cancelled' }));
      await expect(recordPayment.execute(50, dto, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('pays in full -> status paid', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      paymentsRepo.create.mockResolvedValue(payment());
      repo.findWithBalance.mockResolvedValue({
        invoiceId: 50,
        tenantId: 1,
        amountInclVat: new Prisma.Decimal('1210.00'),
        amountPaid: new Prisma.Decimal('1210.00'),
        balanceDue: new Prisma.Decimal('0'),
        isLate: false,
      });
      repo.setStatus.mockResolvedValue(invoice({ status: 'paid' }));
      repo.findLines.mockResolvedValue([invoiceLine()]);

      const result = await recordPayment.execute(50, dto, actor);

      expect(repo.setStatus).toHaveBeenCalledWith(50, 'paid', {}, txMock);
      expect(result.status).toBe('paid');
    });

    it('pays part -> status partially_paid', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      paymentsRepo.create.mockResolvedValue(
        payment({ amount: new Prisma.Decimal('500.00') }),
      );
      repo.findWithBalance.mockResolvedValue({
        invoiceId: 50,
        tenantId: 1,
        amountInclVat: new Prisma.Decimal('1210.00'),
        amountPaid: new Prisma.Decimal('500.00'),
        balanceDue: new Prisma.Decimal('710.00'),
        isLate: false,
      });
      repo.setStatus.mockResolvedValue(invoice({ status: 'partially_paid' }));
      repo.findLines.mockResolvedValue([invoiceLine()]);

      const result = await recordPayment.execute(
        50,
        { amount: '500.00', method: 'transfer' },
        actor,
      );

      expect(repo.setStatus).toHaveBeenCalledWith(
        50,
        'partially_paid',
        {},
        txMock,
      );
      expect(result.status).toBe('partially_paid');
    });

    it('never writes overdue', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      paymentsRepo.create.mockResolvedValue(payment());
      repo.findWithBalance.mockResolvedValue({
        invoiceId: 50,
        tenantId: 1,
        amountInclVat: new Prisma.Decimal('1210.00'),
        amountPaid: new Prisma.Decimal('1210.00'),
        balanceDue: new Prisma.Decimal('0'),
        isLate: true,
      });
      repo.setStatus.mockResolvedValue(invoice({ status: 'paid' }));
      repo.findLines.mockResolvedValue([invoiceLine()]);

      await recordPayment.execute(50, dto, actor);

      expect(repo.setStatus).toHaveBeenCalledWith(50, 'paid', {}, txMock);
      expect(repo.setStatus).not.toHaveBeenCalledWith(
        50,
        'overdue',
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('FindPaymentsHandler', () => {
    it('rejects an unknown invoice', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findPayments.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the ledger for an invoice', async () => {
      repo.findById.mockResolvedValue(invoice());
      paymentsRepo.findByInvoice.mockResolvedValue([payment()]);
      const result = await findPayments.execute(50);
      expect(result).toHaveLength(1);
    });
  });

  describe('SendReminderHandler', () => {
    it('rejects a draft invoice', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'draft' }));
      await expect(sendReminder.execute(50, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('bumps reminder_count and last_reminder_at', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'sent' }));
      repo.bumpReminder.mockResolvedValue(
        invoice({ reminderCount: 1, lastReminderAt: FIXED_DATE }),
      );
      const result = await sendReminder.execute(50, actor);
      expect(result.reminderCount).toBe(1);
    });
  });

  describe('LateInvoicesHandler', () => {
    it('fires an alert (log) for every late invoice and writes no status', async () => {
      repo.findLate.mockResolvedValue([
        {
          invoiceId: 50,
          tenantId: 1,
          amountInclVat: new Prisma.Decimal('1210.00'),
          amountPaid: new Prisma.Decimal('0'),
          balanceDue: new Prisma.Decimal('1210.00'),
          isLate: true,
        },
      ]);
      const result = await lateInvoices.execute();
      expect(result.lateCount).toBe(1);
      expect(repo.setStatus).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('InvoiceCoverageHandler', () => {
    it('returns no warning when invoiced matches accepted quotes', async () => {
      repo.sumByProject.mockResolvedValue(new Prisma.Decimal('10000.00'));
      quotesService.sumAcceptedByProject.mockResolvedValue(
        new Prisma.Decimal('10000.00'),
      );
      const result = await invoiceCoverage.execute(20);
      expect(result.warning).toBe(false);
    });

    it('returns a warning when invoiced is less than accepted quotes, but never blocks', async () => {
      repo.sumByProject.mockResolvedValue(new Prisma.Decimal('9500.00'));
      quotesService.sumAcceptedByProject.mockResolvedValue(
        new Prisma.Decimal('10000.00'),
      );
      const result = await invoiceCoverage.execute(20);
      expect(result.warning).toBe(true);
      expect(result.message).toBeTruthy();
    });
  });
});
