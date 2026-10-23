import { BadGatewayException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PushOverageInvoiceItemHandler } from './push-overage-invoice-item.handler';
import {
  REVERSE_CHARGE_FOOTER,
  SyncSubscriptionTaxHandler,
} from './sync-subscription-tax.handler';

const mockStripe = {
  customers: {
    update: jest.fn(),
    listTaxIds: jest.fn(),
    deleteTaxId: jest.fn(),
    createTaxId: jest.fn(),
  },
  subscriptions: { update: jest.fn() },
  invoiceItems: { create: jest.fn() },
};
// A getter: the handlers are imported (above) before `mockStripe` exists.
jest.mock('../../config/stripe.config', () => ({
  get stripe() {
    return mockStripe;
  },
}));

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('SyncSubscriptionTaxHandler (step 27, C2)', () => {
  const handler = new SyncSubscriptionTaxHandler(logger as never);
  const input = {
    customerId: 'cus_1',
    subscriptionId: 'sub_1',
    taxRateId: 'txr_rc',
    reverseCharge: true,
    euVatNumber: 'FR12345678901',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStripe.customers.listTaxIds.mockResolvedValue({ data: [] });
  });

  it('reverse charge: footer, subscription TaxRate, TVA number', async () => {
    await handler.execute(input);
    expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_1', {
      invoice_settings: { footer: REVERSE_CHARGE_FOOTER },
    });
    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_1', {
      default_tax_rates: ['txr_rc'],
    });
    expect(mockStripe.customers.createTaxId).toHaveBeenCalledWith('cus_1', {
      type: 'eu_vat',
      value: 'FR12345678901',
    });
  });

  it('normal rate, no subscription yet: footer cleared, old number removed', async () => {
    mockStripe.customers.listTaxIds.mockResolvedValue({
      data: [{ id: 'txi_old', type: 'eu_vat', value: 'FR999' }],
    });
    await handler.execute({
      ...input,
      subscriptionId: null,
      reverseCharge: false,
      euVatNumber: null,
    });
    expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_1', {
      invoice_settings: { footer: '' },
    });
    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
    expect(mockStripe.customers.deleteTaxId).toHaveBeenCalledWith(
      'cus_1',
      'txi_old',
    );
    expect(mockStripe.customers.createTaxId).not.toHaveBeenCalled();
  });

  it('the same number already there → nothing touched', async () => {
    mockStripe.customers.listTaxIds.mockResolvedValue({
      data: [{ id: 'txi_1', type: 'eu_vat', value: 'FR12345678901' }],
    });
    await handler.execute(input);
    expect(mockStripe.customers.deleteTaxId).not.toHaveBeenCalled();
    expect(mockStripe.customers.createTaxId).not.toHaveBeenCalled();
  });

  it('Stripe refuses the number → logged, the rate stays synced', async () => {
    mockStripe.customers.createTaxId.mockRejectedValue(new Error('invalid'));
    await expect(handler.execute(input)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('Stripe down → 502 (the job retries)', async () => {
    mockStripe.customers.update.mockRejectedValueOnce(new Error('down'));
    await expect(handler.execute(input)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

describe('PushOverageInvoiceItemHandler + TVA (step 27, C3)', () => {
  const handler = new PushOverageInvoiceItemHandler(logger as never);
  beforeEach(() => jest.clearAllMocks());

  it('sets the TaxRate on the overage item explicitly', async () => {
    await handler.execute(
      'cus_1',
      new Prisma.Decimal(4),
      'Overage',
      'k1',
      'in_1',
      'txr_be',
    );
    expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 400,
        invoice: 'in_1',
        tax_rates: ['txr_be'],
      }),
      { idempotencyKey: 'k1' },
    );
  });

  it('no TaxRate → no tax_rates field', async () => {
    await handler.execute('cus_1', new Prisma.Decimal(4), 'Overage', 'k1');
    const params = (
      mockStripe.invoiceItems.create.mock.calls[0] as [object]
    )[0];
    expect(params).not.toHaveProperty('tax_rates');
  });
});
