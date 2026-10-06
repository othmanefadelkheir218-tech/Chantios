import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { CostTypesService } from '../../cost-types/cost-types.service';
import { DocumentsService } from '../../documents/documents.service';
import { ProjectsService } from '../../projects/projects.service';
import { SubcontractorsService } from '../../subcontractors/subcontractors.service';
import { SuppliersService } from '../../suppliers/suppliers.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import {
  assertMaterialBillHasNoProject,
  computeBillAmounts,
  getSourcePairingError,
} from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';
import { CreatePurchaseInvoiceHandler } from './create-purchase-invoice.handler';
import { MarkPaidHandler } from './mark-paid.handler';
import { UpdatePurchaseInvoiceHandler } from './update-purchase-invoice.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const FIXED = new Date('2026-10-06T00:00:00Z');

const invoice = (over: Record<string, unknown> = {}) => ({
  id: 5,
  tenantId: 1,
  type: 'supplier',
  costTypeId: 2,
  subcontractorContractId: null,
  supplierId: 7,
  projectId: null,
  number: 'PUR-2026-0001',
  externalNumber: null,
  amountExclVat: '100.00',
  vatRate: '21.00',
  vatAmount: '21.00',
  amountInclVat: '121.00',
  issueDate: FIXED,
  dueDate: null,
  status: 'to_pay',
  paymentReference: null,
  paidAt: null,
  createdBy: 1,
  createdAt: FIXED,
  updatedAt: FIXED,
  ...over,
});

const dto = (over: Partial<CreatePurchaseInvoiceDto> = {}) =>
  ({
    type: 'supplier',
    cost_type_id: 2,
    supplier_id: 7,
    amount_excl_vat: '100.00',
    vat_rate: '21.00',
    issue_date: '2026-10-06',
    ...over,
  }) as CreatePurchaseInvoiceDto;

describe('purchase-invoice helper — the two rules', () => {
  it('subcontractor needs a contract, no supplier, and a project', () => {
    expect(getSourcePairingError('subcontractor', 1, null, 3)).toBeNull();
    expect(getSourcePairingError('subcontractor', null, null, 3)).toMatch(
      /contract/,
    );
    expect(getSourcePairingError('subcontractor', 1, 7, 3)).toMatch(/supplier/);
    expect(getSourcePairingError('subcontractor', 1, null, null)).toMatch(
      /project_id/,
    );
  });

  it('supplier needs a supplier and no contract; a project is optional', () => {
    expect(getSourcePairingError('supplier', null, 7, null)).toBeNull();
    expect(getSourcePairingError('supplier', null, 7, 3)).toBeNull();
    expect(getSourcePairingError('supplier', null, null, null)).toMatch(
      /supplier_id/,
    );
    expect(getSourcePairingError('supplier', 1, 7, null)).toMatch(/contract/);
  });

  it('a material bill with a project is refused, without one it is fine', () => {
    expect(() => assertMaterialBillHasNoProject('material', 3)).toThrow(
      BadRequestException,
    );
    expect(() =>
      assertMaterialBillHasNoProject('material', null),
    ).not.toThrow();
    expect(() => assertMaterialBillHasNoProject('insurance', 3)).not.toThrow();
  });

  it('computes VAT through the shared per-rate helper', () => {
    expect(computeBillAmounts('100.00', '21.00')).toEqual({
      amountExclVat: '100.00',
      vatAmount: '21.00',
      amountInclVat: '121.00',
    });
    expect(computeBillAmounts('10.10', '6.00').vatAmount).toBe('0.61');
  });
});

describe('Purchase invoice handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    markPaid: jest.fn(),
  };
  const tx = {};
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const documents = { allocateNumber: jest.fn() };
  const costTypes = { findVisibleById: jest.fn() };
  const subcontractors = { findContractByIdRaw: jest.fn() };
  const suppliers = { findByIdRaw: jest.fn() };
  const projects = { findOne: jest.fn() };
  const tenants = { findOne: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreatePurchaseInvoiceHandler;
  let update: UpdatePurchaseInvoiceHandler;
  let markPaid: MarkPaidHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    const handlers = [
      CreatePurchaseInvoiceHandler,
      UpdatePurchaseInvoiceHandler,
      MarkPaidHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: PurchaseInvoiceRepository, useValue: repo },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: DocumentsService, useValue: documents },
        { provide: CostTypesService, useValue: costTypes },
        { provide: SubcontractorsService, useValue: subcontractors },
        { provide: SuppliersService, useValue: suppliers },
        { provide: ProjectsService, useValue: projects },
        { provide: TenantsService, useValue: tenants },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreatePurchaseInvoiceHandler);
    update = module.get(UpdatePurchaseInvoiceHandler);
    markPaid = module.get(MarkPaidHandler);
  });

  describe('CreatePurchaseInvoiceHandler', () => {
    it('creates a supplier bill: number from the shared counter, VAT computed', async () => {
      costTypes.findVisibleById.mockResolvedValue({
        id: 2,
        name: 'material',
        isActive: true,
      });
      suppliers.findByIdRaw.mockResolvedValue({ id: 7, isActive: true });
      documents.allocateNumber.mockResolvedValue('PUR-2026-0001');
      repo.create.mockResolvedValue(invoice());

      const result = await create.execute(dto(), actor);

      expect(documents.allocateNumber).toHaveBeenCalledWith(
        'purchase_invoice',
        tx,
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'supplier',
          projectId: null,
          vatAmount: '21.00',
          amountInclVat: '121.00',
          status: 'to_pay',
        }),
        'PUR-2026-0001',
        tx,
      );
      expect(result.number).toBe('PUR-2026-0001');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('refuses a material bill that carries a project', async () => {
      costTypes.findVisibleById.mockResolvedValue({
        id: 2,
        name: 'material',
        isActive: true,
      });
      suppliers.findByIdRaw.mockResolvedValue({ id: 7, isActive: true });

      await expect(
        create.execute(dto({ project_id: 3 }), actor),
      ).rejects.toThrow(/material bill cannot carry a project/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('refuses a subcontractor bill with no project', async () => {
      await expect(
        create.execute(
          dto({
            type: 'subcontractor',
            supplier_id: undefined,
            subcontractor_contract_id: 4,
          }),
          actor,
        ),
      ).rejects.toThrow(/project_id is required/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('refuses a supplier bill with no supplier_id', async () => {
      await expect(
        create.execute(dto({ supplier_id: undefined }), actor),
      ).rejects.toThrow(/supplier_id is required/);
    });

    it("refuses a subcontractor bill whose project is not the contract's", async () => {
      costTypes.findVisibleById.mockResolvedValue({
        id: 1,
        name: 'subcontractor',
        isActive: true,
      });
      subcontractors.findContractByIdRaw.mockResolvedValue({
        id: 4,
        projectId: 99,
      });

      await expect(
        create.execute(
          dto({
            type: 'subcontractor',
            supplier_id: undefined,
            subcontractor_contract_id: 4,
            project_id: 3,
          }),
          actor,
        ),
      ).rejects.toThrow(/contract's project/);
    });

    it('accepts two bills on one contract (no uniqueness on the contract)', async () => {
      costTypes.findVisibleById.mockResolvedValue({
        id: 1,
        name: 'subcontractor',
        isActive: true,
      });
      subcontractors.findContractByIdRaw.mockResolvedValue({
        id: 4,
        projectId: 3,
      });
      projects.findOne.mockResolvedValue({ id: 3, status: 'in_progress' });
      documents.allocateNumber
        .mockResolvedValueOnce('PUR-2026-0001')
        .mockResolvedValueOnce('PUR-2026-0002');
      repo.create.mockResolvedValue(invoice({ type: 'subcontractor' }));

      const body = dto({
        type: 'subcontractor',
        supplier_id: undefined,
        subcontractor_contract_id: 4,
        project_id: 3,
        cost_type_id: 1,
      });
      await create.execute(body, actor);
      await create.execute(body, actor);
      expect(repo.create).toHaveBeenCalledTimes(2);
    });

    it('defaults vat_rate to the tenant default', async () => {
      costTypes.findVisibleById.mockResolvedValue({
        id: 2,
        name: 'insurance',
        isActive: true,
      });
      suppliers.findByIdRaw.mockResolvedValue({ id: 7, isActive: true });
      tenants.findOne.mockResolvedValue({ defaultVatRate: '6.00' });
      documents.allocateNumber.mockResolvedValue('PUR-2026-0001');
      repo.create.mockResolvedValue(invoice());

      await create.execute(dto({ vat_rate: undefined }), actor);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ vatRate: '6.00', vatAmount: '6.00' }),
        'PUR-2026-0001',
        tx,
      );
    });

    it('refuses a negative amount', async () => {
      await expect(
        create.execute(dto({ amount_excl_vat: '-5.00' }), actor),
      ).rejects.toThrow(/must not be negative/);
    });
  });

  describe('UpdatePurchaseInvoiceHandler', () => {
    it('recomputes VAT when the amount changes', async () => {
      repo.findById.mockResolvedValue(invoice());
      costTypes.findVisibleById.mockResolvedValue({
        id: 2,
        name: 'insurance',
        isActive: true,
      });
      repo.update.mockResolvedValue(invoice({ amountExclVat: '200.00' }));

      await update.execute(5, { amount_excl_vat: '200.00' }, actor);
      expect(repo.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          amountExclVat: '200.00',
          vatAmount: '42.00',
          amountInclVat: '242.00',
        }),
      );
    });

    it('refuses to attach a project to a bill whose cost type is material', async () => {
      repo.findById.mockResolvedValue(invoice());
      costTypes.findVisibleById.mockResolvedValue({
        id: 2,
        name: 'material',
        isActive: true,
      });

      await expect(update.execute(5, { project_id: 3 }, actor)).rejects.toThrow(
        /material bill cannot carry a project/,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('MarkPaidHandler', () => {
    it('sets paid, paid_at and the reference', async () => {
      repo.findById.mockResolvedValue(invoice());
      repo.markPaid.mockResolvedValue(
        invoice({ status: 'paid', paidAt: FIXED, paymentReference: 'TRF-1' }),
      );

      const result = await markPaid.execute(
        5,
        { payment_reference: 'TRF-1' },
        actor,
      );
      expect(repo.markPaid).toHaveBeenCalledWith(5, expect.any(Date), 'TRF-1');
      expect(result.status).toBe('paid');
    });

    it('refuses a bill that is already paid', async () => {
      repo.findById.mockResolvedValue(invoice({ status: 'paid' }));
      await expect(markPaid.execute(5, {}, actor)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.markPaid).not.toHaveBeenCalled();
    });
  });
});
